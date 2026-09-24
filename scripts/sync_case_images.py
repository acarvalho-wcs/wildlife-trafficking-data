#!/usr/bin/env python3
"""Resolve direct article-image URLs for cases.json without copying source images.

The resolver is deliberately conservative:
- preserves any existing validated image_url;
- uses source-hosted metadata first (og:image, twitter:image, JSON-LD);
- uses an existing image_source_url when it resolves to an actual image;
- follows image_source_page (or an HTML-valued image_source_url) and extracts its article image metadata;
- only accepts HTTP(S) responses whose Content-Type is image/*;
- rejects obvious logos/icons/avatars/ads;
- never invents an image when no reliable candidate is found.

It updates cases.json and writes image-resolution-report.json.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

UA = (
    "Mozilla/5.0 (compatible; WildlifeTraffickingObservatory/1.0; "
    "+https://acarvalho-wcs.github.io/wildlife-trafficking-data/)"
)
TIMEOUT = 20
MAX_BYTES = 8 * 1024 * 1024
BAD_TOKENS = {
    "logo", "favicon", "avatar", "author", "profile", "icon", "sprite",
    "banner", "advert", "ads.", "placeholder", "default-image", "default_image",
    "tracking", "pixel", "matomo", "analytics", "gravatar", "emoji"
}
GOOD_TOKENS = {
    "wildlife", "animal", "fauna", "seiz", "apre", "traf", "ivory", "marfim",
    "bird", "ave", "rept", "turtle", "tortoise", "pangolin", "shark", "ray",
    "fish", "elephant", "rhino", "parrot", "cockatoo", "lory", "tusk", "horn"
}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def norm_url(value: str | None, base: str | None = None) -> str | None:
    if not value:
        return None
    value = value.strip()
    if value.startswith("//"):
        value = "https:" + value
    elif base:
        value = urljoin(base, value)
    if not value.startswith(("http://", "https://")):
        return None
    return value


def obvious_bad(url: str) -> bool:
    low = url.lower()
    return any(tok in low for tok in BAD_TOKENS)


def score_candidate(url: str, method: str, alt: str = "") -> int:
    score = {
        "existing_direct": 100,
        "existing_source_media": 95,
        "og:image": 90,
        "twitter:image": 85,
        "jsonld:image": 80,
        "article_img": 60,
        "page_img": 35,
    }.get(method, 0)
    low = (url + " " + alt).lower()
    if obvious_bad(url):
        score -= 100
    score += sum(3 for tok in GOOD_TOKENS if tok in low)
    if re.search(r"\.(?:jpe?g|png|webp)(?:$|[?#])", low):
        score += 8
    if any(x in low for x in ("/uploads/", "/media/", "/images/", "@@images")):
        score += 4
    return score


def validate_image(session: requests.Session, url: str) -> tuple[bool, str | None, str | None]:
    """Return (valid, final_url, content_type)."""
    try:
        with session.get(url, timeout=TIMEOUT, allow_redirects=True, stream=True) as resp:
            if resp.status_code >= 400:
                return False, None, None
            ctype = (resp.headers.get("content-type") or "").split(";")[0].strip().lower()
            if not ctype.startswith("image/"):
                return False, None, ctype or None
            if ctype in {"image/svg+xml"}:
                return False, None, ctype
            length = resp.headers.get("content-length")
            if length and length.isdigit() and int(length) > MAX_BYTES:
                return False, None, ctype
            return True, resp.url, ctype
    except requests.RequestException:
        return False, None, None


def add_candidate(cands: list[dict], value, base, method, alt=""):
    if isinstance(value, dict):
        value = value.get("url") or value.get("contentUrl")
    if isinstance(value, list):
        for v in value:
            add_candidate(cands, v, base, method, alt)
        return
    if not isinstance(value, str):
        return
    u = norm_url(value, base)
    if not u:
        return
    cands.append({"url": u, "method": method, "alt": alt or "", "score": score_candidate(u, method, alt)})


def jsonld_images(soup: BeautifulSoup, base: str, cands: list[dict]) -> None:
    for node in soup.find_all("script", attrs={"type": re.compile(r"ld\+json", re.I)}):
        raw = node.string or node.get_text(" ", strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            obj = stack.pop()
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in {"image", "thumbnailUrl", "contentUrl"}:
                        add_candidate(cands, value, base, "jsonld:image")
                    elif isinstance(value, (dict, list)):
                        stack.append(value)
            elif isinstance(obj, list):
                stack.extend(obj)


def extract_page_candidates(session: requests.Session, page_url: str, cands: list[dict]) -> str | None:
    """Extract image candidates from one HTML page into cands."""
    try:
        resp = session.get(page_url, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code >= 400:
            return f"source_http_{resp.status_code}"
        ctype = (resp.headers.get("content-type") or "").lower()
        if "text/html" not in ctype and "<html" not in resp.text[:500].lower():
            return f"source_not_html:{ctype or 'unknown'}"
        base = resp.url
        soup = BeautifulSoup(resp.text, "html.parser")

        for prop in ("og:image:secure_url", "og:image:url", "og:image"):
            for tag in soup.find_all("meta", attrs={"property": prop}):
                add_candidate(cands, tag.get("content"), base, "og:image")

        for name in ("twitter:image", "twitter:image:src"):
            for tag in soup.find_all("meta", attrs={"name": name}):
                add_candidate(cands, tag.get("content"), base, "twitter:image")

        jsonld_images(soup, base, cands)

        selectors = (
            "article img",
            "main img",
            "[role=main] img",
            ".article img",
            ".article-content img",
            ".entry-content img",
            ".post-content img",
            ".news-content img",
            "#content img",
        )
        seen_nodes = set()
        for selector in selectors:
            for img in soup.select(selector):
                ident = id(img)
                if ident in seen_nodes:
                    continue
                seen_nodes.add(ident)
                src = (
                    img.get("src")
                    or img.get("data-src")
                    or img.get("data-lazy-src")
                    or img.get("data-original")
                )
                if not src:
                    srcset = img.get("srcset") or img.get("data-srcset")
                    if srcset:
                        src = srcset.split(",")[-1].strip().split(" ")[0]
                add_candidate(cands, src, base, "article_img", img.get("alt") or "")

        if not cands:
            for img in soup.find_all("img"):
                add_candidate(cands, img.get("src") or img.get("data-src"), base, "page_img", img.get("alt") or "")
        return None
    except requests.RequestException as exc:
        return f"source_request_error:{exc.__class__.__name__}"


def extract_candidates(
    session: requests.Session,
    source_url: str,
    image_source_url: str | None,
    image_source_page: str | None = None,
) -> tuple[list[dict], str | None]:
    cands: list[dict] = []

    # image_source_url may be either a direct media URL (legacy records) or,
    # in some manually curated records, an HTML page. Keep supporting both.
    if image_source_url:
        u = norm_url(image_source_url)
        if u:
            add_candidate(cands, u, source_url, "existing_source_media")
            if u.endswith("/view"):
                add_candidate(cands, u[:-5], source_url, "existing_source_media")

    page_urls: list[str] = []
    for value in (source_url, image_source_page):
        u = norm_url(value)
        if u and u not in page_urls:
            page_urls.append(u)

    # If image_source_url looks like an HTML page rather than media, crawl it
    # as a fallback source page too.
    isu = norm_url(image_source_url)
    if isu and not re.search(r"\.(?:jpe?g|png|webp|gif|avif)(?:$|[?#])", isu, re.I):
        if isu not in page_urls:
            page_urls.append(isu)

    notes: list[str] = []
    for page_url in page_urls:
        note = extract_page_candidates(session, page_url, cands)
        if note:
            notes.append(f"{page_url}:{note}")

    return cands, "; ".join(notes) if notes else None


def resolve_case(session: requests.Session, case: dict) -> dict:
    result = {
        "id": case.get("id"),
        "source_url": case.get("source_url"),
        "existing_image_url": case.get("image_url"),
        "resolved": False,
        "method": None,
        "image_url": None,
        "note": None,
    }

    existing = norm_url(case.get("image_url"))
    if existing:
        ok, final, ctype = validate_image(session, existing)
        if ok:
            case["image_url"] = final or existing
            case["image_status"] = "DIRECT_IMAGE_URL_VALIDATED"
            case["image_resolution_method"] = "existing_direct"
            case["image_checked_at"] = now_iso()
            result.update(resolved=True, method="existing_direct", image_url=case["image_url"], note=ctype)
            return result

    source = norm_url(case.get("source_url"))
    if not source:
        result["note"] = "no_source_url"
        return result

    cands, source_note = extract_candidates(\n        session,\n        source,\n        case.get("image_source_url"),\n        case.get("image_source_page"),\n    )
    dedup = {}
    for c in cands:
        old = dedup.get(c["url"])
        if old is None or c["score"] > old["score"]:
            dedup[c["url"]] = c
    ordered = sorted(dedup.values(), key=lambda x: x["score"], reverse=True)

    for cand in ordered[:18]:
        if cand["score"] < 35:
            continue
        ok, final, ctype = validate_image(session, cand["url"])
        if not ok:
            continue
        chosen = final or cand["url"]
        if obvious_bad(chosen):
            continue
        case["image_url"] = chosen
        case["image_source_url"] = case.get("image_source_url") or source
        case["image_status"] = "DIRECT_IMAGE_URL_VALIDATED"
        case["image_resolution_method"] = cand["method"]
        case["image_checked_at"] = now_iso()
        result.update(resolved=True, method=cand["method"], image_url=chosen, note=ctype)
        return result

    case["image_checked_at"] = now_iso()
    if case.get("image_source_url"):
        case["image_status"] = "SOURCE_PAGE_HAS_IMAGE_UNRESOLVED_DIRECT_URL"
    else:
        case["image_status"] = "SOURCE_PAGE_IMAGE_NOT_RESOLVED"
    result["note"] = source_note or "no_valid_direct_image"
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", default="cases.json")
    ap.add_argument("--report", default="image-resolution-report.json")
    ap.add_argument("--sleep", type=float, default=0.15)
    args = ap.parse_args()

    cases_path = Path(args.cases)
    data = json.loads(cases_path.read_text(encoding="utf-8"))
    cases = data["cases"] if isinstance(data, dict) else data

    session = requests.Session()
    session.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7,es;q=0.6",
    })

    results = []
    for idx, case in enumerate(cases, 1):
        try:
            results.append(resolve_case(session, case))
        except Exception as exc:
            results.append({
                "id": case.get("id"),
                "source_url": case.get("source_url"),
                "resolved": False,
                "note": f"unexpected:{exc.__class__.__name__}",
            })
        print(f"[{idx}/{len(cases)}] {case.get('id')} -> {results[-1].get('image_url') or results[-1].get('note')}", flush=True)
        if args.sleep:
            time.sleep(args.sleep)

    resolved = sum(1 for r in results if r.get("resolved"))
    now = now_iso()
    if isinstance(data, dict):
        data["image_progress"] = {
            "records_total": len(cases),
            "direct_image_urls_validated": resolved,
            "unresolved": len(cases) - resolved,
            "resolution_policy": "Source-hosted direct URLs only; no image copying. Metadata and article images are accepted only after image/* validation.",
            "updated_at": now,
        }

    cases_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {
        "generated_at": now,
        "records_total": len(cases),
        "resolved_direct_images": resolved,
        "unresolved": len(cases) - resolved,
        "results": results,
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("generated_at", "records_total", "resolved_direct_images", "unresolved")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

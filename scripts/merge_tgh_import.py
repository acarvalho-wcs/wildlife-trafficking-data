#!/usr/bin/env python3
"""Apply validated TG-H import batches atomically to the canonical JSON feeds."""
import datetime
import glob
import json
from pathlib import Path

def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def write(path, obj):
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

cases = read("cases.json")
routes = read("routes.json")
seen_ids = {c["id"] for c in cases["cases"]}
seen_sources = {(c.get("source_url") or "").rstrip("/") for c in cases["cases"]}
seen_routes = {r["id"] for r in routes["routes"]}
new_cases = 0
new_routes = 0
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
for filename in sorted(glob.glob("imports/tgh-*.json")):
    batch = read(filename)
    assert batch.get("validated") is True and batch.get("batch"), filename
    records = batch.get("cases", [])
    ritems = batch.get("routes", [])
    for c in records:
        assert c.get("status") == "VALIDATED" and c.get("id") and c.get("source_url"), c
        assert c.get("target_taxon") == "Amazona aestiva", c["id"]
        for lang in ("pt", "en", "es"):
            assert c.get("title_" + lang) and c.get("card_text_" + lang) and c.get("context_" + lang), c["id"]
        key = c["source_url"].rstrip("/")
        if c["id"] in seen_ids or key in seen_sources:
            print("SKIP existing case:", c["id"])
            continue
        cases["cases"].append(c)
        seen_ids.add(c["id"])
        seen_sources.add(key)
        new_cases += 1
    for r in ritems:
        assert r.get("status") == "DOCUMENTED" and r.get("line_style") == "solid", r
        assert r.get("source_url") and r.get("segments"), r
        assert r.get("event_match", {}).get("event_id") in seen_ids, r
        if r["id"] in seen_routes:
            print("SKIP existing route:", r["id"])
            continue
        routes["routes"].append(r)
        seen_routes.add(r["id"])
        new_routes += 1
    if records:
        old_batches = cases.get("ingestion_history", [])
        if not any(b.get("batch") == batch["batch"] for b in old_batches):
            old_batches.append({"batch": batch["batch"], "count": len(records), "confidence": "CONFIRMED_SOURCE_EVENTS", "added_at": now})
            cases["ingestion_history"] = old_batches
if new_cases or new_routes:
    cases["count"] = len(cases["cases"])
    cases["migration_status"] = "LIVE_GITHUB_DATA_%s_CASES" % cases["count"]
    cases["updated_at"] = now
    routes["updated_at"] = now
    write("cases.json", cases)
    write("routes.json", routes)
print("TG-H import:", new_cases, "new cases;", new_routes, "new routes")

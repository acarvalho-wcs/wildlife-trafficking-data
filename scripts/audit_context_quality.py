#!/usr/bin/env python3
"""Advisory context-quality audit; never fabricates references or changes records.

Usage:
 python scripts/audit_context_quality.py --root cases --output context-audit.json
 python scripts/audit_context_quality.py --root cases --recent 60 --strict
A human editor must confirm relevance against the scientific, news and institutional
repositories before adding any citation. This audit detects structural/boilerplate risk.
"""
import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

LANGS = ("pt", "en", "es")
TAG = re.compile(r"\[([OSNI])(\d+)\]")
BOILERPLATE = [
    r"cobertura complementar da ocorr[eê]ncia",
    r"n[aã]o estabelece, por si s[oó], v[ií]nculos",
    r"rela[cç][aã]o com a ci[eê]ncia: literatura cient[ií]fica",
    r"rela[cç][aã]o com reportagens: cobertura complementar",
    r"n[aã]o estabelece rela[cç][oõ]es verificadas com outras apreens[oõ]es",
    r"thematic context only",
    r"scientific literature on wildlife trafficking is used only",
    r"does not, by itself, establish links",
    r"la cobertura complementaria no establece por s[ií] sola",
    r"simplemente como contexto",
    r"o estudo do reposit[oó]rio cient[ií]fico",
    r"reportagens do reposit[oó]rio documentam",
    r"pesquisas do reposit[oó]rio cient[ií]fico descrevem",
    r"no independently verified additional report",
]
BOILERPLATE = [re.compile(x, re.I) for x in BOILERPLATE]
LINK = re.compile(r"https?://[^\s;\]]+", re.I)
def scan_case(path):
    case=json.loads(path.read_text(encoding="utf-8"))
    issues=[]
    refs=case.get("context_references") or []
    refids={str(r.get("id") or "") for r in refs if isinstance(r,dict)}
    refurl={str(r.get("id") or ""):r.get("url") for r in refs if isinstance(r,dict)}
    for lang in LANGS:
        ctx=case.get("context_"+lang) or ""
        bibliography=case.get("references_text_"+lang) or ""
        for pattern in BOILERPLATE:
            if pattern.search(ctx):
                issues.append(dict(lang=lang,code="BOILERPLATE",severity="warning"))
                break
        used=set(m.group(1)+m.group(2) for m in TAG.finditer(ctx))
        for marker in used:
            if marker[0] != "O" and marker not in refids and marker not in set(m.group(1)+m.group(2) for m in TAG.finditer(bibliography)):
                issues.append(dict(lang=lang,code="CITATION_WITHOUT_REFERENCE",marker=marker,severity="warning"))
        for marker in refids:
            if marker[:1] in ("S","N","I") and marker not in used and not re.search(r"\["+re.escape(marker)+r"\]",bibliography):
                issues.append(dict(lang=lang,code="ORPHAN_REFERENCE",marker=marker,severity="warning"))
        if not ctx.strip(): issues.append(dict(lang=lang,code="EMPTY_CONTEXT",severity="error"))
    for r in refs:
        marker=r.get("id","")
        if str(marker).startswith(("S","N","I")):
            url=r.get("url") or ""
            if not urlparse(url).scheme or not urlparse(url).netloc:
                issues.append(dict(code="UNRESOLVED_REFERENCE_URL",marker=marker,severity="warning"))
            if str(marker).startswith("I"):
                issues.append(dict(code="INSTITUTIONAL_DOC_REQUIRES_CATALOG_VERIFICATION",marker=marker,severity="review"))
    count=Counter(z["code"] for z in issues)
    return {"id":case.get("id",path.stem),"path":str(path),"issues":issues,"flag_count":len(issues),"codes":dict(count)}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",default="cases")
    p.add_argument("--output",default=None)
    p.add_argument("--recent",type=int,default=0,help="Audit N newest case files lexicographically; 0 audits all")
    p.add_argument("--strict",action="store_true",help="Fail on error-level findings only")
    a=p.parse_args()
    files=sorted(x for x in Path(a.root).rglob("*.json") if x.name!="_manifest.json")
    if a.recent: files=files[-a.recent:]
    cases=[scan_case(f) for f in files]
    issues=Counter(z["code"] for c in cases for z in c["issues"])
    report={"scope":{"root":a.root,"files_checked":len(files)},"note":"Heuristic audit only: zero warnings does not prove contextual quality or source accuracy.","issue_counts":dict(issues),"cases_flagged":sum(bool(c["issues"]) for c in cases),"records":cases}
    if a.output: Path(a.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k!="records"},ensure_ascii=False,indent=2))
    if a.strict and any(i["severity"]=="error" for c in cases for i in c["issues"]): raise SystemExit(1)
if __name__=="__main__": main()

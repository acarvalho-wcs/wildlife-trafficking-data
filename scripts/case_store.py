#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

REQUIRED = [
    "id","location_label_pt","country","publication_date","fauna_label_pt",
    "taxon_text","modal_primary","card_text_pt","status"
]

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def dump_json(path, data):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def extract_records(payload):
    if isinstance(payload, list):
        return payload, {"top_level": "array", "records_key": None, "passthrough": {}}
    if isinstance(payload, dict):
        for key in ("cases","records","data"):
            if isinstance(payload.get(key), list):
                passthrough = {k:v for k,v in payload.items() if k != key}
                return payload[key], {"top_level": "object", "records_key": key, "passthrough": passthrough}
    raise ValueError("Unsupported cases.json top-level structure")

def safe_slug(value):
    s = str(value or "case").strip().lower()
    s = re.sub(r"[^a-z0-9._-]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-._")
    return s[:120] or "case"

def partition(record):
    date = record.get("event_date") or record.get("publication_date") or ""
    m = re.match(r"^(\d{4})-(\d{2})", str(date))
    return (m.group(1), m.group(2)) if m else ("undated","00")

def record_path(root, record, used):
    year, month = partition(record)
    base = safe_slug(record.get("id"))
    rel = Path(year) / month / f"{base}.json"
    if str(rel) in used:
        digest = hashlib.sha1(json.dumps(record, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:8]
        rel = Path(year) / month / f"{base}-{digest}.json"
    used.add(str(rel))
    return root / rel, rel.as_posix()

def validate_records(records):
    errors=[]; seen={}
    for i, rec in enumerate(records):
        if not isinstance(rec, dict):
            errors.append(f"[{i}] record is not an object")
            continue
        for k in REQUIRED:
            if k not in rec:
                errors.append(f"[{i}] missing required field: {k}")
        rid = rec.get("id")
        if rid in seen:
            errors.append(f"duplicate id: {rid!r} at indexes {seen[rid]} and {i}")
        else:
            seen[rid] = i
        c = rec.get("coordinates")
        if c is not None:
            if not isinstance(c, dict) or not isinstance(c.get("lat"), (int,float)) or not isinstance(c.get("lon"), (int,float)):
                errors.append(f"[{i}] invalid coordinates for id={rid!r}")
            elif not (-90 <= c["lat"] <= 90 and -180 <= c["lon"] <= 180):
                errors.append(f"[{i}] coordinates out of range for id={rid!r}")
    return errors

def migrate(source, root, force=False):
    payload = load_json(source)
    records, info = extract_records(payload)
    errors = validate_records(records)
    if errors:
        raise ValueError("Source validation failed:\n" + "\n".join(errors[:50]))
    root = Path(root)
    existing = [p for p in root.rglob("*.json") if p.name != "_manifest.json"] if root.exists() else []
    if existing and not force:
        print(f"Case store already contains {len(existing)} record files; migration skipped.")
        return
    if force and root.exists():
        for p in sorted(root.rglob("*.json"), reverse=True):
            p.unlink()
    root.mkdir(parents=True, exist_ok=True)
    used=set(); files=[]
    for rec in records:
        path, rel = record_path(root, rec, used)
        dump_json(path, rec)
        files.append(rel)
    raw = Path(source).read_bytes()
    manifest = {
        "store_schema": 1,
        "source_file": str(source),
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "record_count": len(records),
        "top_level": info["top_level"],
        "records_key": info["records_key"],
        "passthrough": info["passthrough"],
        "files": files
    }
    dump_json(root / "_manifest.json", manifest)
    print(f"Migrated {len(records)} records into {root}")

def load_store(root):
    root=Path(root)
    manifest=load_json(root/"_manifest.json")
    files=[]; seen_paths=set(); records=[]
    for rel in manifest.get("files", []):
        p=root/rel
        if p.exists():
            records.append(load_json(p)); files.append(rel); seen_paths.add(rel)
    extras=[]
    for p in root.rglob("*.json"):
        if p.name == "_manifest.json":
            continue
        rel=p.relative_to(root).as_posix()
        if rel not in seen_paths:
            extras.append(rel)
    extras.sort()
    for rel in extras:
        records.append(load_json(root/rel)); files.append(rel)
    return manifest, records, files

def compose(manifest, records):
    if manifest.get("top_level") == "array":
        return records
    key = manifest.get("records_key") or "cases"
    out = dict(manifest.get("passthrough") or {})
    out[key] = records
    return out

def validate_store(root):
    manifest, records, files = load_store(root)
    errors=validate_records(records)
    if manifest.get("record_count") is not None and len(records) < int(manifest["record_count"]):
        errors.append(f"record count shrank from migration baseline {manifest['record_count']} to {len(records)}")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Validated {len(records)} records; all ids unique and required fields present.")
    return 0

def build(root, output):
    root=Path(root)
    manifest, records, files=load_store(root)
    errors=validate_records(records)
    if errors:
        raise ValueError("Store validation failed:\n" + "\n".join(errors[:50]))
    payload=compose(manifest, records)
    dump_json(output, payload)
    manifest["files"]=files
    manifest["record_count"]=len(records)
    manifest["compiled_sha256"]=hashlib.sha256(Path(output).read_bytes()).hexdigest()
    dump_json(root/"_manifest.json", manifest)
    print(f"Built {output} from {len(records)} records.")

def verify(reference, candidate):
    a=load_json(reference); b=load_json(candidate)
    if a != b:
        raise ValueError("Semantic verification failed: rebuilt payload differs from reference")
    print("Semantic verification passed: rebuilt payload equals reference.")

def main():
    ap=argparse.ArgumentParser()
    sub=ap.add_subparsers(dest="cmd", required=True)
    p=sub.add_parser("migrate"); p.add_argument("--source",default="cases.json"); p.add_argument("--root",default="cases"); p.add_argument("--force",action="store_true")
    p=sub.add_parser("validate"); p.add_argument("--root",default="cases")
    p=sub.add_parser("build"); p.add_argument("--root",default="cases"); p.add_argument("--output",default="cases.json")
    p=sub.add_parser("verify"); p.add_argument("--reference",required=True); p.add_argument("--candidate",required=True)
    a=ap.parse_args()
    if a.cmd=="migrate": migrate(a.source,a.root,a.force)
    elif a.cmd=="validate": raise SystemExit(validate_store(a.root))
    elif a.cmd=="build": build(a.root,a.output)
    elif a.cmd=="verify": verify(a.reference,a.candidate)

if __name__=="__main__":
    main()

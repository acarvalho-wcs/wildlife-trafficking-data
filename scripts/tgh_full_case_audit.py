#!/usr/bin/env python3
"""Run a read-only full-store audit of Amazona aestiva staged cases."""
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,unquote
from difflib import SequenceMatcher
from datetime import date,datetime,timezone
import unicodedata, math, re, json, hashlib

BASE=Path("pending_research/tgh-aestiva-2026-10-21")
def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def save(p,x): Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def norm(x):
    s=unicodedata.normalize("NFKD",str(x or ""))
    s="".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9 ]"," ",s.lower())).strip()
def link(s):
    if not s or not isinstance(s,str):return ""
    try:
        u=urlsplit(s.strip())
        return urlunsplit((u.scheme.lower(),u.netloc.lower().removeprefix("www."),unquote(u.path).rstrip("/"),"",""))
    except ValueError:return ""
def lead(c):
    if c.get("lead_id"):return c["lead_id"]
    m=re.search(r"tgh-(h[3-6]-\d\d)-aestiva",c.get("id",""))
    return m.group(1).upper() if m else "UNKNOWN"
def dates(c):return [c[k] for k in ("event_date","publication_date") if isinstance(c.get(k),str) and re.fullmatch(r"\d{4}-\d\d-\d\d",c[k])]
def diffdays(x,y):
    try:return min(abs((date.fromisoformat(a)-date.fromisoformat(b)).days) for a in dates(x) for b in dates(y))
    except (ValueError,TypeError):return None
def distance(a,b):
    if not isinstance(a,dict) or not isinstance(b,dict):return None
    try:
        aa,ab,ba,bb=[float(z) for z in (a["lat"],a["lon"],b["lat"],b["lon"])]
        r=math.pi/180
        h=math.sin((ba-aa)*r/2)**2+math.cos(aa*r)*math.cos(ba*r)*math.sin((bb-ab)*r/2)**2
        return round(12742*math.asin(min(1,math.sqrt(h))),1)
    except (ValueError,KeyError,TypeError):return None
STOP=set("brasil brazil argentina chile paraguai espanha italia franca município municipio cidade localidade province provincia regiao região state country santa santo sao san del de da do dos das em no na do the and aestiva amazona loros papagaios parrots aves animais".split())
def words(s):return {a for a in norm(s).split() if len(a)>3 and a not in STOP}
def pair(a,b):
    evidence=[]; score=0
    la={link(v) for v in [a.get("source_url")]+(a.get("corroboration_urls") or []) if v}
    lb={link(v) for v in [b.get("source_url")]+(b.get("source_urls") or []) if isinstance(v,str)}
    same=bool(la & lb)
    if same:score+=160;evidence.append("exact_source")
    da=diffdays(a,b)
    if da is not None:
        if da==0:score+=36;evidence.append("same_day")
        elif da<=2:score+=27;evidence.append("date_2d")
        elif da<=7:score+=18;evidence.append("date_7d")
        elif da<=30:score+=5
    dist=distance(a.get("coordinates"),b.get("coordinates"))
    if dist is not None:
        if dist<8:score+=33;evidence.append("nearby_8km")
        elif dist<35:score+=20;evidence.append("nearby_35km")
        elif dist<85:score+=8
    sameplace=words(a.get("location_label_pt"))&words(b.get("location_label_pt"))
    if sameplace:score+=min(35,22+5*(len(sameplace)-1));evidence.append("same_locality")
    if norm(a.get("country"))==norm(b.get("country")):score+=3
    if type(a.get("quantity_count"))==int and a.get("quantity_count")==b.get("quantity_count"):score+=7
    if a.get("target_taxon_quantity") is not None and a.get("target_taxon_quantity")==b.get("target_taxon_quantity"):score+=6
    ct=norm(a.get("card_text_pt"));dt=norm(b.get("card_text_pt"))
    if ct and dt:
        sim=SequenceMatcher(None,ct[:500],dt[:500]).ratio()
        if sim>=0.75:score+=14;evidence.append("similar_card")
        elif sim>=0.6:score+=7
    return {"score":score,"evidence":evidence,"date_delta_days":da,"distance_km":dist,"same_source":same}
manifest=load("cases/_manifest.json")
canonical=[]
for relative in manifest["files"]:
    p=Path("cases")/relative
    canonical.append((str(p),load(p)))
if len(canonical)!=manifest["record_count"]:raise RuntimeError("Canonical count does not match manifest")
ids=[c.get("id") for _,c in canonical]
if len(ids)!=len(set(ids)):raise RuntimeError("Canonical duplicate IDs")
stage1=load(BASE/"CANONICAL_CARDS_STAGED_PT_EN_ES.json")["records"]
stage2=load(BASE/"CANONICAL_CARDS_STAGE2_PT_EN_ES_PENDING.json")["entries"]
drafts=stage1+stage2
if len(drafts)!=23:raise RuntimeError("Expected 23 draft cards")
req=["id","location_label_pt","country","publication_date","fauna_label_pt","taxon_text","modal_primary","card_text_pt","status","coordinates","coordinate_precision","source_label","source_url","event_date","fauna_groups_aggregated","aggregate_operation","exclude_from_totals"]
results=[];issues=[]
for c in drafts:
    lid=lead(c)
    flags=[]
    for k in req:
        if k not in c:flags.append("MISSING_"+k)
    for k in ("title","card_text","context"):
        for lang in ("pt","en","es"):
            if not isinstance(c.get(k+"_"+lang),str) or not c[k+"_"+lang].strip():flags.append("EMPTY_"+k+"_"+lang)
    xy=c.get("coordinates")
    if not isinstance(xy,dict) or any(type(xy.get(k)) not in (int,float) for k in ("lat","lon")):flags.append("INVALID_COORDINATES")
    for k in ("aggregate_operation","exclude_from_totals"):
        if type(c.get(k))!=bool:flags.append("INVALID_BOOL_"+k)
    if c.get("status")=="VALIDATED":flags.append("UNSAFE_VALIDATED_STAGING_STATUS")
    if c.get("id") in ids:flags.append("COLLIDING_ID")
    q=c.get("quantity_count")
    if type(q)==int and isinstance(c.get("quantity_by_group"),dict):
        if sum(c["quantity_by_group"].values())+int(c.get("quantity_unassigned") or 0)!=q:flags.append("QUANTITY_GROUP_MISMATCH")
    if flags:issues.append({"lead_id":lid,"issues":flags})
    near=[]
    for path,d in canonical:
        p=pair(c,d)
        if p["score"]>=35:near.append({"canonical_id":d.get("id"),"path":path,**p})
    near.sort(key=lambda z:z["score"],reverse=True)
    top=near[:5]
    status=("EXACT_SOURCE_DUPLICATE" if top and top[0]["same_source"] else
            "POTENTIAL_SEMANTIC_DUPLICATE" if top and top[0]["score"]>=75 else
            "NO_STRONG_MATCH_IN_FULL_STORE")
    results.append({"lead_id":lid,"staging_id":c.get("id") or c.get("proposed_id"),"status":status,"top_matches":top})
summary={status:sum(z["status"]==status for z in results) for status in ("EXACT_SOURCE_DUPLICATE","POTENTIAL_SEMANTIC_DUPLICATE","NO_STRONG_MATCH_IN_FULL_STORE")}
out={"title":"Full 1134-record semantic audit: Amazona aestiva TG-H3-H6","run_utc":datetime.now(timezone.utc).isoformat(),"canonical_records_read":len(canonical),"canonical_unique_ids":True,
"source_manifest_sha256":hashlib.sha256(Path("cases/_manifest.json").read_bytes()).hexdigest(),"draft_count":len(drafts),"result_counts":summary,
"method":"All individual canonical JSON bodies compared, exact source URL, date, generalized location, geographic distance, quantities and card similarity.",
"limits":"Possible matches require human review. No match does not establish publication eligibility or corroborate source validity.",
"structural_issues":issues,"matches":results,"publication":False}
save(BASE/"FULL_STORE_SEMANTIC_AUDIT.json",out)
head=["# Comparação integral: TG-H3 a TG-H6 / Amazona aestiva","",
f"**{len(canonical)}** registros canônicos integralmente lidos; **{len(drafts)}** cards comparados.","",
"## Resultados","","| ID | Classificação | Correspondência principal | Pontuação | Pendências de estrutura |","|---|---|---|---:|---|"]
emap={z["lead_id"]:z["issues"] for z in issues}
for r in results:
    m=r["top_matches"][0] if r["top_matches"] else None
    head.append("| "+r["lead_id"]+" | "+r["status"]+" | "+(m["canonical_id"] if m else "—")+" | "+str(m["score"] if m else 0)+" | "+(", ".join(emap.get(r["lead_id"],[])) or "nenhuma")+" |")
head+=["","**Não publicar automaticamente.** A comparação é semântica e abrangente da base canônica, mas não equivale à auditoria de todas as fontes primárias e georreferenciamentos.",""]
(BASE/"FULL_STORE_SEMANTIC_AUDIT.md").write_text("\n".join(head),encoding="utf-8")
print(json.dumps({"source_cases":len(canonical),"drafts":len(drafts),"statuses":summary,"structural_issues":len(issues)}))

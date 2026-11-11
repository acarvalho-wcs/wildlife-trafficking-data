/* Read-only temporal analysis. No publication-date fallback and no case mutations. */
window.ObservatoryTimeCore = (() => {
 'use strict';
 const DAY=86400000,ZONE='America/Manaus';
 const formatter=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
 const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const day=value=>{const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;const p=Object.fromEntries(formatter.formatToParts(d).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;};
 const shift=(s,n)=>new Date(Date.parse(s+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);
 const duration=r=>Math.round((Date.parse(r.end+'T12:00:00Z')-Date.parse(r.start+'T12:00:00Z'))/DAY)+1;
 const validRange=r=>!!r&&validDay(r.start)&&validDay(r.end)&&r.start<=r.end;
 const previous=r=>({start:shift(r.start,-duration(r)),end:shift(r.start,-1)});
 const timestamp=s=>typeof s==='string'&&validDay(s.slice(0,10))&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s));
 function preset(key,now=Date.now()){
  const end=day(now),month=end.slice(0,7)+'-01',weekday=(new Date(end+'T12:00:00Z').getUTCDay()+6)%7;
  if(key==='all')return null;
  if(key==='today')return {start:end,end};
  if(key==='yesterday'){const start=shift(end,-1);return {start,end:start};}
  if(key==='week')return {start:shift(end,-weekday),end};
  if(key==='lastWeek')return {start:shift(end,-weekday-7),end:shift(end,-weekday-1)};
  if(/^last(7|28|30|90)$/.test(key))return {start:shift(end,1-Number(key.slice(4))),end};
  if(key==='month')return {start:month,end};
  if(key==='lastMonth'){const last=shift(month,-1);return {start:last.slice(0,7)+'-01',end:last};}
  if(key==='year')return {start:end.slice(0,4)+'-01-01',end};
  return null;
 }
 const dateCache=new WeakMap();
 function occurrence(e){
  if(dateCache.has(e))return dateCache.get(e);
  const finish=(value,reason)=>{const r={day:value,reason};dateCache.set(e,r);return r;};
  const p=e.event_date_precision,op=e.occurred_at_precision;
  const precise=new Set(['day','datetime','timestamp','exact','second','minute','hour']);
  if([p,op].some(v=>v&&!precise.has(v)))return finish(null,[p,op].some(v=>['unknown','not_reported'].includes(v))?'missing':'imprecise');
  // A multi-day operation must never be assigned to its first day.
  const start=e.event_date_range_start||e.event_date;
  const end=e.event_date_range_end||e.event_end_date||e.event_date_end;
  if((end&&(!validDay(start)||!validDay(end)||end!==start))||e.event_date_range)return finish(null,'imprecise');
  if(op==='day'||(!op&&p==='day')){
   const d=validDay(e.event_date)?e.event_date:typeof e.occurred_at==='string'?e.occurred_at.slice(0,10):null;
   return finish(validDay(d)?d:null,validDay(d)?null:'missing');
  }
  if(timestamp(e.occurred_at))return finish(day(e.occurred_at),null);
  if(validDay(e.event_date))return finish(e.event_date,null);
  if(validDay(e.occurred_at))return finish(e.occurred_at,null);
  return finish(null,'missing');
 }
 function dateOf(e,basis='occurrence',now=Date.now()){
  if(basis==='occurrence')return occurrence(e);
  const valid=e.status==='VALIDATED'&&e.added_at_validated!==false&&timestamp(e.added_at)&&Date.parse(e.added_at)<=now;
  return {day:valid?day(e.added_at):null,reason:valid?null:'missing'};
 }
 function contains(e,range,basis){if(!range)return true;const d=dateOf(e,basis).day;return !!d&&d>=range.start&&d<=range.end;}
 function coverage(rows,basis){const result={precise:0,imprecise:0,missing:0};for(const e of rows){const d=dateOf(e,basis);result[d.day?'precise':d.reason]++;}return result;}
 const qualifiers=['exact','minimum','approximate'];
 function quantities(rows){
  const result={animals:{},wildlife_items:{},mixed:0,unsupported:0,unknown:0,not_fully_quantified:0,qualifiers:{}};
  for(const k of ['animals','wildlife_items'])for(const q of qualifiers)result[k][q]={value:0,records:0};
  for(const e of rows){
   if(e.exclude_from_totals===true)continue;
   const q=e.quantity_qualifier||'unknown',kind=e.quantity_kind;
   result.qualifiers[q]=(result.qualifiers[q]||0)+1;
   if(q==='unknown')result.unknown++;
   if(q==='not_fully_quantified')result.not_fully_quantified++;
   if(kind==='animals_and_items'){result.mixed++;continue;}
   if(!['animals','wildlife_items'].includes(kind)||!qualifiers.includes(q)||!Number.isFinite(e.quantity_count)||e.quantity_count<0){result.unsupported++;continue;}
   result[kind][q].value+=e.quantity_count;result[kind][q].records++;
  }
  return result;
 }
 const binomial=/^[A-Z][a-z]{2,} [a-z][a-z-]{2,}$/;
 function speciesCatalog(rows){
  const genera=new Set();
  for(const e of rows)for(const m of String(e.taxon_text||'').matchAll(/\*([A-Z][a-z]{2,} [a-z][a-z-]{2,})\*/g))genera.add(m[1].split(' ')[0]);
  const names=new WeakMap();
  for(const e of rows){
   const found=new Set();
   for(const m of String(e.taxon_text||'').matchAll(/\b([A-Z][a-z]{2,}) ([a-z][a-z-]{2,})\b/g))if(genera.has(m[1])&&binomial.test(m[0])&&!['spp','sp','cf','aff'].includes(m[2]))found.add(m[0]);
   names.set(e,[...found]);
  }
  return names;
 }
 function metrics(rows,segments=[],catalog=speciesCatalog(rows)){
  const counted=rows.filter(e=>e.exclude_from_totals!==true),ids=new Set(counted.map(e=>String(e.id))),species=new Set(counted.flatMap(e=>catalog.get(e)||[]));
  return {events:counted.length,countries:new Set(counted.map(e=>e.country)).size,species:species.size,speciesNames:[...species].sort(),speciesMissing:counted.filter(e=>!catalog.get(e)?.length).length,routes:new Set(segments.filter(s=>ids.has(String(s.event.id))).map(s=>s.route.id)).size,segments:segments.filter(s=>ids.has(String(s.event.id))).length,quantity:quantities(counted),excluded:rows.length-counted.length};
 }
 const delta=(a,b)=>({absolute:a-b,percent:b===0?null:100*(a-b)/b});
 // At most 366 chart/table points even for multi-century custom intervals.
 function cumulative(rows,range,basis,maxPoints=366){
  if(!validRange(range))return [];
  const dates=rows.filter(e=>e.exclude_from_totals!==true).map(e=>dateOf(e,basis).day).filter(d=>d&&d>=range.start&&d<=range.end).sort();
  const length=duration(range),step=Math.max(1,Math.ceil(length/maxPoints)),result=[];let n=0;
  for(let offset=0;offset<length;offset+=step){const last=Math.min(length-1,offset+step-1),d=shift(range.start,last);while(n<dates.length&&dates[n]<=d)n++;result.push({day:d,index:last+1,total:n});}
  return result;
 }
 return Object.freeze({ZONE,DAY,day,validDay,validRange,shift,duration,previous,preset,timestamp,dateOf,contains,coverage,quantities,speciesCatalog,metrics,delta,cumulative});
})();

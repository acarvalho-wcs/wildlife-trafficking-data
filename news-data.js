/* The public case collection is the only event source. No bundled case fallback. */
window.NEWS_DATA=[];
window.CaseSource=(()=>{
 const url='https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/cases.json';
 // Cutover guard: set to null after the initial migration. Growth is allowed now.
 const config={minimumInitialRecords:91};
 let status='idle',pending=null,started=false,hasLoaded=false,signature='',lastError=null,stale=false;
 const listeners=new Set();
 const isoDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 const safeUrl=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
 function validate(payload){
  if(!payload||!Array.isArray(payload.cases))throw Error('Missing cases array');
  const rows=payload.cases;
  if(!hasLoaded&&config.minimumInitialRecords!==null&&rows.length<config.minimumInitialRecords)throw Error('Incomplete initial collection');
  // A refresh cannot silently shrink a successfully loaded collection either.
  if(hasLoaded&&rows.length<window.NEWS_DATA.length)throw Error('Unexpected loss of cases');
  if(payload.count!==undefined&&payload.count!==rows.length)throw Error('Inconsistent count');
  const ids=new Set();
  for(const r of rows){
   if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Invalid or duplicate case ID');ids.add(r.id);
   if(!r.coordinates||!Number.isFinite(r.coordinates.lat)||!Number.isFinite(r.coordinates.lon)||Math.abs(r.coordinates.lat)>90||Math.abs(r.coordinates.lon)>180)throw Error('Invalid coordinates: '+r.id);
   if(typeof r.coordinate_precision!=='string'||!r.coordinate_precision)throw Error('Missing coordinate precision');
   if(r.status!=='VALIDATED'||!safeUrl(r.source_url)||typeof r.source_label!=='string'||!r.source_label)throw Error('Invalid source/status: '+r.id);
   for(const l of ['pt','en','es'])for(const k of ['title_','card_text_','context_'])if(typeof r[k+l]!=='string'||!r[k+l].trim())throw Error('Missing translation: '+r.id+' '+k+l);
   for(const k of ['event_date','publication_date'])if(r[k]!==null&&!isoDay(r[k]))throw Error('Invalid date: '+r.id+' '+k);
   if(!Array.isArray(r.fauna_groups_aggregated)||!r.fauna_groups_aggregated.every(x=>typeof x==='string')||typeof r.country!=='string'||typeof r.modal_primary!=='string')throw Error('Invalid filters');
   if(typeof r.aggregate_operation!=='boolean'||typeof r.exclude_from_totals!=='boolean')throw Error('Missing aggregate controls: '+r.id);
  }
  return rows;
 }
 function absoluteTimestamp(value){
  if(typeof value!=='string')return null;
  if(/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value)))return value;
  // Parse only an explicitly supplied absolute UTC timestamp, never "há X horas".
  const m=value.match(/(\d{1,2}) de (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.? de (\d{4}), (\d{2}):(\d{2}) UTC/);
  if(!m)return null;
  const month=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'].indexOf(m[2])+1;
  const day=m[3]+'-'+String(month).padStart(2,'0')+'-'+m[1].padStart(2,'0');
  return isoDay(day)&&Number(m[4])<24&&Number(m[5])<60?day+'T'+m[4]+':'+m[5]+':00Z':null;
 }
 function quantity(r){
  // Only structured, exact animal counts can contribute; narrative and mass are not parsed.
  return Number.isFinite(r.animal_count)&&r.animal_count>=0?r.animal_count:null;
 }
 function adapt(r){
  const groups=[...r.fauna_groups_aggregated],items=quantity(r),date=r.event_date||r.publication_date||'';
  const breakdown={groups,items:Object.fromEntries(groups.map(g=>[g,groups.length===1?items:null])),unallocated:groups.length===1?0:items||0};
  return {...r,_external_case:true,case_id:r.id,lat:r.coordinates.lat,lng:r.coordinates.lon,city:r.location_label_pt||'',date,eventDate:r.event_date,year:date?date.slice(0,4):null,
   groups,breakdown,species:r.fauna_label_pt||groups.join(', '),taxon:r.taxon_text||'',mode:r.modal_primary,modeGroup:r.modal_primary,source:r.source_label,url:r.source_url,items,
   title:r.title_pt,summary:r.card_text_pt,geoNote:r.geographic_note_pt||'',context_status:'validated',context_references:[],
   added_at:absoluteTimestamp(r.added_at)||absoluteTimestamp(r.added_at_text),context_updated_at:absoluteTimestamp(r.context_updated_at)||absoluteTimestamp(r.last_update_text)};
 }
 // Retire the previous persistent fallback; canonical responses are never stored locally.
 try{window.indexedDB?.deleteDatabase('observatory-validated-cases');}catch{}
 function accept(payload,rows){
  const nextSignature=JSON.stringify(rows);
  if(nextSignature!==signature){window.NEWS_DATA=rows.map(adapt);signature=nextSignature;}
  window.NEWS_UPDATED=payload.feed_updated_at||payload.updated_at||payload.audit_status?.updated_at||payload.reconstructed_at||'';
  hasLoaded=true;
 }
 const state=()=>({status,cases:window.NEWS_DATA,error:lastError,stale});
 const notify=()=>listeners.forEach(fn=>fn(state()));
 function refresh(){
  if(pending)return pending;
  status='loading';lastError=null;notify();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  pending=(async()=>{try{
   const response=await fetch(url+'?refresh='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('Case collection unavailable');
   const payload=await response.json(),rows=validate(payload);
   accept(payload,rows);stale=false;status='ready';
  }catch(error){
   status='error';lastError=String(error.message);
   stale=hasLoaded;console.error('Case collection load failed:',lastError);
  }
  finally{clearTimeout(timer);pending=null;notify();}})();return pending;
 }
 function start(){if(started)return;started=true;refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});}
 return {config,validate,adapt,absoluteTimestamp,state,subscribe:fn=>listeners.add(fn),start,refresh};
})();

/* Metadata only: these three catalogs are the sole report sources. */
(function () {
 'use strict';
 const feeds=Object.freeze({
  weekly:'https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/reports-weekly.json',
  semiannual:'https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/reports-semiannual.json',
  annual:'https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/reports-annual.json'
 });
 const categories=Object.keys(feeds),languages=['pt','en','es'],listeners=new Set();
 const collections=Object.fromEntries(categories.map(type=>[type,[]]));
 const statuses=Object.fromEntries(categories.map(type=>[type,'idle']));
 let reports=[],started=false,pending=null,loaded=false;
 const clean=value=>typeof value==='string'?value.trim():'';
 function dateOnly(value) {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 }
 function publicationTime(value) {
  if(dateOnly(value))return Date.parse(value+'T00:00:00Z');
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!dateOnly(value.slice(0,10)))return null;
  const time=Date.parse(value);return Number.isFinite(time)?time:null;
 }
 function zenodoUrl(value) {
  try {
   const url=new URL(value);
   if(url.protocol!=='https:'||url.hostname!=='zenodo.org'||url.port||url.username||url.password||url.search||url.hash||!/^\/records?\/\d+\/?$/.test(url.pathname))return null;
   return url.href;
  } catch {return null;}
 }
 function doiValue(value) {
  const doi=clean(value).replace(/^https:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
  return /^10\.\d{4,9}\/[^\s<>"']+$/i.test(doi)?doi:'';
 }
 function normalize(record,type) {
  if(!record||typeof record!=='object'||Array.isArray(record)||!clean(record.id))return null;
  if(!dateOnly(record.period_start)||!dateOnly(record.period_end)||record.period_start>record.period_end)return null;
  const url=zenodoUrl(record.zenodo_url);
  if(!url||!languages.some(lang=>clean(record['title_'+lang])))return null;
  const published=publicationTime(record.published_at);
  // Undated entries may be listed but cannot win the latest-publication selection.
  if(published!==null&&published>Date.now())return null;
  const result={id:record.id.trim(),type,period_start:record.period_start,period_end:record.period_end,
   year:Number.isInteger(record.year)?record.year:Number(record.period_end.slice(0,4)),
   zenodo_url:url,doi:doiValue(record.doi),published_at:published===null?null:record.published_at,publishedTime:published};
  for(const lang of languages)for(const field of ['title','summary'])result[field+'_'+lang]=clean(record[field+'_'+lang]);
  result.languages=languages.filter(lang=>Array.isArray(record.languages)?record.languages.some(v=>typeof v==='string'&&v.toLowerCase()===lang):!!result['title_'+lang]);
  return result;
 }
 function byPublication(a,b) {
  const at=a.publishedTime??-Infinity,bt=b.publishedTime??-Infinity;
  return (at===bt?0:at>bt?-1:1)||b.period_end.localeCompare(a.period_end)||a.id.localeCompare(b.id);
 }
 function deduplicate(rows) {
  const unique=new Map();
  for(const row of [...rows].sort(byPublication)){
   const existing=unique.get(row.id);
   if(!existing){unique.set(row.id,{...row,languages:[...row.languages]});continue;}
   existing.languages=languages.filter(lang=>existing.languages.includes(lang)||row.languages.includes(lang));
   for(const lang of languages)for(const field of ['title','summary'])existing[field+'_'+lang] ||= row[field+'_'+lang];
   existing.doi ||= row.doi;
  }
  return [...unique.values()];
 }
 const state=()=>({reports,statuses:{...statuses},loaded});
 const notify=()=>listeners.forEach(fn=>fn(state()));
 function latest() {
  return reports.filter(r=>r.publishedTime!==null&&r.publishedTime<=Date.now()).sort(byPublication)[0]||null;
 }
 function refresh() {
  if(pending)return pending;
  for(const type of categories)statuses[type]='loading';
  notify();
  pending=(async()=>{
   await Promise.allSettled(categories.map(async type=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try {
     const response=await fetch(feeds[type],{cache:'no-store',credentials:'omit',signal:controller.signal});
     if(!response.ok)throw new Error('Catalog unavailable');
     const data=await response.json();
     if(!Array.isArray(data))throw new Error('Invalid catalog');
     collections[type]=data.map(row=>normalize(row,type)).filter(Boolean);
     statuses[type]='ready';
    } catch {statuses[type]='error';}
    finally {clearTimeout(timeout);}
   }));
   reports=deduplicate(categories.flatMap(type=>collections[type]));
   loaded=true;pending=null;notify();
  })();
  return pending;
 }
 function start() {
  if(started)return;
  started=true;refresh();
  setInterval(()=>{if(!document.hidden)refresh();},5*60*1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 }
 window.WeeklyReportSource={feeds,state,latest,refresh,start,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
})();

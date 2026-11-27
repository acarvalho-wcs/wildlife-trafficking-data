/* Read-only, source-adaptable analysis of documented occurrences. */
(function(root,factory){const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;else root.ProspectiveCore=core;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const sum=a=>a.reduce((s,v)=>s+v,0),mean=a=>a.length?sum(a)/a.length:0;
const monthIndex=d=>Number(d.slice(0,4))*12+Number(d.slice(5,7))-1;
const monthKey=i=>Math.floor(i/12)+'-'+String(i%12+1).padStart(2,'0');
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const tally=(rows,key)=>{const m=new Map();for(const r of rows){const k=key(r);if(k)m.set(k,(m.get(k)||0)+1);}return [...m].map(([key,n])=>({key,n})).sort((a,b)=>b.n-a.n||a.key.localeCompare(b.key));};
function dedup(rows){const m=new Map();for(const r of rows||[]){if(!r||!r.id||r.countable!==true)continue;const id=String(r.canonicalId||r.id);if(!m.has(id))m.set(id,r);}return [...m.values()];}
function series(rows,history,now,coverageStart){
 const today=validDay(now)?now:new Date().toISOString().slice(0,10),end=monthIndex(today)-1;
 const dated=rows.filter(r=>validDay(r.day)&&r.day<=today),past=dated.filter(r=>monthIndex(r.day)<=end);
 if(!past.length)return {months:[],dated,historyRows:[],undated:rows.length-dated.length};
 const earliest=validDay(coverageStart)?monthIndex(coverageStart):Math.min(...past.map(r=>monthIndex(r.day))),start=Math.max(earliest,history?end-history+1:earliest);
 const months=Array.from({length:end-start+1},(_,i)=>({key:monthKey(start+i),n:0}));
 const historyRows=past.filter(r=>monthIndex(r.day)>=start);
 for(const r of historyRows)months[monthIndex(r.day)-start].n++;
 return {months,dated,historyRows,undated:rows.length-dated.length};
}
const validMonth=k=>typeof k==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(k);
function indicators(rows,{history=24,now,coverageStart,coverageEnd,basis='occurrence',range=null,visible=[]}={}){
 const today=validDay(now)?now:new Date().toISOString().slice(0,10),endDay=validDay(coverageEnd)&&coverageEnd<today?coverageEnd:today,end=monthIndex(endDay);
 const all=dedup(rows),selected=dedup(visible),eligible=all.filter(r=>validMonth(r.indicatorMonth)&&r.indicatorMonth<=endDay.slice(0,7)&&(!r.indicatorDay||r.indicatorDay<=endDay));
 const earliest=validDay(coverageStart)?monthIndex(coverageStart):eligible.length?Math.min(...eligible.map(r=>monthIndex(r.indicatorMonth))):end;
 const start=Math.max(earliest,history?end-history+1:earliest),months=start<=end?Array.from({length:end-start+1},(_,i)=>({key:monthKey(start+i),n:0,partial:false,monthOnly:0})):[];
 const used=eligible.filter(r=>monthIndex(r.indicatorMonth)>=start);for(const r of used){const m=months[monthIndex(r.indicatorMonth)-start];if(!m)continue;m.n++;if(!r.indicatorDay)m.monthOnly++;}
 if(months.length&&endDay===today&&Number(endDay.slice(8))<new Date(Date.UTC(Number(endDay.slice(0,4)),Number(endDay.slice(5,7)),0)).getUTCDate())months.at(-1).partial=true;
 return {months,count:used.length,monthOnly:used.filter(r=>!r.indicatorDay).length,undated:all.filter(r=>!validMonth(r.indicatorMonth)).length,outside:all.length-used.length-all.filter(r=>!validMonth(r.indicatorMonth)).length,selected:selected.length,basis,start:months[0]?.key||null,end:months.at(-1)?.key||null,partial:months.at(-1)?.partial||false};
}
function seasonal(months){const arr=Array.from({length:12},()=>[]);for(const m of months)arr[Number(m.key.slice(5))-1].push(m.n);return arr.map(a=>({n:mean(a),years:a.length}));}
function forecast(months,horizon){
 // Rolling-origin evaluation on complete calendar months. Do not claim true incidence.
 const a=months.map(m=>m.n),h=Math.min(3,Math.max(1,Math.round(horizon/30)));
 if(a.length<24||sum(a)<60||a.filter(x=>x>0).length<18||a.slice(-6).filter(x=>x>0).length<4)return null;
 const models=[{name:'mean3',f:(v,k)=>mean(v.slice(-3))},{name:'mean6',f:(v,k)=>mean(v.slice(-6))},{name:'seasonal',f:(v,k)=>v[v.length-12+(k-1)%12]}];
 const origins=[];for(let i=Math.max(12,a.length-18);i<=a.length-h;i++)origins.push(i);
 if(origins.length<8)return null;
 const scored=models.map(m=>{const errors=origins.flatMap(i=>Array.from({length:h},(_,j)=>Math.abs(a[i+j]-m.f(a.slice(0,i),j+1))));return {...m,mae:mean(errors)};}).sort((x,y)=>x.mae-y.mae);
 const best=scored[0],baseline=mean(origins.flatMap(i=>Array.from({length:h},(_,j)=>Math.abs(a[i+j]-a[i-1]))));
 if(best.mae>baseline)return null;
 const estimates=Array.from({length:h},(_,j)=>{const e=origins.map(i=>Math.abs(a[i+j]-best.f(a.slice(0,i),j+1))).sort((x,y)=>x-y),radius=e[Math.min(e.length-1,Math.ceil(.9*e.length)-1)],n=best.f(a,j+1);return {key:monthKey(monthIndex(months.at(-1).key)+j+1),n,lo:Math.max(0,n-radius),hi:n+radius};});
 return {estimates,mae:best.mae,baseline,origins:origins.length,model:best.name};
}
function routes(rows,edges){
 const ids=new Set(rows.map(r=>r.id)),pairs=new Map(),nodes=new Map(),types={};
 for(const e of edges||[]){if(!ids.has(e.eventId)||!e.from||!e.to||e.from===e.to)continue;
 let a=e.from,b=e.to,d=e.direction;if(d==='backward')[a,b]=[b,a];
 const directed=d==='forward'||d==='backward';if(!directed&&a.localeCompare(b)>0)[a,b]=[b,a];
 const key=a+(directed?' → ':d==='bidirectional'?' ↔ ':' — ')+b;
 if(!pairs.has(key))pairs.set(key,{key,a,b,events:new Set(),kinds:new Set(),directed});
 const p=pairs.get(key);p.events.add(e.eventId);p.kinds.add(e.kind||'unknown');
 for(const k of [a,b]){if(!nodes.has(k))nodes.set(k,{key:k,neighbors:new Set(),events:new Set()});const n=nodes.get(k);n.neighbors.add(k===a?b:a);n.events.add(e.eventId);}
 const type=e.kind||'unknown';(types[type]??=new Set()).add(e.eventId);
 }
 return {pairs:[...pairs.values()].map(p=>({...p,n:p.events.size})).sort((a,b)=>b.n-a.n||a.key.localeCompare(b.key)),nodes:[...nodes.values()].map(n=>({key:n.key,n:n.neighbors.size,events:n.events.size})).sort((a,b)=>b.n-a.n||b.events-a.events),types:Object.entries(types).map(([key,v])=>({key,n:v.size}))};
}
function analyze({rows,visible,edges,history=24,horizon=90,now,coverageStart,disableForecast=false}){
 rows=dedup(rows);visible=dedup(visible);const s=series(rows,history,now,coverageStart),m=s.months,a=m.map(x=>x.n),recent=a.slice(-3),prior=a.slice(-6,-3),reference=a.slice(0,-3);
 const historicalMean=mean(reference),sd=Math.sqrt(mean(reference.map(n=>(n-historicalMean)**2))),last=a.at(-1)||0;
 const anomaly=reference.length>=12&&sum(reference)>=30&&sd>0?(last-historicalMean)/sd:null;
 const histRows=s.historyRows,season=seasonal(m);
 const groups=[...new Set(histRows.flatMap(r=>r.groups||[]))].sort();
 const groupSeason=groups.map(key=>{const rr=histRows.filter(r=>r.groups.includes(key));const mm=m.map(x=>({...x,n:0}));if(mm.length){const start=monthIndex(mm[0].key);for(const r of rr)mm[monthIndex(r.day)-start].n++;}return {key,values:seasonal(mm).map(x=>x.n),n:rr.length};}).sort((a,b)=>b.n-a.n);
 const recentKeys=new Set(m.slice(-3).map(x=>x.key)),priorKeys=new Set(m.slice(-6,-3).map(x=>x.key));
 const recentRows=histRows.filter(r=>recentKeys.has(r.day.slice(0,7))),priorRows=histRows.filter(r=>priorKeys.has(r.day.slice(0,7)));
 const byCountry=tally(histRows,r=>r.country),rec=new Map(tally(recentRows,r=>r.country).map(x=>[x.key,x.n])),pre=new Map(tally(priorRows,r=>r.country).map(x=>[x.key,x.n]));
 const areas=byCountry.map(x=>({...x,recent:rec.get(x.key)||0,prior:pre.get(x.key)||0})).sort((a,b)=>b.recent-a.recent||b.n-a.n);
 const modeRows=[tally(recentRows,r=>r.mode),tally(priorRows,r=>r.mode),tally(histRows,r=>r.mode)];
 return {visible:visible.length,total:rows.length,undated:s.undated,historyCount:histRows.length,months:m,season,groupSeason,areas,modeRows,route:routes(histRows,edges),visibleRoute:routes(visible,edges),recent:sum(recent),prior:sum(prior),trend:prior.length===3&&sum(prior)>0?(sum(recent)/sum(prior)-1)*100:null,anomaly,forecast:disableForecast?null:forecast(m,horizon)};
}
return Object.freeze({analyze,series,indicators,seasonal,forecast,routes,dedup,tally});
});

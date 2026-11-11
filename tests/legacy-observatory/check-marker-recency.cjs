/* Integration audit against the public collection; no frozen case fixture or source writes. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
async function input(url,file){if(file)return JSON.parse(fs.readFileSync(file,'utf8'));return JSON.parse(cp.execFileSync('curl',['-fsSL','--max-time','40',url],{encoding:'utf8',maxBuffer:8*1024*1024}));}
(async()=>{
 const payload=await input('https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/cases.json',process.argv[2]);
 const expectedCount=payload.cases.length;
 const routePayload=await input('https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/routes.json',process.argv[3]);
 const nodes=new Map(),layers=new Set(),waves=new Set(),listeners={},timers=[],requests=[];let feed=payload,failure=false;
 const element=id=>({id,hidden:true,checked:false,value:'',innerHTML:'',textContent:'',dataset:{},style:{setProperty(k,v){this[k]=v}},attrs:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this[k]=fn},after(){},before(){},append(){},appendChild(){},replaceChildren(){},focus(){},remove(){},click(){},querySelector(s){return get(id+' '+s)},querySelectorAll(){return []},getClientRects(){return [1]},getBoundingClientRect(){return {width:800,height:470}}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)};
 const document={body:get('body'),head:get('head'),documentElement:{},activeElement:get('expandMap'),hidden:false,getElementById:get,querySelector:get,querySelectorAll(selector){if(selector==='[data-t]'){const n=get('sidebarDisclaimer');n.dataset.t='creatorDisclaimer';return [n];}return []},createElement:element,createComment:()=>({replaceWith(){}}),addEventListener(k,fn){(listeners[k]??=[]).push(fn)}};
 const map={panes:{},setView(){return this},removeLayer(m){layers.delete(m);waves.delete(m)},on(){},invalidateSize(){},closePopup(){},getPane(k){return this.panes[k]},createPane(k){return this.panes[k]={style:{}}},latLngToLayerPoint:([lat,lng])=>({x:lng,y:-lat}),latLngToContainerPoint:([lat,lng])=>({lat,lng,distanceTo(p){return Math.hypot(lat-p.lat,lng-p.lng)}})};
 const layer=()=>({setStyle(){return this;},addTo(){return this;},bindTooltip(){return this;},on(){return this;},getElement(){return null;}});
 let props={},pov={lat:14,lng:5,altitude:2.4},instance,constructed=0;
 function Globe(){constructed++;instance=new Proxy({},{get(o,k){if(k==='then')return undefined;if(k==='pointOfView')return v=>v?(pov=v,instance):pov;if(k==='getScreenCoords')return (lat,lng)=>({x:lng,y:-lat});if(k==='controls')return ()=>({addEventListener(){}});if(k==='globeMaterial')return ()=>({color:{set(){}}});if(k==='renderer')return ()=>({setPixelRatio(){}});return v=>{props[k]=v;return instance;};}});return instance;}
 const window={Globe,innerWidth:900,scrollX:0,scrollY:0,addEventListener(){},scrollTo(){},devicePixelRatio:1};
 let clock=Date.parse('2026-10-09T00:05:13Z');class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const c={window,document,URL,Intl,Date:ClockDate,AbortController,console:{...console,error(){}},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},setInterval(){},fetch:async(url,options)=>{requests.push({url,options});if(new URL(url).pathname.endsWith('/routes.json'))return {ok:true,json:async()=>routePayload};assert(new URL(url).pathname.endsWith('/cases.json'));if(failure)throw Error('offline');return {ok:true,json:async()=>feed};},L:{map:()=>map,tileLayer:()=>({addTo(){}}),control:{zoom:()=>({addTo:()=>({options:{}})})},circleMarker(coords,style){return {coords,style,eventId:null,addTo(){if(style.interactive!==false)layers.add(this);else waves.add(this);return this},getElement(){return null},getLatLng(){return {lat:coords[0],lng:coords[1]}},bindPopup(content){this.content=content;return this},on(){return this},openPopup(){},bringToFront(){if(style.interactive!==false){layers.delete(this);layers.add(this)}},setStyle(s){Object.assign(this.style,s)},setPopupContent(s){this.content=s}};},layerGroup:()=>({addTo(){return this},clearLayers(){}}),polyline:layer,marker:layer,divIcon:x=>x}};
 vm.createContext(c);
 for(const file of ['scientific-text.js','news-data.js','translations.js','case-context.js','case-media-data.js','case-media.js','documented-routes.js','route-map.js','globe-data.js','globe-view.js','live-search.js','recent-pulse.js','live.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),c);
 const S=window.CaseSource,R=window.DocumentedRoutes,V=window.ObservatoryGlobe,run=s=>vm.runInContext(s,c),esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 await S.refresh();await R.refresh();
 const original=JSON.stringify(payload),sample=payload.cases[0];
 feed={cases:[1,167,169,192].map((h,i)=>({...sample,id:'test-'+h,coordinates:{lat:0,lon:i*35},occurred_at_precision:'second',occurred_at:new Date(clock-h*3600000).toISOString()}))};
 // Fixtures replace only the isolated VM's collection; canonical data remains untouched.
 c.fixtures=feed.cases.map(S.adapt);run('events=fixtures;window.NEWS_DATA=events;window.RecordSearch.setCases(events);render();refreshCaseClock();');
 await get('globeMode').onclick();
 function verify(expected){
  const groups=props.htmlElementsData.filter(g=>!g.routeAdornment);
  assert.equal(groups.length,4);assert.equal(layers.size,4);assert.equal(waves.size,expected.length*2);
  for(const h of [1,167,169,192]){
   const id='test-'+h,recent=expected.includes(h),m=[...layers].find(m=>m.eventId===id),g=groups.find(g=>g.members.some(e=>e.id===id));
   assert.equal(m.style.fillColor,recent?'#ff6b5f':'#d3ff55','MAP '+h+'h');assert.equal(m.style.radius,3.75);assert.equal(m.style.color,'#245b40');
   assert.equal(g.recent,recent,'GLOBE '+h+'h');assert.equal(props.htmlElement(g).className.includes(' recent'),recent,'GLOBE pulse '+h+'h');
  }
 }
 verify([1,167]);
 // Advance through the scheduled occurred_at boundary (one hour + 1 ms).
 clock+=3600001;const timer=timers.filter(t=>!t.cancelled&&t.fn.name==='refreshCaseClock').at(-1);assert(timer);timer.fn();verify([1]);
 clock=Date.parse('2026-10-09T00:05:13Z')+167*3600000;run('refreshCaseClock()');verify([1]);
 assert.equal(timers.filter(t=>!t.cancelled&&t.fn.name==='refreshCaseClock').at(-1).ms,1,'exact occurred_at expiry scheduled');clock++;run('refreshCaseClock()');verify([]);
 // Test newly ingested day-precision records through the same adapters and both views.
 clock=Date.parse('2026-10-09T00:29:24Z');
 c.fixtures=[2,8,1,9].map((day,i)=>S.adapt({...sample,id:'test-'+[1,167,169,192][i],coordinates:{lat:0,lon:i*35},event_date:'2026-10-0'+day,occurred_at:'2026-10-0'+day+'T00:00:00Z',occurred_at_precision:'day'}));
 run('events=fixtures;window.NEWS_DATA=events;window.RecordSearch.setCases(events);render();refreshCaseClock();');verify([1,167]);
 assert(get('caseLegend').innerHTML.includes('Evento recente (últimos 7 dias)'));
 clock=Date.parse('2026-10-09T03:59:59.999Z');run('refreshCaseClock()');verify([1,167]);
 assert.equal(timers.filter(t=>!t.cancelled&&t.fn.name==='refreshCaseClock').at(-1).ms,1);
 clock++;timers.filter(t=>!t.cancelled&&t.fn.name==='refreshCaseClock').at(-1).fn();verify([167,192]);
 console.log('PASS: incoming day-precision records red in both MAP/GLOBE on Oct 8 Manaus; automatic local-midnight rollover; legend.');
 // Exercise the actual canonical collection at the date of the reported issue.
 // Source publication dates must never stand in for missing occurrence dates.
 clock=Date.parse('2026-10-15T23:35:53Z');
 c.fixtures=payload.cases.map(S.adapt);
 run('events=fixtures;window.NEWS_DATA=events;window.RecordSearch.setCases(events);render();refreshCaseClock();');
 const recentIds=payload.cases.filter(e=>['2026-10-14','2026-10-15'].includes(e.event_date)).map(e=>e.id);
 assert(recentIds.length>0,'real recent occurrence regression needs canonical evidence');
 for(const id of recentIds){
  const marker=[...layers].find(m=>m.eventId===id);
  assert(marker,'real MAP marker '+id);assert.equal(marker.style.fillColor,'#ff6b5f','real MAP recent '+id);
  const group=props.htmlElementsData.find(g=>g.members?.some(e=>e.id===id));
  assert(group?.recent,'real GLOBE recent '+id);
  assert(props.htmlElement(group).className.includes(' recent'),'real GLOBE pulse '+id);
 }
 for(const raw of payload.cases.filter(e=>!e.event_date&&!e.occurred_at)){
  const marker=[...layers].find(m=>m.eventId===raw.id);
  assert.equal(marker.style.fillColor,'#d3ff55','unknown occurrence not red: '+raw.id);
 }
 assert.equal(JSON.stringify(payload),original,'source unchanged');
 console.log('PASS: actual canonical Oct 14/15 occurrence IDs red in MAP/GLOBE:',recentIds.join(', '));
 const css=fs.readFileSync('dist/recent-pulse.css','utf8');assert(css.includes('.recent-wave,.globe-marker.recent::before,.globe-marker.recent::after{animation:observatory-recent-wave 2.6s linear infinite'));assert(css.includes('100%{transform:scale(3.5);opacity:0}'));
 console.log('PASS: MAP/GLOBE 1h,167h,169h,192h color and pulse wiring; automatic expiry; 168h boundary timer; NIMF marker dimensions and canonical data. Renderer APIs mocked; no browser/WebGL visual certification.');
})().catch(e=>{console.error(e);process.exit(1)});

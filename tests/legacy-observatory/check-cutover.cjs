/* Integration audit against the public collection; no frozen case fixture or source writes. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
async function input(url,file){if(file)return JSON.parse(fs.readFileSync(file,'utf8'));return JSON.parse(cp.execFileSync('curl',['-fsSL','--max-time','40',url],{encoding:'utf8',maxBuffer:8*1024*1024}));}
(async()=>{
 const payload=await input('https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/cases.json',process.argv[2]);
 const expectedCount=payload.cases.length;
 const routePayload=await input('https://acarvalho-wcs.github.io/wildlife-trafficking-data/routes.json',process.argv[3]);
 const nodes=new Map(),layers=new Set(),listeners={},timers=[],requests=[];let feed=payload,failure=false;
 const element=id=>({id,hidden:true,checked:false,value:'',innerHTML:'',textContent:'',dataset:{},style:{setProperty(k,v){this[k]=v}},attrs:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this[k]=fn},after(){},before(){},append(){},appendChild(){},replaceChildren(){},focus(){},remove(){},click(){},querySelector(s){return get(id+' '+s)},querySelectorAll(){return []},getClientRects(){return [1]},getBoundingClientRect(){return {width:800,height:470}}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)};
 const document={body:get('body'),head:get('head'),documentElement:{},activeElement:get('expandMap'),hidden:false,getElementById:get,querySelector:get,querySelectorAll(selector){if(selector==='[data-t]'){const n=get('sidebarDisclaimer');n.dataset.t='creatorDisclaimer';return [n];}return []},createElement:element,createComment:()=>({replaceWith(){}}),addEventListener(k,fn){(listeners[k]??=[]).push(fn)}};
 const map={panes:{},setView(){return this},removeLayer(m){layers.delete(m)},on(){},invalidateSize(){},closePopup(){},getPane(k){return this.panes[k]},createPane(k){return this.panes[k]={style:{}}},project:([lat,lng])=>({x:lng,y:-lat}),latLngToContainerPoint:([lat,lng])=>({lat,lng,distanceTo(p){return Math.hypot(lat-p.lat,lng-p.lng)}})};
 const layer=()=>({setStyle(){return this;},addTo(){return this;},bindTooltip(){return this;},on(){return this;},getElement(){return null;}});
 let props={},pov={lat:14,lng:5,altitude:2.4},instance,constructed=0;
 function Globe(){constructed++;instance=new Proxy({},{get(o,k){if(k==='then')return undefined;if(k==='pointOfView')return v=>v?(pov=v,instance):pov;if(k==='getScreenCoords')return (lat,lng)=>({x:lng,y:-lat});if(k==='controls')return ()=>({addEventListener(){}});if(k==='globeMaterial')return ()=>({color:{set(){}}});if(k==='renderer')return ()=>({setPixelRatio(){}});return v=>{props[k]=v;return instance;};}});return instance;}
 const window={Globe,innerWidth:900,scrollX:0,scrollY:0,addEventListener(){},scrollTo(){},devicePixelRatio:1};
 const c={window,document,URL,Intl,Date,AbortController,console:{...console,error(){}},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},setInterval(){},fetch:async(url,options)=>{requests.push({url,options});if(new URL(url).pathname.endsWith('/routes.json'))return {ok:true,json:async()=>routePayload};assert(new URL(url).pathname.endsWith('/cases.json'));if(failure)throw Error('offline');return {ok:true,json:async()=>feed};},L:{map:()=>map,tileLayer:()=>({addTo(){}}),control:{zoom:()=>({addTo:()=>({options:{}})})},circleMarker(coords,style){return {coords,style,eventId:null,addTo(){if(style.interactive!==false)layers.add(this);return this},getElement(){return null},getLatLng(){return {lat:coords[0],lng:coords[1]}},bindPopup(content){this.content=content;return this},on(){return this},openPopup(){},bringToFront(){if(style.interactive!==false){layers.delete(this);layers.add(this)}},setStyle(s){Object.assign(this.style,s)},setPopupContent(s){this.content=s}};},layerGroup:()=>({addTo(){return this},clearLayers(){}}),polyline:layer,marker:layer,divIcon:x=>x}};
 vm.createContext(c);
 for(const file of ['scientific-text.js','news-data.js','translations.js','case-context.js','case-media-data.js','case-media.js','documented-routes.js','route-map.js','globe-data.js','globe-view.js','live-search.js','recent-pulse.js','live.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),c);
 const S=window.CaseSource,R=window.DocumentedRoutes,V=window.ObservatoryGlobe,run=s=>vm.runInContext(s,c),esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 assert.throws(()=>S.validate({...payload,cases:payload.cases.slice(0,90),count:90}));
 await S.refresh();await R.refresh();assert.equal(S.state().status,'ready');assert.equal(window.NEWS_DATA.length,expectedCount);assert(run('events===window.NEWS_DATA'),'one shared event array');assert.equal(layers.size,expectedCount);
 const requiredIds=['2026-10-04__miami-10-songbirds-havana-flight','2026-10-06__bani-white-faced-capuchin','2026-10-06__puerto-vilelas-3-capybaras-1-armadillo','2026-10-05__khaprail-2-5kg-pangolin-scales','2026-10-07__machakos-12kg-elephant-tusks','2026-06-25__soledad-graciano-sanchez-5-wildlife-4-taxidermies','2026-07-01__durango-3-white-bengal-tigers-ocelot-lynx','2026-07-06__bocas-del-toro-119-hawksbill-eggs'];
 for(const id of requiredIds){assert(window.NEWS_DATA.some(e=>e.id===id),'loaded '+id);assert(get('list').innerHTML.includes('data-id="'+id+'"'),'feed '+id);assert([...layers].some(m=>m.eventId===id),'map '+id);}
 console.log('Synchronization:',JSON.stringify({loaded:window.NEWS_DATA.length,feed:(get('list').innerHTML.match(/class="event" data-id=/g)||[]).length,map:layers.size,requiredIds}));
 assert(requests.every(r=>new URL(r.url).searchParams.has('refresh')),'fresh canonical request URLs');
 const original=JSON.stringify(window.NEWS_DATA);
 for(const e of window.NEWS_DATA){const raw=payload.cases.find(r=>r.id===e.id);assert.equal(e.lat,raw.coordinates.lat);assert.equal(e.lng,raw.coordinates.lon);assert.equal(e.date,raw.event_date||raw.publication_date||'');assert.equal(e.url,raw.source_url);assert.equal(JSON.stringify(e.groups),JSON.stringify(raw.fauna_groups_aggregated));assert.equal(e.modeGroup,raw.modal_primary);assert.equal(e.items,null,'no invented numeric quantities');assert.equal(e.context_pt,raw.context_pt);}
 const baselineLive=cp.execFileSync('git',['show','68e957690db89404bb7c98aea6f3f21f8ff7baa3:dist/live.js'],{encoding:'utf8'}),currentLive=fs.readFileSync('dist/live.js','utf8');
 assert.equal(currentLive.slice(currentLive.indexOf('function lowerQuantities'),currentLive.indexOf('function metricButton')),baselineLive.slice(baselineLive.indexOf('function lowerQuantities'),baselineLive.indexOf('function metricButton')),'quantity aggregation remains unchanged');
 const counted=payload.cases.filter(r=>!r.exclude_from_totals);assert.equal(get('nEvents').textContent,counted.length.toLocaleString('pt-BR'));assert.equal(get('nItems').textContent,get('donutTotal').textContent);assert.equal(window.NEWS_DATA.filter(window.CaseContext.complete).length,expectedCount);
 // Lower panels and upper quantity total share schema 1.2 quantitative fields.
 function auditLower(){
  const rows=JSON.parse(run('JSON.stringify(filtered())')),active=rows.filter(e=>e.exclude_from_totals!==true);
  const stats=run('lowerQuantities(filtered())');
  // Existing schema 1.2 acceptance rules: new unsupported qualifiers/kinds remain unknown.
  const eligible=e=>['exact','approximate','minimum'].includes(e.quantity_qualifier)&&['animals','wildlife_items','animals_and_items'].includes(e.quantity_kind);
  const known=active.filter(e=>Number.isFinite(e.quantity_count)&&eligible(e));
  assert.equal(stats.total.count,active.length);
  assert.equal(stats.total.items,known.reduce((n,e)=>n+e.quantity_count,0));
  assert.equal(stats.total.unknown,active.length-known.length);
  assert.equal(stats.total.approximate,known.filter(e=>e.quantity_qualifier==='approximate').length);
  assert.equal(stats.total.minimum,known.filter(e=>e.quantity_qualifier==='minimum').length);
  assert.equal(stats.unallocated.items,active.filter(eligible).reduce((n,e)=>n+(e.quantity_unassigned||0),0));
  for(const [group,v] of stats.groups){
   const members=active.filter(e=>e.fauna_groups_aggregated.includes(group));
   assert.equal(v.count,members.length);
   assert.equal(v.items,members.filter(eligible).reduce((n,e)=>n+(e.quantity_by_group[group]??0),0));
  }
  for(const [mode,v] of stats.modes){const members=active.filter(e=>e.modal_primary===mode);assert.equal(v.count,members.length);assert.equal(v.items,members.filter(eligible).reduce((n,e)=>n+(e.quantity_count??0),0));}
  // Allocation may be incomplete in the upstream feed; rendering must preserve it, not infer quantities.
  const allocated=active.filter(eligible).reduce((n,e)=>n+[...new Set(e.fauna_groups_aggregated)].reduce((sum,g)=>sum+(e.quantity_by_group?.[g]??0),0)+(e.quantity_unassigned||0),0);
  assert.equal([...stats.groups.values()].reduce((n,v)=>n+v.items,0)+stats.unallocated.items,allocated,'composition uses exactly the supplied allocations');
  assert.equal(get('donutTotal').textContent,run('lowerQuantityText(lowerQuantities(filtered()).total)'));
  assert.equal(get('nItems').textContent,get('donutTotal').textContent,'upper and lower quantity totals stay synchronized');
  assert.equal(get('nItems').title,get('donutTotal').title);
  assert(get('groupMetrics').innerHTML.includes('data-metric="group"')||!stats.groups.size);
 }
 auditLower();
 // Zero, null, mass-only narratives, unknown qualifiers, kinds and exclusions.
 const sample={fauna_groups_aggregated:['Aves','Répteis'],modal_primary:'Terrestre',exclude_from_totals:false,quantity_count:10,quantity_qualifier:'exact',quantity_kind:'animals_and_items',quantity_by_group:{Aves:6,'Répteis':2},quantity_unassigned:2};
 const fixture=[sample,{...sample,quantity_count:0,quantity_by_group:{Aves:0,'Répteis':0},quantity_unassigned:0},{...sample,quantity_count:null,quantity_kind:'unknown',quantity_qualifier:'unknown',quantity_by_group:{},quantity_unassigned:0,card_text_pt:'99999 animais, 6000 kg, 50 caixas',items:99999},{...sample,exclude_from_totals:true,quantity_count:100000}];
 const q=run('lowerQuantities('+JSON.stringify(fixture)+')');assert.equal(q.total.items,10);assert.equal(q.total.count,3);assert.equal(q.total.known,2);assert.equal(q.total.unknown,1);assert.equal(q.groups.get('Aves').items,6);assert.equal(q.unallocated.items,2);
 assert.equal(run('lowerQuantityText(lowerQuantities('+JSON.stringify([fixture[1]])+').total)'),'0');
 assert.equal(run('lowerQuantityText(lowerQuantities('+JSON.stringify([fixture[2]])+').total)'),'—');
 assert.equal(run('lowerQuantityText(lowerQuantities('+JSON.stringify([{...sample,quantity_qualifier:'minimum'}])+').total)'),'≥ 10');
 assert.equal(run('lowerQuantityText(lowerQuantities('+JSON.stringify([{...sample,quantity_qualifier:'approximate'}])+').total)'),'≈ 10');
 assert.equal(run('lowerQuantities('+JSON.stringify([{...sample,quantity_kind:'unknown',quantity_qualifier:'unknown'}])+').total.items'),0);
 for(const lang of ['pt','en','es']){get('language').onchange({target:{value:lang}});auditLower();assert.equal(get('sidebarDisclaimer').textContent,run('messages[lang].creatorDisclaimer'));assert(get('caseLegend').innerHTML.includes(window.CaseContext.labels[lang].recent));assert(get('caseLegend').innerHTML.includes(window.CaseContext.labels[lang].historical));assert.equal(layers.size,expectedCount);for(const e of window.NEWS_DATA){const raw=payload.cases.find(r=>r.id===e.id),localized=run('record(events.find(e=>e.id==='+JSON.stringify(e.id)+'))');assert.equal(localized.title,raw['title_'+lang]);assert.equal(localized.summary,raw['card_text_'+lang]);const card=run('card(record(events.find(e=>e.id==='+JSON.stringify(e.id)+')))'),popup=run('popup(record(events.find(e=>e.id==='+JSON.stringify(e.id)+')))');const directory=run('directoryEvent(record(events.find(e=>e.id==='+JSON.stringify(e.id)+')))');for(const html of [card,popup,directory]){assert(html.includes(window.ScientificText.html(raw['context_'+lang])));assert(html.includes(window.ScientificText.html(raw['title_'+lang])));assert(html.includes('href="'+esc(raw.source_url)+'"'));assert(html.includes(window.ScientificText.html(localized.summary)));assert(html.includes(window.ScientificText.html(localized.species+' · '+localized.taxon)));assert(!html.includes('Invalid Date'));}}}
 assert.equal(constructed,0);await get('globeMode').onclick();assert.equal(constructed,1);assert.equal(props.htmlElementsData.filter(x=>!x.routeAdornment).flatMap(x=>x.members).length,expectedCount);
 get('routeLayer').checked=true;get('routeLayer').onchange();assert.deepEqual(props.pathsData.map(s=>s.id),R.segments(window.NEWS_DATA).map(s=>s.id));assert.deepEqual(window.DocumentedRouteMap.segmentIds(),props.pathsData.map(s=>s.id));
 for(const key of ['country','species','year','mode']){const values=run(key==='species'?'[...new Set(events.flatMap(e=>e.groups))]':'[...new Set(events.map(e=>filterValue(e,"'+key+'")).filter(Boolean))]');for(const value of values){get(key).value=String(value);run('render()');auditLower();const n=run('filtered().length');for(const m of layers){const e=window.NEWS_DATA.find(e=>e.id===m.eventId);assert.equal(m.style.fillColor,window.CaseContext.color(e));}for(const g of props.htmlElementsData.filter(x=>!x.routeAdornment))assert.equal(g.recent,g.members.some(e=>window.CaseContext.isRecent(e)));assert.equal(layers.size,n);assert.equal(props.htmlElementsData.filter(x=>!x.routeAdornment).flatMap(x=>x.members).length,n);assert.deepEqual(window.DocumentedRouteMap.segmentIds(),props.pathsData.map(s=>s.id));}get(key).value='';}
 get('country').value='Brasil';get('species').value='Aves';run('render()');get('language').onchange({target:{value:'en'}});assert.equal(get('country').value,'Brasil');assert.equal(get('species').value,'Aves');assert.equal(layers.size,run('filtered().length'));
 await get('mapMode').onclick();await get('globeMode').onclick();assert.equal(constructed,1);assert.equal(get('mapTheme').value,'dark');get('expandMap').onclick();get('expandMap').onclick();get('clear').onclick();
 assert.equal(layers.size,expectedCount);assert.equal(run('csvRows().length'),expectedCount);assert.equal(JSON.stringify(window.NEWS_DATA),original);
 const front={lat:0,lng:0,altitude:2};assert(window.GlobeData.visible({lat:0,lng:0},front));assert(!window.GlobeData.visible({lat:0,lng:180},front));

 // Live search uses the shared pipeline: real feed queries, controls and projections.
 const Q=window.RecordSearch,queries=['arara','macaw','guacamayo','Anodorhynchus','shark','tubarão','tiburon','pangolin','Manaus','Brasil','Brazil','India','Nigéria','airport','aeroporto','aeropuerto','marítimo','maritime','2026'];
 const ids=()=>JSON.parse(run('JSON.stringify(filtered().map(e=>e.id).sort())'));
 function flushSearch(){for(const t of timers)if(t.ms===125&&!t.cancelled){t.cancelled=true;t.fn();}}
 function type(value){get('recordSearch').value=value;get('recordSearch').input();flushSearch();}
 function parity(){
  const expected=ids();
  assert.deepEqual([...layers].map(m=>m.eventId).sort(),expected);
  assert.deepEqual(Array.from(props.htmlElementsData.filter(x=>!x.routeAdornment).flatMap(x=>x.members).map(e=>e.id)).sort(),expected);
  assert.equal(run('csvRows().length'),expected.length);
  assert.deepEqual(window.DocumentedRouteMap.segmentIds(),props.pathsData.map(s=>s.id));auditLower();
 }
 const requestCount=requests.length,queryCounts={};
 for(const query of queries){type(query);parity();queryCounts[query]=ids().length;const baseMatches=window.NEWS_DATA.filter(e=>Q.normalize(JSON.stringify(e)).includes(Q.normalize(query)));for(const e of baseMatches)assert(ids().includes(e.id),query+' includes matching canonical text');}
 type('tubarão');const accented=ids();type(' TUBARAO ');assert.deepEqual(ids(),accented);
 type('Nigéria');const nigeria=ids();type('nigeria');assert.deepEqual(ids(),nigeria);
 type('');const full=ids();get('recordSearch').value='arara';get('recordSearch').input();assert.deepEqual(ids(),full,'125ms debounce');
 get('recordSearch').value='macaw';get('recordSearch').input();assert.equal(timers.filter(t=>t.ms===125&&!t.cancelled).length,1,'superseded input cancelled');flushSearch();parity();
 for(let i=0;i<='arara'.length;i++){type('arara'.slice(0,i));parity();}
 for(let i='arara'.length;i>=0;i--){type('arara'.slice(0,i));parity();}
 type('arara');const chosen=run('filtered()[0]');assert(chosen);
 for(const key of ['country','species','year','mode']){
  const value=key==='species'?chosen.groups[0]:key==='mode'?chosen.modeGroup:chosen[key];
  get(key).value=String(value??'');get(key).change();parity();
  assert(run('filtered().every(e=>matchesFilter(e,'+JSON.stringify(key)+','+JSON.stringify(get(key).value)+'))'));assert.equal(get('recordSearch').value,'arara');
 }
 const combined=ids();assert(combined.includes(chosen.id));
 for(const language of ['pt','en','es']){
  get('language').onchange({target:{value:language}});assert.deepEqual(ids(),combined);assert.equal(get('recordSearch').value,'arara');
  assert.equal(get('recordSearchLabel').textContent,language==='en'?'Search records':'Buscar registros');
  assert(get('recordSearch').placeholder.includes(language==='en'?'species':language==='es'?'especie':'espécie'));
  await get('mapMode').onclick();await get('globeMode').onclick();parity();
 }
 get('clearRecordSearch').click();assert.equal(get('recordSearch').value,'');assert.equal(get('country').value,chosen.country);parity();
 type('arara');let prevented=false,stopped=false;get('recordSearch').keydown({key:'Escape',preventDefault(){prevented=true},stopPropagation(){stopped=true}});assert(prevented&&stopped);assert.equal(get('recordSearch').value,'');assert.equal(get('country').value,chosen.country);parity();
 type('arara');get('clear').onclick();assert.equal(get('recordSearch').value,'arara','existing filter reset does not erase search');parity();
 for(const language of ['pt','en','es']){get('language').onchange({target:{value:language}});type('zzzz-no-such-record-999999');assert.equal(ids().length,0);parity();assert.equal(get('recordSearchCount').textContent,{pt:'Nenhum registro encontrado',en:'No records found',es:'Ningún registro encontrado'}[language]);Q.localize(language,1);assert.equal(get('recordSearchCount').textContent,{pt:'1 registro encontrado',en:'1 record found',es:'1 registro encontrado'}[language]);}
 for(const width of [1440,390])for(const theme of ['light','dark']){window.innerWidth=width;get('mapTheme').value=theme;get('mapTheme').onchange({target:{value:theme}});type('airport');await get('mapMode').onclick();await get('globeMode').onclick();get('expandMap').onclick();parity();get('expandMap').onclick();}
 assert.equal(requests.length,requestCount,'no HTTP per search input');
 get('clearRecordSearch').click();get('language').onchange({target:{value:'en'}});assert.equal(JSON.stringify(window.NEWS_DATA),original,'search never mutates cases');
 console.log('Live search queries verified:',JSON.stringify(queryCounts));
 const bads=[{...payload,cases:payload.cases.slice(1),count:90},{...payload,cases:[payload.cases[0],...payload.cases.slice(0,90)]},{...payload,cases:payload.cases.map((r,i)=>i?r:{...r,title_es:''})},{...payload,cases:payload.cases.map((r,i)=>i?r:{...r,coordinates:{lat:null,lon:0}})}];
 for(const bad of bads){feed=bad;await S.refresh();assert.equal(S.state().status,'error');assert.equal(layers.size,expectedCount);assert.equal(JSON.stringify(window.NEWS_DATA),original);}
 failure=true;await S.refresh();assert.equal(layers.size,expectedCount);failure=false;feed=payload;await S.refresh();assert.equal(S.state().status,'ready');
 feed={...payload,count:expectedCount+1,cases:[...payload.cases,{...payload.cases[0],id:'test-growth-only'}]};await S.refresh();assert.equal(window.NEWS_DATA.length,expectedCount+1);assert.equal(layers.size,expectedCount+1,'new cases appear in both projections');assert.equal(props.htmlElementsData.filter(x=>!x.routeAdornment).flatMap(x=>x.members).length,expectedCount+1);
 auditLower();
 assert(requests.every(r=>r.options.cache==='no-store'));
 // Header appearance controls: all unrelated public assets remain identical.
 const baseline='ff9a6e27b0e9efe3851d9c398585cd0f780b6481';
 const changed=new Set(['dist/index.html','dist/live.js','dist/assets/js/growth-history.js','dist/documented-routes.js','dist/route-map.js','dist/globe-view.js','dist/globe-view.css','dist/globe-data.js']);
 // Remove only the authorized temporal integration before comparing the full HTML.
 const originalIndex=cp.execFileSync('git',['show',baseline+':dist/index.html'],{encoding:'utf8'});
 assert.match(fs.readFileSync('dist/index.html','utf8'),/id="routeLayer" checked/);
 const restoredIndex=fs.readFileSync('dist/index.html','utf8')
  .replace('id="routeLayer" checked','id="routeLayer"')
  .replace('<link rel="stylesheet" href="temporal-filter.css?v=20261018">\n','')
  .replace(/<div class="time-toolbar">[\s\S]*?<\/div>/,'')
  .replace('<div id="timeNotice" class="time-notice" role="status" hidden></div><div id="timeMapControls" class="time-map-switch" hidden></div>','')
  .replace('<section id="timeComparePanel" class="time-panel" aria-label="Comparação temporal" hidden></section>\n      ','')
  .replace('<dialog id="timeDialog" aria-labelledby="timeDialogTitle"></dialog>\n<script src="temporal-core.js?v=20261018"></script>\n<script src="temporal-filter.js?v=20261018"></script>\n','')
  .replace('live.js?v=20261026-nimf-markers','live.js')
  .replace('growth-history.js?v=20261018-temporal','growth-history.js?v=20261013')
  .replace('globe-view.css?v=20261026-nimf-markers','globe-view.css')
  .replace('documented-routes.js?v=20261023-route-symbols','documented-routes.js?v=20261010-sync')
  .replace('route-map.js?v=20261023-route-symbols','route-map.js')
  .replace('globe-view.js?v=20261026-fixed','globe-view.js')
  .replace('globe-data.js?v=20261026-fixed','globe-data.js')
  .replace('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.10.0/dist/maplibre-gl.css">\n<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.10.0/dist/maplibre-gl.js"></script>\n','')
  .replace('<script src="assets/js/leaflet-maplibre-gl.js"></script><script src="maplibre-surface.js?v=20261026"></script>','')
  .replace(/<div id="globeCredit"[^>]*><\/div>/,originalIndex.match(/<div id="globeCredit"[\s\S]*?<\/div>/)[0]);
 assert.equal(restoredIndex,originalIndex,'only authorized temporal, routes, and MapLibre integration change dashboard HTML');
 for(const file of cp.execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{encoding:'utf8'}).trim().split('\n')){
  if(changed.has(file))continue;
  assert.deepEqual(fs.readFileSync(file),cp.execFileSync('git',['show',baseline+':'+file],{maxBuffer:16*1024*1024}),file+' unchanged');
 }
 assert.equal(props.pointAltitude,0);assert.equal(props.labelAltitude,0);
 for(const recent of [false,true])assert.equal(props.htmlAltitude({recent}),0);
 for(const m of layers){assert.equal(m.style.radius,3.75);assert.equal(m.style.weight,1.5);assert.equal(m.style.color,'#245b40');}
 console.log('PASS: '+expectedCount+' external cases; '+counted.length+' countable; PT/EN/ES cards/context/source URLs; all filters; MAP/GLOBE and '+routePayload.routes.length+' routes synchronized; numeric coordinates; null dates/quantities preserved; no partial rendering; failure/recovery/growth; schema 1.2 lower panels and qualifiers verified across filters/languages; shared event-based recency, disclaimer localization and unchanged remaining interface verified.');
})();

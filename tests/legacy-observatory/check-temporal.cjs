/* Temporal regression suite: canonical data are read-only fixtures, never bundled. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const payload=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),routePayload=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
 const expectedCount=payload.cases.length;
 const nodes=new Map(),layers=new Set(),listeners={},timers=[],requests=[];let feed=payload,failure=false;
 const element=id=>({id,hidden:true,checked:false,value:'',innerHTML:'',textContent:'',dataset:{},style:{setProperty(k,v){this[k]=v}},attrs:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this[k]=fn},after(){},before(){},append(){},appendChild(){},replaceChildren(){},focus(){},remove(){},click(){},querySelector(s){return get(id+' '+s)},showModal(){this.open=true;},close(){this.open=false;},querySelectorAll(){return []},getClientRects(){return [1]},getBoundingClientRect(){return {width:800,height:470}}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)};
 const document={body:get('body'),head:get('head'),documentElement:{},activeElement:get('expandMap'),hidden:false,getElementById:get,querySelector:get,querySelectorAll(selector){if(selector==='[data-t]'){const n=get('sidebarDisclaimer');n.dataset.t='creatorDisclaimer';return [n];}return []},createElement:element,createComment:()=>({replaceWith(){}}),addEventListener(k,fn){(listeners[k]??=[]).push(fn)}};
 const map={panes:{},setView(){return this},removeLayer(m){layers.delete(m)},on(){},invalidateSize(){},closePopup(){},getPane(k){return this.panes[k]},createPane(k){return this.panes[k]={style:{}}},project:([lat,lng])=>({x:lng,y:-lat}),latLngToLayerPoint:([lat,lng])=>({x:lng,y:-lat}),latLngToContainerPoint:([lat,lng])=>({lat,lng,distanceTo(p){return Math.hypot(lat-p.lat,lng-p.lng)}})};
 const layer=()=>({setStyle(){return this;},addTo(){return this;},bindTooltip(){return this;},on(){return this;},getElement(){return null;}});
 let props={},pov={lat:14,lng:5,altitude:2.4},instance,constructed=0;
 function Globe(){constructed++;instance=new Proxy({},{get(o,k){if(k==='then')return undefined;if(k==='pointOfView')return v=>v?(pov=v,instance):pov;if(k==='getScreenCoords')return (lat,lng)=>({x:lng,y:-lat});if(k==='controls')return ()=>({addEventListener(){}});if(k==='globeMaterial')return ()=>({color:{set(){}}});if(k==='renderer')return ()=>({setPixelRatio(){}});return v=>{props[k]=v;return instance;};}});return instance;}
 const window={Globe,innerWidth:900,scrollX:0,scrollY:0,addEventListener(){},dispatchEvent(){},scrollTo(){},devicePixelRatio:1};
 const c={window,document,URL,Intl,Date,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},AbortController,console:{...console,error(){}},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},setInterval(){},fetch:async(url,options)=>{requests.push({url,options});if(new URL(url).pathname.endsWith('/routes.json'))return {ok:true,json:async()=>routePayload};assert(new URL(url).pathname.endsWith('/cases.json'));if(failure)throw Error('offline');return {ok:true,json:async()=>feed};},L:{map:()=>map,tileLayer:()=>({addTo(){}}),control:{zoom:()=>({addTo:()=>({options:{}})})},circleMarker(coords,style){return {coords,style,eventId:null,addTo(){if(style.interactive!==false)layers.add(this);return this},getElement(){return null},getLatLng(){return {lat:coords[0],lng:coords[1]}},bindPopup(content){this.content=content;return this},on(){return this},openPopup(){},bringToFront(){if(style.interactive!==false){layers.delete(this);layers.add(this)}},setStyle(s){Object.assign(this.style,s)},setPopupContent(s){this.content=s}};},layerGroup:()=>({addTo(){return this},clearLayers(){}}),polyline:layer,marker:layer,divIcon:x=>x}};
 vm.createContext(c);
 for(const file of ['scientific-text.js','news-data.js','translations.js','case-context.js','case-media-data.js','case-media.js','documented-routes.js','route-map.js','globe-data.js','globe-view.js','live-search.js','recent-pulse.js','temporal-core.js','temporal-filter.js','live.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),c);
 const C=window.ObservatoryTimeCore,T=window.ObservatoryTime,S=window.CaseSource,R=window.DocumentedRoutes,run=s=>vm.runInContext(s,c);
 await S.refresh();await R.refresh();
 const original=JSON.stringify(window.NEWS_DATA),raw=JSON.stringify(payload),requestsBefore=requests.length;
 const eq=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
 const range=(start,end=start)=>({start,end});
 const config=(a,b=null,basis='occurrence')=>({preset:'custom',range:a,compare:!!b,comparisonMode:'custom',comparison:b,basis});
 // Manaus midnight, valid calendar dates, leap years, complete previous intervals.
 assert.equal(C.day('2026-10-18T03:59:59Z'),'2026-10-17');assert.equal(C.day('2026-10-18T04:00:00Z'),'2026-10-18');
 assert.equal(C.validDay('2026-02-30'),false);assert.equal(C.validDay('2024-02-29'),true);
 eq(C.preset('week',Date.parse('2026-10-18T21:00:00Z')),range('2026-10-12','2026-10-18'));
 eq(C.preset('lastWeek',Date.parse('2026-10-18T21:00:00Z')),range('2026-10-05','2026-10-11'));
 eq(C.preset('lastMonth',Date.parse('2026-03-01T04:00:00Z')),range('2026-02-01','2026-02-28'));
 eq(C.previous(range('2024-03-01','2024-03-07')),range('2024-02-23','2024-02-29'));
 for(const key of ['today','yesterday','week','lastWeek','last7','last28','last30','last90','month','lastMonth','year'])assert(C.validRange(C.preset(key)));
 for(const n of [7,28,30,90])assert.equal(C.duration(C.preset('last'+n)),n);
 // No publication/insertion fallback or invented daily precision.
 assert.equal(C.dateOf({event_date:null,publication_date:'2026-10-17',added_at:'2026-10-17T12:00:00Z'}).day,null);
 assert.equal(C.dateOf({event_date:'2026-10-17',event_date_precision:'month'}).day,null);
 assert.equal(C.dateOf({event_date:'2026-10-17',occurred_at_precision:'unknown'}).day,null);
 assert.equal(C.dateOf({event_date:'2026-10-17',event_end_date:'2026-10-18',occurred_at_precision:'day'}).day,null);
 assert.equal(C.dateOf({event_date:'2026-10-17',occurred_at:'2026-10-17T00:00:00Z',occurred_at_precision:'day'}).day,'2026-10-17');
 assert.equal(C.dateOf({event_date:'2026-10-17',occurred_at:'2026-10-17T03:59:59Z',occurred_at_precision:'datetime'}).day,'2026-10-16');
 assert.equal(C.dateOf({status:'VALIDATED',added_at:'2026-10-17T03:59:59Z'},'incorporation').day,'2026-10-16');
 for(const e of [{status:'PENDING',added_at:'2026-10-17T12:00:00Z'},{status:'VALIDATED',added_at:'2026-10-17T12:00:00'},{status:'VALIDATED',added_at:'2026-10-17T12:00:00Z',added_at_validated:false},{status:'VALIDATED',added_at:'9999-10-17T12:00:00Z'}])assert.equal(C.dateOf(e,'incorporation').day,null);
 eq(C.delta(4,0),{absolute:4,percent:null});eq(C.delta(12,8),{absolute:4,percent:50});eq(C.delta(0,10),{absolute:-10,percent:-100});
 const qbase={quantity_kind:'animals',quantity_count:10,quantity_qualifier:'exact'};
 const q=C.quantities([qbase,{...qbase,quantity_qualifier:'minimum',quantity_count:20},{...qbase,quantity_qualifier:'approximate',quantity_count:30},{...qbase,quantity_kind:'wildlife_items',quantity_count:4},{...qbase,quantity_kind:'animals_and_items',quantity_count:500},{...qbase,quantity_kind:'weight_kg',quantity_count:200},{...qbase,quantity_qualifier:'unknown'},{...qbase,quantity_qualifier:'not_fully_quantified'},{...qbase,exclude_from_totals:true,quantity_count:9999}]);
 assert.equal(q.animals.exact.value,10);assert.equal(q.animals.minimum.value,20);assert.equal(q.animals.approximate.value,30);assert.equal(q.wildlife_items.exact.value,4);assert.equal(q.mixed,1);assert.equal(q.unknown,1);assert.equal(q.not_fully_quantified,1);
 const taxa=[{taxon_text:'*Panthera leo*; *Boa* spp.'},{taxon_text:'Panthera pardus; Elephant ivory; Panthera sp.'}];
 const cats=C.speciesCatalog(taxa);eq(cats.get(taxa[1]),['Panthera pardus']);
 const fixture=[{event_date:'2026-10-01'},{event_date:'2026-10-03'},{event_date:'2026-10-03',exclude_from_totals:true},{event_date:null,publication_date:'2026-10-02'}];
 eq(C.cumulative(fixture,range('2026-10-01','2026-10-03'),'occurrence').map(p=>p.total),[1,1,2]);
 assert(C.cumulative(fixture,range('1900-01-01','2100-12-31'),'occurrence').length<=366);
 // Initial seven-day selection uses the shared occurrence filter; all-time stays selectable.
 assert.equal(T.state().preset,'last7');eq(T.state().range,C.preset('last7'));
 const initialRows=window.NEWS_DATA.filter(e=>C.contains(e,C.preset('last7'),'occurrence'));
 eq(run('filtered()').map(e=>e.id),initialRows.map(e=>e.id));assert.equal(layers.size,initialRows.length);
 assert(initialRows.every(e=>window.CaseContext.isRecent(e)));
 T.apply({preset:'all'});
 // All-time is identical, including imprecise records.
 assert.equal(run('filtered().length'),expectedCount);assert.equal(layers.size,expectedCount);
 await get('globeMode').onclick();get('routeLayer').checked=true;get('routeLayer').onchange();
 const audit=()=>{
  const visible=run('filtered()'),counted=visible.filter(e=>!e.exclude_from_totals),ids=visible.map(e=>e.id).sort();
  eq([...layers].map(m=>m.eventId).sort(),ids);
  eq(props.htmlElementsData.filter(p=>!p.routeAdornment).flatMap(p=>p.members).map(e=>e.id).sort(),ids);
  const routeIds=R.segments(visible,window.NEWS_DATA).map(s=>s.id).sort();eq(window.DocumentedRouteMap.segmentIds().sort(),routeIds);eq(props.pathsData.map(p=>p.id).sort(),routeIds);
  assert.equal(get('nEvents').textContent,counted.length.toLocaleString(({pt:'pt-BR',en:'en-US',es:'es-ES'})[run('lang')]));
  for(const m of layers){const e=visible.find(e=>e.id===m.eventId);assert.equal(m.style.fillColor,window.CaseContext.color(e));}
  const state=T.state(),a=run('filtered("a")'),b=run('filtered("b")');
  assert(a.every(e=>C.contains(e,state.range,state.basis)));if(state.compare)assert(b.every(e=>C.contains(e,state.comparison,state.basis)));
  assert(!get('timeComparePanel').innerHTML.includes('NaN'));assert(!get('timeComparePanel').innerHTML.includes('undefined'));assert(!get('timeComparePanel').innerHTML.includes('Infinity'));
  const cumulative=C.cumulative(a,state.range,state.basis);if(cumulative.length)assert.equal(cumulative.at(-1).total,a.filter(e=>!e.exclude_from_totals).length);
 };
 for(const basis of ['occurrence','incorporation']){
  for(const [a,b] of [[range('2026-10-06','2026-10-12'),range('2026-09-29','2026-10-05')],[range('2026-10-17'),range('2026-10-16')],[range('1800-01-01','1800-01-02'),range('1800-01-03')],[range('2026-09-21','2026-10-18'),range('2026-10-01','2026-10-15')]]){
   T.apply(config(a,b,basis));audit();T.apply({...T.state(),visible:'b'});audit();
   for(const language of ['pt','en','es']){get('language').onchange({target:{value:language}});audit();assert(get('timeOpen').textContent.startsWith(T.text[language].period));}
  }
 }
 for(const key of ['today','yesterday','week','lastWeek','last7','last28','last30','last90','month','lastMonth','year']){T.apply({preset:key,compare:true});eq(T.state().comparison,C.previous(T.state().range));audit();}
 T.apply(config(range('2026-01-01','2026-10-18'),range('2025-01-01','2025-12-31')));
 for(const [key,value]of [['country','Brasil'],['species','Aves'],['mode','Terrestre'],['year','2026']]){get(key).value=value;run('render()');audit();assert(run('filtered()').every(e=>run('matchesFilter') (e,key,value)));}
 get('recordSearch').value='Sporophila';get('recordSearch').input();for(const timer of timers.filter(x=>x.ms===125&&!x.cancelled)){timer.cancelled=true;timer.fn();}audit();assert(run('filtered()').every(e=>window.RecordSearch.matches(e)));
 for(const width of [1440,390])for(const theme of ['light','dark']){window.innerWidth=width;get('mapTheme').value=theme;get('mapTheme').onchange({target:{value:theme}});get('expandMap').onclick();audit();get('expandMap').onclick();}
 for(const language of ['en','es'])eq(Object.keys(T.text[language]).sort(),Object.keys(T.text.pt).sort());
 // Dialog is a draft: edits and Cancel cannot change the applied selection.
 const before=JSON.stringify(T.state());get('timeOpen').onclick();get('timeStart').value='1900-01-01';get('timeCancel').onclick();assert.equal(JSON.stringify(T.state()),before);
 get('timeOpen').onclick();get('timePreset').value='custom';get('timeStart').value='2026-10-18';get('timeEnd').value='2026-10-01';get('timeForm').onsubmit({preventDefault(){}});assert.equal(JSON.stringify(T.state()),before);assert(get('timeError').textContent);
 get('timeStart').value='2026-10-01';get('timeEnd').value='2026-10-18';get('timeCompare').checked=false;get('timeForm').onsubmit({preventDefault(){}});assert.equal(T.state().compare,false);
 // Remove only the date filter; existing filters remain. Global clear also resets time.
 T.reset();assert.equal(get('country').value,'Brasil');get('clear').onclick();assert.equal(T.state().range,null);
 get('recordSearch').value='';get('recordSearch').input();for(const timer of timers.filter(x=>x.ms===125&&!x.cancelled)){timer.cancelled=true;timer.fn();}assert.equal(run('filtered().length'),expectedCount);
 assert.equal(JSON.stringify(window.NEWS_DATA),original);assert.equal(JSON.stringify(payload),raw);assert.equal(requests.length,requestsBefore,'date and comparison interactions must not fetch');
 const summary={cases:expectedCount,occurrenceCoverage:C.coverage(window.NEWS_DATA,'occurrence'),incorporationCoverage:C.coverage(window.NEWS_DATA,'incorporation')};
 T.apply(config(range('2026-10-06','2026-10-12'),range('2026-09-29','2026-10-05')));
 const sa=run('filtered("a")'),sb=run('filtered("b")');summary.comparison={a:C.metrics(sa,R.segments(sa),C.speciesCatalog(window.NEWS_DATA)),b:C.metrics(sb,R.segments(sb),C.speciesCatalog(window.NEWS_DATA))};
 console.log('Temporal integration passed: presets, date precision, quantities, A/B, MAP/GLOBE routes, combined filters, multilingual UI, Apply/Cancel and zero extra requests.');
 console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e);process.exit(1);});

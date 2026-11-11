// Integration checks for the shared view adapter. WebGL itself is an external renderer.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let viewport={width:800,height:470},invalidations=0;
const css=fs.readFileSync('dist/globe-view.css','utf8');
assert(!/\.map-filter-button\{display:none!important\}/.test(css),'mobile filter button must remain available');
assert(css.includes('.map-expanded .map-filters-host{'),'preserve the floating filter panel');
const nodes=new Map(),listeners={},get=id=>{if(!nodes.has(id))nodes.set(id,{id,hidden:true,checked:false,value:'',style:{setProperty(k,v){this[k]=v}},dataset:{},attrs:{},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},removeAttribute(k){delete this.attrs[k]},addEventListener(){},before(n){this.slot=n},replaceWith(n){this.replacement=n},append(...n){this.children=n},replaceChildren(){},focus(){document.activeElement=this},querySelector(s){return get(s)},querySelectorAll(){return []},getClientRects(){return [1]},getBoundingClientRect(){return viewport}});return nodes.get(id)};
const document={body:get('body'),head:get('head'),activeElement:get('expandMap'),hidden:false,getElementById:get,querySelector:get,createElement:t=>get('created-'+t),createComment:t=>({replaceWith(n){this.replacement=n}}),addEventListener(k,fn){listeners[k]=fn}};
let pov={lat:14,lng:5,altitude:2.4},props={},constructs=0;
function Globe(){constructs++;return new Proxy({}, {get(o,k){if(k==='pointOfView')return v=>v?(pov=v,proxy):pov;if(k==='controls')return ()=>({addEventListener(){}});if(k==='globeMaterial')return ()=>({color:{set(){}}});if(k==='renderer')return ()=>({setPixelRatio(){}});if(k==='then')return undefined;return v=>{props[k]=v;return proxy;}}});}
let proxy;const Original=Globe;Globe=function(){proxy=new Original();return proxy};
const window={Globe,devicePixelRatio:1,innerWidth:800,scrollX:0,scrollY:300,addEventListener(k,fn){listeners['window-'+k]=fn},scrollTo(x,y){this.scrollX=x;this.scrollY=y}};
const c={window,document,console,URL,Intl,Date,AbortController,fetch:async()=>({ok:true,json:async()=>c.routeFeed}),setInterval(){},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){},messages:{pt:{title:'Observatório'},en:{title:'Observatory'},es:{title:'Observatorio'}}};vm.createContext(c);
for(const file of ['scientific-text.js','news-data.js','case-context.js','documented-routes.js','globe-data.js','globe-view.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),c);
window.NEWS_DATA=window.CaseSource.validate(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))).map(window.CaseSource.adapt);
const records=window.NEWS_DATA.map(window.CaseContext.enrich),original=JSON.stringify(records),D=window.GlobeData,V=window.ObservatoryGlobe;
// Finite-distance horizon checks include front/back, limb, poles and dateline.
assert(D.visible({lat:0,lng:0},{lat:0,lng:0,altitude:2}));
assert(!D.visible({lat:0,lng:180},{lat:0,lng:0,altitude:2}));
assert(!D.visible({lat:0,lng:90},{lat:0,lng:0,altitude:2}));
assert(!D.visible({lat:0,lng:75},{lat:0,lng:0,altitude:2}));
assert(D.visible({lat:0,lng:60},{lat:0,lng:0,altitude:2}));
assert(!D.visible({lat:0,lng:60},{lat:0,lng:0,altitude:.2}));
assert(D.visible({lat:89,lng:180},{lat:89,lng:0,altitude:2}));
assert(D.visible({lat:0,lng:-179.9},{lat:0,lng:179.9,altitude:2}));
assert(!D.visible({lat:0,lng:0},{lat:0,lng:0,altitude:NaN}));
const groups=D.cluster(records,12);assert.equal(groups.flatMap(g=>g.members).length,records.filter(D.valid).length);assert.equal(new Set(groups.flatMap(g=>g.members.map(e=>e.id))).size,records.length);for(const group of groups)assert.equal(group.recent,group.members.some(e=>window.CaseContext.isRecent(e)));
// Every event retains its own coordinate anchor, even at identical locations.
const singles=V.individual(records);assert.equal(singles.length,records.filter(D.valid).length);
for(const g of singles){assert.equal(g.members.length,1);assert.equal(g.lat,g.members[0].lat);assert.equal(g.lng,g.members[0].lng);}
const duplicates=V.individual([{...records[0],id:'same-a'},{...records[0],id:'same-b'}]);assert.equal(duplicates.length,2);
const recent={id:99998,lat:0,lng:179.9,date:'2026-09-14',occurred_at:new Date().toISOString()},older={id:99999,lat:0,lng:-179.9,date:'2026-09-12'};
const wrap=D.cluster([older,recent],1);assert.equal(wrap.length,1);assert.equal(wrap[0].members[0].id,recent.id);assert(wrap[0].recent);
assert.equal(D.cluster([{lat:NaN,lng:1},{lat:91,lng:1}],1).length,0);
assert.equal(D.routes([{lat:0,lng:0,summary:'From city A to city B'}]).length,0);
assert.equal(D.routes([{documented_routes:[{documented:true,points:[{lat:0,lng:0},{lat:1,lng:1}]}]}]).length,0,'Fixed metadata routes are ignored');
c.routeFeed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):{routes:[{id:'synthetic-route',event_match:{event_id:records[0].id},status:'DOCUMENTED',route_type:'planned_movement',direction:'forward',line_style:'solid',label_pt:'Rota',label_en:'Route',label_es:'Ruta',evidence_pt:'Teste',evidence_en:'Test',evidence_es:'Prueba',source_url:'https://example.org/source',segments:[{from:{lat:0,lon:0,name:'A',precision:'city'},to:{lat:10,lon:10,name:'B',precision:'city'}}]}]};
const analytics=[];window.ObservatoryAnalytics={track:(name,data)=>analytics.push({name,data})};
let mapRoutes=[];window.DocumentedRouteMap={init(){},setTheme(){},render(routes){mapRoutes=routes;}};
let filtered=records,lang='pt',selection=null;
const map={invalidateSize(){invalidations++},closePopup(){},latLngToContainerPoint([lat,lng]){return {distanceTo(p){return Math.hypot(lat-p.lat,lng-p.lng)},lat,lng}}};
V.init({map,filtered:()=>filtered,record:e=>e,popup:e=>'<article>'+e.id+window.CaseContext.html(e,lang)+'</article>',escape:s=>String(s),lang:()=>lang,select:id=>selection=id});
(async()=>{
 await window.DocumentedRoutes.refresh();
 assert.equal(constructs,0,'Globe must be lazy');assert.equal(analytics.length,0,'no events on initialization');
 await get('globeMode').onclick();assert.equal(constructs,1);assert.equal(analytics.length,1);assert.equal(analytics[0].name,'globe_view');await get('globeMode').onclick();assert.equal(analytics.length,1,'same mode does not emit twice');
 assert(props.htmlElementsData.every(g=>g.routeAdornment||g.members.length===1),'every globe event is individual');
 assert.equal(props.pointsData.length,0,'No duplicate native point layer');
 assert.equal(props.pointAltitude,0);assert.equal(props.labelAltitude,0);
 for(const recent of [false,true])assert.equal(props.htmlAltitude({recent,members:[records[0]]}),0,'all case anchors on sphere surface');
 assert.equal(props.htmlAltitude({routeAdornment:true}),window.DocumentedRoutes.surfaceAltitude,'route decoration aligned with line');
 assert.equal(props.htmlLat,'lat');assert.equal(props.htmlLng,'lng');
 pov={lat:0,lng:0,altitude:2};
 const marker=props.htmlElement({lat:0,lng:180,recent:false,members:[records[0]]});
 assert.equal(marker.style.visibility,'hidden');assert.equal(marker.style['pointer-events'],'none');assert.equal(marker.tabIndex,-1);
 props.onZoom({lat:0,lng:180,altitude:2});assert.equal(marker.style.visibility,'visible');assert.equal(marker.tabIndex,0);
 props.onZoom({lat:0,lng:0,altitude:2});assert.equal(marker.style.visibility,'hidden');
 get('mapTheme').onchange({target:{value:'light'}});assert.equal(get('mapViewCard').attrs['data-globe-theme'],'light');assert.equal(get('mapViewCard').attrs['data-map-theme'],'dark');
 await get('mapMode').onclick();assert.equal(get('mapTheme').value,'dark');get('mapTheme').onchange({target:{value:'light'}});assert.equal(get('mapViewCard').attrs['data-map-theme'],'light');
 await get('globeMode').onclick();assert.equal(get('mapTheme').value,'light');
 assert.equal(get('map').hidden,true);assert.equal(get('globe').hidden,false);assert.equal(props.htmlElementsData.flatMap(g=>g.members).length,records.length);
 filtered=records.filter(e=>e.country==='Índia');V.sync();assert.equal(props.htmlElementsData.flatMap(g=>g.members).length,filtered.length);assert.equal(props.pathsData.length,0);
 const target=filtered[0],beforeCase=analytics.length;V.locate(target);assert.equal(analytics.length,beforeCase+1);assert.equal(analytics.at(-1).name,'case_open');assert.equal(analytics.at(-1).data.case_id,target.id);assert.equal(selection,target.id);assert(get('mapDetailContent').innerHTML.includes('VALIDATED'));
 for(const l of ['pt','en','es']){lang=l;V.sync();assert(get('mapDetailContent').innerHTML.includes(window.CaseContext.labels[l].title));}
 const beforeFullscreen=analytics.length;window.innerWidth=390;get('expandMap').onclick();assert.equal(analytics.length,beforeFullscreen+1);assert.equal(analytics.at(-1).name,'fullscreen_use');assert.equal(get('mapFiltersHost').hidden,false,'mobile fullscreen filters are available and start open');assert.equal(document.body.style.overflow,'hidden');assert(get('mapFiltersHost').children.includes(get('.filters')));assert(get('.cardhead').children.includes(get('appearanceControls')),'appearance controls stay in the fullscreen header');
 await get('mapMode').onclick();assert.equal(get('map').hidden,false);await get('globeMode').onclick();assert.equal(constructs,1,'No duplicated globe on fullscreen or switching');
 // Existing resize path works across phone orientation changes without recreating either map.
 const beforeResize=invalidations;for(const dimensions of [{width:390,height:650},{width:844,height:260}]){viewport=dimensions;listeners['window-resize']();assert.equal(props.width,dimensions.width);assert.equal(props.height,dimensions.height);}
 assert.equal(invalidations,beforeResize+2,'Leaflet invalidates on each orientation resize');
 const altitude=pov.altitude;get('globeZoomIn').onclick();assert(pov.altitude<altitude);get('globeZoomOut').onclick();assert(pov.altitude>altitude*.75);
 get('toggleMapFilters').onclick();assert.equal(get('mapFiltersHost').hidden,true);get('toggleMapFilters').onclick();assert.equal(get('mapFiltersHost').hidden,false);
 get('expandMap').onclick();assert.equal(window.scrollY,300);assert.equal(filtered.length,records.filter(e=>e.country==='Índia').length);
 get('closeMapDetail').onclick();assert.equal(get('mapDetail').hidden,true);
 filtered=records;get('routeLayer').checked=true;V.sync();assert.equal(props.pathsData.length,D.routes(records).length);assert.deepEqual(mapRoutes.map(r=>r.id),props.pathsData.map(r=>r.id));
 assert.equal(props.pathDashGap,0);assert.equal(props.pathDashLength,1);assert.equal(props.pathPointAlt,window.DocumentedRoutes.surfaceAltitude);assert.equal(props.pathResolution,.5);
 const beforeRoute=analytics.length;props.onPathClick(props.pathsData[0]);assert.equal(analytics.length,beforeRoute+1);assert.equal(analytics.at(-1).name,'route_open');assert.equal(analytics.at(-1).data.route_id,props.pathsData[0].route.id);assert(get('mapDetailContent').innerHTML.includes('route-evidence'));
 for(const l of ['pt','en','es']){lang=l;V.sync();assert(get('mapDetailContent').innerHTML.includes(window.DocumentedRoutes.label(D.routes(records)[0],l)));}
assert.equal(analytics.length,beforeRoute+1,'translation and rerender do not emit');get('routeLayer').checked=false;V.sync();assert.equal(props.pathsData.length,0);
 filtered=[];V.sync();assert.equal(props.htmlElementsData.length,0);
 filtered=[...records,{...records[0],id:99997}];V.sync();assert.equal(props.htmlElementsData.flatMap(g=>g.members).length,records.length+1,'New records use the same source');
 assert.equal(JSON.stringify(records),original,'Visualization never mutates records');
 console.log('PASS: finite-distance globe occlusion, rotation updates, hidden marker interaction disabled, independent light/dark themes, lazy single globe, shared filters, full context PT/EN/ES, expanded control relocation/restoration, individual fixed anchors including coincident cases, recent priority, new records, empty state and documented-only route gate.');
})().catch(e=>{console.error(e);process.exitCode=1});

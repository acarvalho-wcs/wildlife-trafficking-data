// Focused regression checks for route symbols; no writes to either canonical feed.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const feed=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const before=JSON.stringify(feed),panes={},layers=[];
const c={window:{},URL,AbortController,setTimeout,clearTimeout,setInterval(){},document:{createElement:()=>({textContent:''})},fetch:async url=>{assert.equal(new URL(url).origin+new URL(url).pathname,'https://acarvalho-wcs.github.io/wildlife-trafficking-data/routes.json');return {ok:true,json:async()=>feed};}};
vm.createContext(c);
for(const name of ['news-data','documented-routes'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),c);
const R=c.window.DocumentedRoutes;
(async()=>{
 await R.refresh();
 const cases=c.window.CaseSource.validate(JSON.parse(fs.readFileSync(process.argv[3],'utf8'))).map(c.window.CaseSource.adapt);
 c.window.NEWS_DATA=cases;
 const segments=R.segments(cases),symbols=R.decorations(segments);
 for(const d of segments){const arrows=symbols.filter(s=>s.segment===d&&s.kind==='arrow');assert.equal(arrows.length,R.direction(d.direction)==='unspecified'?0:R.direction(d.direction)==='bidirectional'?2:1);for(const a of arrows){assert(Number.isFinite(a.lat)&&Number.isFinite(a.lng));assert.equal(a.sign,R.direction(d.direction)==='backward'?-1:1);}}
 for(const precision of ['exact','airport','border_port','port','border_checkpoint','border_post','rail_station','airport_transfer_point',undefined,'unknown'])assert(!R.approximate({precision}),String(precision));
 for(const precision of ['city','country_centroid','city_generalized','locality_approximate','airport_generalized','country_intended_destination'])assert(R.approximate({precision}),precision);
 for(const theme of ['light','dark'])assert.equal(R.visual(theme).color,'#808080');
 assert(R.symbol('arrow').includes('fill="#2F80ED"'));assert(R.symbol('approx').includes('fill="none"'));assert(!R.symbol('approx').includes('dash'));
 const make=(kind,geometry,options)=>{const span={style:{}};return {kind,geometry,options,span,addTo(){layers.push(this);return this},on(){return this},bindTooltip(){return this},getElement(){return kind==='marker'?{querySelector:()=>span}:null}};};
 c.L={layerGroup:()=>({addTo(){return this},clearLayers(){layers.length=0}}),polyline:(p,o)=>make('line',p,o),marker:(p,o)=>make('marker',p,o),divIcon:o=>o};
 vm.runInContext(fs.readFileSync('dist/route-map.js','utf8'),c);
 const M=c.window.DocumentedRouteMap;
 M.init({getPane:n=>panes[n],createPane:n=>(panes[n]={style:{}}),on(){},project:([lat,lng])=>({x:lng,y:-lat})},()=>{},()=> 'pt');
 const tiny={...segments[0],startLat:1,startLng:1,endLat:1.00001,endLng:1, direction:'forward',segment:{from:{lat:1,lon:1,precision:'exact'},to:{lat:1.00001,lon:1,precision:'exact'}}};
 M.render([tiny]);
 assert.equal(layers.find(l=>l.kind==='marker').span.style.transform,'rotate(-90deg)','subpixel geographic tangent must not round to zero');
 assert(+panes.documentedRouteSymbols.style.zIndex>600,'symbols above events');assert(+panes.documentedRouteSymbols.style.zIndex>+panes.documentedRoutes.style.zIndex);
 assert.equal(layers.find(l=>l.kind==='line').options.dashArray,null);
 assert.equal(JSON.stringify(feed),before,'canonical data is untouched');
 console.log(JSON.stringify({routesProcessed:feed.routes.length,matchedRoutes:new Set(segments.map(d=>d.route.id)).size,segments:segments.length,arrows:symbols.filter(s=>s.kind==='arrow').length,hollowReferences:symbols.filter(s=>s.kind==='approx').length,unknownDirectionSegments:segments.filter(d=>R.direction(d.direction)==='unspecified').length}));
 console.log('PASS: canonical source, all route symbols, precise/generalized/unknown coordinates, unknown direction, solid gray lines, transparent circles, layer order and subpixel orientation.');
})().catch(e=>{console.error(e);process.exitCode=1;});

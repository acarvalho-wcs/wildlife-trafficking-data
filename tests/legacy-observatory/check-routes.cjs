const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
let feed,fail=false;const intervals=[];
const c={window:{},URL,AbortController,console,setTimeout,clearTimeout,setInterval(fn,ms){intervals.push({fn,ms});},document:{hidden:false,addEventListener(){}},fetch:async(url,opts)=>{assert.equal(new URL(url).origin+new URL(url).pathname,'https://acarvalho-wcs.github.io/wildlife-trafficking-data/routes.json');assert.equal(opts.cache,'no-store');if(fail)throw Error('offline');return {ok:true,json:async()=>feed};}};
vm.createContext(c);for(const f of ['scientific-text.js','news-data.js','case-context.js','documented-routes.js','globe-data.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),c);
const source=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
c.window.NEWS_DATA=c.window.CaseSource.validate(source).map(c.window.CaseSource.adapt);
const R=c.window.DocumentedRoutes,events=c.window.NEWS_DATA.map(c.window.CaseContext.enrich),initial=JSON.stringify(events);
const fixture={id:'test',event_match:{event_id:events[0].id},status:'DOCUMENTED',route_type:'planned_movement',direction:'forward',line_style:'solid',label_pt:'Rota teste',label_en:'Test route',label_es:'Ruta de prueba',evidence_pt:'Evidência',evidence_en:'Evidence',evidence_es:'Evidencia',source_url:'https://example.org/source',segments:[{from:{lat:10,lon:170,name:'A',precision:'city'},to:{lat:15,lon:-170,name:'B',precision:'country_centroid_generalized'}}]};
(async()=>{
 feed=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):{routes:[fixture]};await R.refresh();const all=R.segments(events);
 // Compare selection against the published adapter, including current feed exclusions.
 const baseline={...c,window:{...c.window}};vm.createContext(baseline);vm.runInContext(cp.execFileSync('git',['show','457864db1d29a602409a1adffffffe8a6f99f47d:dist/documented-routes.js'],{encoding:'utf8'}),baseline);await baseline.window.DocumentedRoutes.refresh();
 assert.deepEqual(Array.from(all,d=>d.id),Array.from(baseline.window.DocumentedRoutes.segments(events),d=>d.id),'route selection identical to published version');
 console.log('Feed routes not rendered (same as published):',feed.routes.filter(r=>!all.some(d=>d.route.id===r.id)).map(r=>r.id));
 for(const d of all){assert(d.source);for(const lang of ['pt','en','es']){const html=R.html(d,lang);const escaped=value=>String(value||'').replaceAll('&','&amp;').replaceAll("'",'&#39;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');assert(html.includes(escaped(R.label(d,lang))));assert(html.includes(escaped(d.segment['evidence_'+lang]||d.route['evidence_'+lang]||'')));assert(html.includes(d.source.replaceAll('&','&amp;')));assert(html.includes(d.route.status));}assert.deepEqual(R.segments(events.filter(e=>e.id===d.event.id)).map(s=>s.id),all.filter(s=>s.event.id===d.event.id).map(s=>s.id));}
 for(const country of new Set(events.map(e=>e.country)))assert.deepEqual(R.segments(events.filter(e=>e.country===country)).map(s=>s.id),all.filter(s=>s.event.country===country).map(s=>s.id));
 // Exercise the real Leaflet route adapter with an instrumented renderer.
 const layers=[],panes={},clicks=[];
 c.document.createElement=()=>({textContent:''});
 const layer=(kind,geometry,options)=>({kind,geometry,options,events:{},setStyle(o){Object.assign(this.options,o);return this;},addTo(target){layers.push(this);return this;},bindTooltip(){return this;},on(event,fn){this.events[event]=fn;return this;},getElement(){return kind==='line'?{setAttribute(){},addEventListener(){}}:null;}});
 c.L={layerGroup:()=>({addTo(){return this;},clearLayers(){layers.length=0;}}),polyline:(p,o)=>layer('line',p,o),marker:(p,o)=>layer('marker',p,o),divIcon:o=>o};
 vm.runInContext(fs.readFileSync('dist/route-map.js','utf8'),c);
 const map={getPane:n=>panes[n],createPane:n=>(panes[n]={style:{}}),on(){},project:([lat,lng])=>({x:lng,y:-lat})};
 const M=c.window.DocumentedRouteMap;M.init(map,d=>clicks.push(d.id),()=> 'pt');M.render(all);
 assert.deepEqual(M.segmentIds(),all.map(d=>d.id));assert.equal(layers.filter(l=>l.kind==='line').length,all.length);
 for(const line of layers.filter(l=>l.kind==='line')){const d=all.find(d=>d.id===line.routeSegmentId);assert.equal(line.options.dashArray,null);assert.equal(line.options.color,R.visual('dark').color);line.events.click();}
 assert.equal(clicks.length,all.length);M.setTheme('light');for(const line of layers.filter(l=>l.kind==='line'))assert.equal(line.options.color,R.visual('light').color);M.render([]);assert.equal(layers.length,0);
 assert.equal(R.segments([]).length,0);assert.equal(JSON.stringify(events),initial,'no case mutation');
 // Every rendered chord stays outside the globe, including long routes and dateline crossings.
 for(const d of all){const pts=R.surfacePoints(d),v=p=>[Math.cos(p.lat*Math.PI/180)*Math.cos(p.lng*Math.PI/180),Math.sin(p.lat*Math.PI/180),Math.cos(p.lat*Math.PI/180)*Math.sin(p.lng*Math.PI/180)];for(let i=1;i<pts.length;i++){const a=v(pts[i-1]),b=v(pts[i]),mid=a.map((x,j)=>(x+b[j])*.5*(1+R.surfaceAltitude));assert(Math.hypot(...mid)>1,'surface path never cuts through globe');}}
 // Future records, exclusion gates, source safety and absence of historical narrative inference.
 feed={routes:[fixture,{...fixture,id:'blocked'},{...fixture,id:'network',route_type:'network_context'},{...fixture,id:'history',context_only:true}],excluded:[{id:'blocked'}],network_context:[{...fixture,id:'network'}]};await R.refresh();assert.deepEqual(Array.from(R.segments(events),r=>r.route.id),['test']);
 const one=R.segments(events)[0],parts=R.paths(one);assert.equal(parts.length,2);for(const part of parts)for(let i=1;i<part.length;i++)assert(Math.abs(part[i][1]-part[i-1][1])<180,'no line across the world at dateline');
 for(const [direction,count] of [['forward',1],['backward',1],['bidirectional',2],['unspecified',0],['none',0]])assert.equal(R.decorations([{...one,direction}]).filter(d=>d.kind==='arrow').length,count);
 assert.equal(R.decorations([one]).filter(d=>d.kind==='approx').length,2);assert(!R.approximate({precision:'airport'}));
 assert(!R.matches({city:'Town',date:'2026-09-01',eventDate:null},{location_contains:'Town',event_date:'2026-09-01'}),'publication date never becomes event date');
 assert(R.matches({city:'Estrada Kano–Daura',eventDate:'2026-09-01'},{location_contains:'Kano-Daura',event_date:'2026-09-01'}));
 assert(!R.matches(events[0],{unknown_field:'x'}));assert(!R.matches(events[0],{}));
 assert.equal(R.segments(events,[...c.window.NEWS_DATA,{...c.window.NEWS_DATA[0]}]).length,0,'ambiguous identity is not guessed');
 feed={routes:[{...fixture,segments:[{...fixture.segments[0],direction:null},{...fixture.segments[0],direction:'unspecified'},{...fixture.segments[0],direction:'backward'}]}]};await R.refresh();assert.deepEqual(Array.from(R.segments(events),d=>R.direction(d.direction)),['unspecified','unspecified','backward']);assert.equal(R.decorations(R.segments(events)).filter(d=>d.kind==='arrow').length,1);
 feed={routes:[{...fixture,id:'second',segments:[...fixture.segments,...fixture.segments]}]};R.start();await R.refresh();assert.equal(R.segments(events).length,2);assert.equal(intervals[0].ms,300000);
 fail=true;await R.refresh();assert.equal(R.state().status,'error');assert.equal(R.segments(events).length,2);fail=false;feed={routes:[]};await R.refresh();assert.equal(R.segments(events).length,0);
 // Preserve the published rendering baseline, including the later recency-clock fix.
 for(const file of ['globe-data.js'])assert.equal(fs.readFileSync('dist/'+file,'utf8'),cp.execFileSync('git',['show','b29cf85305c72ffa7e315912f803059fea03cc84:dist/'+file],{encoding:'utf8'}));
 // Temporal filtering is an authorized pipeline extension. Marker creation/color logic stays unchanged.
 const live=fs.readFileSync('dist/live.js','utf8'),before=cp.execFileSync('git',['show','ff9a6e27b0e9efe3851d9c398585cd0f780b6481:dist/live.js'],{encoding:'utf8'});
 const markers=s=>s.slice(s.indexOf(' markers.forEach(m=>map.removeLayer(m))'),s.indexOf(' window.RecentPulse.sync(map,data,markers);'));
 assert.equal(markers(live).replace("radius:3.75,stroke:true,weight:1.5,color:'#245b40',className:'seizure-circle'","radius:3,stroke:true,weight:1,color:'#000'"),markers(before),'only authorized NIMF marker styling changes marker rendering');
 console.log('PASS: '+all.length+' external segments; unique matching, shared filter selection, all languages, precision/direction, exclusions, source fallback, dynamic refresh, failure recovery, dateline and unchanged case data.');
})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let instance;const created=[];
class MapMock{
 constructor(options){this.options=options;this.center={lng:5,lat:14};this.zoom=1;this.handlers={};this.sources={};this.transform={isLocationOccluded:p=>p.lng===180};instance=this;}
 on(name,a,b){(this.handlers[name]??=[]).push(b||a);return this;}addControl(){}getCenter(){return this.center;}getZoom(){return this.zoom;}
 easeTo(p){this.center={lng:p.center[0],lat:p.center[1]};this.zoom=p.zoom;for(const cb of this.handlers.move||[])cb();}
 once(name,fn){this.pendingCallback=fn;return this;}isStyleLoaded(){return !this.pending;}setProjection(p){this.projection=p;}getSource(id){return this.sources[id];}addSource(id,source){this.sources[id]={...source,setData(data){this.data=data;}};}addLayer(){}setPaintProperty(){}setStyle(s){this.style=s;this.sources={};for(const cb of this.handlers['style.load']||[])cb();}project(p){return {x:p[0],y:p[1]};}resize(){}remove(){}
}
class Marker{constructor(opts){this.options=opts;created.push(this);}setLngLat(p){this.position=p;return this;}addTo(){return this;}getElement(){return this.options.element;}remove(){this.removed=true;}}
const window={maplibregl:{Map:MapMock,Marker,AttributionControl:class{},LngLat:{convert:([lng,lat])=>({lng,lat})}},DocumentedRoutes:{paths:d=>d.path,visual:()=>({color:'#808080'})}};
const c={window,console};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/maplibre-surface.js','utf8'),c);
const globe=new window.Globe({}),r={id:'r1',path:[[[1,2],[3,4]]]};
globe.htmlElement(d=>({d}));const records=[{lat:0,lng:0},{lat:0,lng:0},{lat:1,lng:2}];globe.htmlElementsData(records).pathsData([r]);
assert.equal(created.length,3);assert.deepEqual(JSON.parse(JSON.stringify(created.map(m=>m.position))),[[0,0],[0,0],[2,1]]);
for(const altitude of [4.8,2.4,.1,.00001])globe.pointOfView({lat:14,lng:5,altitude});
assert.equal(created.length,3,'zoom never recreates or clusters markers');assert(created.every(m=>!m.removed));
assert.equal(globe.isVisible({lat:0,lng:180}),false);assert.equal(globe.isVisible({lat:0,lng:0}),true);
assert.equal(instance.options.projection.type,'globe');assert(instance.options.style.includes('dark-matter-gl-style'));
globe.setTheme('light');assert(instance.style.includes('positron-gl-style'));assert.equal(instance.projection.type,'globe');
assert.equal(instance.getSource('documented-routes').data.features[0].geometry.type,'MultiLineString');
assert.deepEqual(JSON.parse(JSON.stringify(instance.getSource('documented-routes').data.features[0].geometry.coordinates)),[[[2,1],[4,3]]]);
assert(created.every(m=>m.options.opacityWhenCovered==='0'));
instance.pending=true;globe.pathsData([]);instance.pending=false;instance.pendingCallback();assert.equal(instance.getSource('documented-routes').data.features.length,0,'filtered routes update even when tiles are still loading');
console.log('PASS: MapLibre globe, exact CARTO styles, individual coincident anchors stable across zoom, horizon interaction, documented route coordinates and restoration after theme changes.');
// Route symbols must refresh at render time even when the camera has not moved.
const spans=[],elements=[];
Marker.prototype.getLngLat=function(){return {lng:this.position[0],lat:this.position[1]};};
window.DocumentedRoutes.point=(d,t)=>({lat:0,lng:t<.5?179.9:-179.9});
globe.htmlElement(d=>{const span={style:{}},el={routeDecoration:d,style:{setProperty(k,v){this[k]=v;}},setAttribute(k,v){this[k]=v;},querySelector(){return span;}};spans.push(span);elements.push(el);return el;});
globe.htmlElementsData([{routeAdornment:true,kind:'arrow',lat:0,lng:179.99,fraction:.5,sign:1,segment:{}},{routeAdornment:true,kind:'approx',lat:0,lng:180}]);
assert.equal(spans[0].style.transform,'rotate(0deg)','dateline crossing must point east, not west');
assert.equal(elements[1].style.visibility,'hidden');
instance.transform.isLocationOccluded=()=>false;
for(const cb of instance.handlers.render||[])cb();
assert.equal(elements[1].style.visibility,'visible','circle restored without camera movement');
assert.equal(elements[1]['aria-hidden'],'false');assert.equal(elements[1].tabIndex,0);
assert.equal(elements[1].style['pointer-events'],'none','hollow circle center stays transparent to clicks');
instance.transform.isLocationOccluded=()=>true;
for(const cb of instance.handlers.render||[])cb();
assert.equal(elements[0].style.visibility,'hidden');assert.equal(elements[0].tabIndex,-1);
console.log('PASS: route arrow antimeridian direction and circle visibility across stationary projection/render changes.');

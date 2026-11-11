// Compare geometry with the untouched source; never write canonical datasets.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const feed=JSON.parse(fs.readFileSync(process.argv[2])),before=JSON.stringify(feed);
function load(source){const c={window:{},URL,AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async()=>({ok:true,json:async()=>feed})};vm.createContext(c);vm.runInContext(source,c);return c.window.DocumentedRoutes;}
const baseline=process.argv[3]?fs.readFileSync(process.argv[3],'utf8'):require('node:child_process').execFileSync('git',['show','f2b574468f33dd9f578973ecc01d9e5327ff7918:dist/documented-routes.js'],{encoding:'utf8'});
const old=load(baseline),now=load(fs.readFileSync('dist/documented-routes.js','utf8'));
const ids=new Set(['tgh-global-20261108-09-am-01-r02','ornfish-20261013-01','tgh-20261028-callao-china-seahorses']);
const summary=[];let unchanged=0;
for(const route of feed.routes)for(const [i,segment] of route.segments.entries()){
 const d={id:route.id+':'+i,route,segment,startLat:segment.from.lat,startLng:segment.from.lon,endLat:segment.to.lat,endLng:segment.to.lon,direction:route.direction};
 const corrected=ids.has(route.id)&&i===0;
 if(!corrected){for(let j=0;j<=192;j++)assert.equal(JSON.stringify(now.point(d,j/192)),JSON.stringify(old.point(d,j/192)),d.id);assert.equal(JSON.stringify(now.paths(d)),JSON.stringify(old.paths(d)));assert.equal(JSON.stringify(now.surfacePoints(d)),JSON.stringify(old.surfacePoints(d)));unchanged++;continue;}
 assert.equal(JSON.stringify(now.point(d,0)),JSON.stringify({lat:d.startLat,lng:d.startLng}));assert.equal(JSON.stringify(now.point(d,1)),JSON.stringify({lat:d.endLat,lng:d.endLng}));
 const path=now.paths(d);assert.equal(path.length,1,'no edge split/disconnection');assert.equal(JSON.stringify(path[0][0]),JSON.stringify([d.startLat,d.startLng]));assert.equal(JSON.stringify(path[0].at(-1)),JSON.stringify([d.endLat,d.endLng]));
 const samples=Array.from({length:1001},(_,j)=>now.point(d,j/1000));
 for(const [j,p] of samples.entries()){assert(Math.abs(p.lat)<60);assert(Math.abs(p.lng)<180);if(j)assert(Math.abs(p.lng-samples[j-1].lng)<1);}
 for(const p of now.surfacePoints(d))assert(Math.abs(p.lat)<60);
 for(const lang of ['pt','en','es'])assert.equal(now.html(d,lang),old.html(d,lang),'popup unchanged');
 const symbols=now.decorations([d]);for(const x of symbols.filter(x=>x.kind==='approx'))assert([segment.from,segment.to].some(p=>p.lat===x.lat&&p.lon===x.lng));
 const arrow=symbols.find(x=>x.kind==='arrow');assert.equal(JSON.stringify({lat:arrow.lat,lng:arrow.lng}),JSON.stringify(now.point(d,.5)));
 const revised={...d,endLat:d.endLat+.001};assert.equal(JSON.stringify(now.point(revised,.5)),JSON.stringify(old.point(revised,.5)),'endpoint guard');
 summary.push({id:route.id,minLat:Math.min(...samples.map(p=>p.lat)),maxLat:Math.max(...samples.map(p=>p.lat)),oldExtreme:Math.max(...samples.map((_,j)=>Math.abs(old.point(d,j/1000).lat)))});
}
assert.equal(summary.length,3);assert.equal(JSON.stringify(feed),before);
// A legitimate antimeridian crossing keeps the default split and interpolation.
const cross={id:'unaffected:0',startLat:10,startLng:170,endLat:20,endLng:-170};assert.equal(JSON.stringify(now.paths(cross)),JSON.stringify(old.paths(cross)));assert.equal(now.paths(cross).length,2);
console.log(JSON.stringify({corrected:summary,unchangedSegments:unchanged,canonicalUnchanged:true}));

const batch=feed.routes.filter(r=>r.id.startsWith('tgh-global-20261108-09-'));assert.equal(batch.length,5);assert.equal(batch.filter(r=>ids.has(r.id)).length,1);console.log('PASS: five routes from e854eb5 checked; only São Paulo–Australia differs in that batch.');

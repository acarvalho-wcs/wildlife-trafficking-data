/* Run: node --test tests/clean-map-story-cards.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','clean-map-story-cards.js'),'utf8'),context);
const {candidates,format,point}=context.window.CleanMapStoryCards;
test('filters candidate mini cards using only selected countable georeferenced events',()=>{
 const records=[{id:'a',lat:0,lng:0},{id:'b',lat:0,lng:0,exclude_from_totals:true},{id:'c',lat:null,lng:0},{id:'d',lat:91,lng:1},{id:'e',lat:1,lng:2}];
 const found=candidates(records,e=>e.exclude_from_totals!==true);
 assert.deepEqual(Array.from(found,e=>e.id),['a','e']);
 assert.equal(candidates([]).length,0);
});
test('globe occlusion prevents back-side or out-of-screen connections',()=>{
 const fakeMap={project:()=>({x:120,y:90}),getContainer:()=>({clientWidth:450,clientHeight:260})};
 const e={id:'a',lat:-3,lng:-60};
 assert.equal(point(e,fakeMap,()=>false),null);
 assert.equal(point(e,fakeMap,()=>true).x,120);
 fakeMap.project=()=>({x:800,y:40});
 assert.equal(point(e,fakeMap,()=>true),null);
});
test('uses actual event date, otherwise labels publication date distinctly',()=>{
 const a=format({event_date:'2026-11-15',publication_date:'2026-11-16',items:4},{city:'Manaus',country:'Brazil',title:'Event'},'en');
 assert.ok(a.date.startsWith('Occurred:'));assert.equal(a.quantity,'4 items');
 const b=format({event_date:null,publication_date:'2026-11-16',items:null},{title:'Event'},'pt');
 assert.ok(b.date.startsWith('Publicado:'));assert.equal(b.quantity,'');
});
test('escapes untrusted titles by returning plain text and never generating markup',()=>{
 const a=format({},{title:'<script>alert(1)</script>'},'en');
 assert.equal(a.title,'<script>alert(1)</script>');
 const source=fs.readFileSync(path.join(__dirname,'..','clean-map-story-cards.js'),'utf8');
 assert.ok(source.includes('textContent=d.title'));
 assert.ok(!source.includes('.innerHTML'));
});

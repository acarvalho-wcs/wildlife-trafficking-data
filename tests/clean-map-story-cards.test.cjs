/* Run: node --test tests/clean-map-story-cards.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','clean-map-story-cards.js'),'utf8'),context);
const {candidates,format,point}=context.window.CleanMapStoryCards;
test('uses only selected countable georeferenced events',()=>{
 const records=[{id:'a',lat:0,lng:0},{id:'b',lat:0,lng:0,exclude_from_totals:true},{id:'c',lat:null,lng:0},{id:'d',lat:91,lng:1},{id:'e',lat:1,lng:2}];
 assert.deepEqual(Array.from(candidates(records,e=>e.exclude_from_totals!==true),e=>e.id),['a','e']);
 assert.equal(candidates([]).length,0);
});
test('globe occlusion hides back-side and offscreen connections',()=>{
 const map={project:()=>({x:120,y:90}),getContainer:()=>({clientWidth:450,clientHeight:260})};
 const e={id:'a',lat:-3,lng:-60};
 assert.equal(point(e,map,()=>false),null);
 assert.equal(point(e,map,()=>true).x,120);
 map.project=()=>({x:800,y:40});
 assert.equal(point(e,map,()=>true),null);
});
test('shows both independent dates; missing occurrence is not inferred',()=>{
 const a=format({event_date:'2026-11-15',publication_date:'2026-11-16',items:4},{city:'Manaus',country:'Brazil',title:'Event'},'en');
 assert.ok(a.eventDate.startsWith('Event:'));assert.ok(a.publicationDate.startsWith('Publication:'));
 assert.equal(a.quantity,'4 items');
 const b=format({event_date:null,publication_date:'2026-11-16',items:null},{title:'Event'},'pt');
 assert.equal(b.eventDate,'Evento: —');assert.ok(b.publicationDate.startsWith('Publicação:'));
 assert.equal(b.quantity,'');
});
test('title and full short description are retained without truncation',()=>{
 const full='An exceptionally long title with details that should not be truncated or shortened';
 const description='Complete source-derived short description, including details at the end of the sentence.';
 const a=format({event_date:'2026-11-15'}, {title:full,summary:description},'en');
 assert.equal(a.title,full);assert.equal(a.description,description);
 const b=format({card_text_pt:'Descrição em português.'},{},'pt');
 assert.equal(b.description,'Descrição em português.');
});
test('event fields always use textContent rather than untrusted HTML',()=>{
 const a=format({},{title:'<script>alert(1)</script>',summary:'<img src=x onerror=alert(1)>'},'en');
 assert.equal(a.title,'<script>alert(1)</script>');
 assert.equal(a.description,'<img src=x onerror=alert(1)>');
 const source=fs.readFileSync(path.join(__dirname,'..','clean-map-story-cards.js'),'utf8');
 assert.ok(source.includes('nodes.description.textContent=d.description'));
 assert.ok(!source.includes('.innerHTML'));
});

/* Run: node --test tests/exact-location-groups.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const window={CaseContext:{isRecent:e=>Boolean(e.recent)},DocumentedRoutes:{segments:()=>[]}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','globe-data.js'),'utf8'),{window});
const groups=records=>window.GlobeData.exactGroups(records);
test('exact matches group, but close coordinates remain distinct',()=>{
 const data=[{id:'A',lat:-3.1,lng:-60.02,date:'2026-11-12'},{id:'B',lat:-3.1,lng:-60.02,date:'2026-11-15'},{id:'C',lat:-3.1000001,lng:-60.02,date:'2026-11-16'}];
 const result=groups(data);
 assert.equal(result.length,2);
 assert.deepEqual(Array.from(result.find(g=>g.lat===-3.1).members,e=>e.id),['B','A']);
 assert.equal(result.find(g=>g.lat===-3.1000001).members.length,1);
});
test('count uses only records in the current selection',()=>{
 const data=[{id:'A',lat:1,lng:2},{id:'B',lat:1,lng:2},{id:'C',lat:1,lng:2}];
 assert.equal(groups(data)[0].members.length,3);
 assert.equal(groups(data.slice(0,2))[0].members.length,2);
 assert.equal(groups(data.slice(0,1))[0].members.length,1);
 assert.equal(groups([]).length,0);
});
test('invalid coordinates omitted; no rounding',()=>{
 const result=groups([{id:'valid',lat:0,lng:0},{id:'invalid',lat:91,lng:0},{id:'missing',lat:null,lng:0},{id:'near',lat:0,lng:0.00000001}]);
 assert.equal(result.length,2);
 assert.deepEqual(Array.from(result,g=>g.members[0].id).sort(),['near','valid']);
});

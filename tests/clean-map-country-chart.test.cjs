/* Run: node --test tests/clean-map-country-chart.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','clean-map-country-chart.js'),'utf8'),ctx);
const summarize=ctx.window.CleanMapCountryChart.summarize;
const make=(country,n)=>Array.from({length:n},(_,i)=>({id:country+i,country}));
test('groups one countable seizure event per country, not specimens',()=>{
 const rows=[{country:'Brazil',animal_count:500},{country:'Brazil',animal_count:1},{country:'Peru',animal_count:100}];
 const summary=summarize(rows,{limit:8});
 assert.equal(summary.total,3);assert.equal(summary.countries,2);
 assert.deepEqual(Array.from(summary.rows,x=>[x.key,x.count]),[['Brazil',2],['Peru',1]]);
});
test('excludes aggregates already excluded from dashboard totals',()=>{
 const records=[{country:'Brazil'},{country:'Brazil',exclude_from_totals:true},{country:'Peru'}];
 const counted=e=>e.exclude_from_totals!==true;
 const result=summarize(records,{countable:counted});
 assert.equal(result.total,2);assert.equal(result.countries,2);
});
test('top categories and other countries add to exactly filtered event count',()=>{
 const records=[...make('A',9),...make('B',6),...make('C',4),...make('D',2),...make('E',1)];
 const result=summarize(records,{limit:3});
 assert.equal(result.total,22);assert.equal(result.showing,3);assert.equal(result.remainingEvents,3);
 assert.equal(result.remainingCountries,2);
 assert.equal(result.rows.reduce((s,r)=>s+r.count,0)+result.remainingEvents,result.total);
});
test('rerunning on a smaller filtered selection reaggregates without stale values',()=>{
 const records=[...make('A',3),...make('B',2)];
 assert.equal(summarize(records).total,5);
 assert.equal(summarize(records.slice(0,2)).total,2);
 assert.equal(summarize([]).total,0);
});
test('translated display labels are kept separate from raw grouping keys',()=>{
 const result=summarize([{country:'Brasil'},{country:'Brasil'},{country:'Peru'}],{countryLabel:e=>e.country==='Brasil'?'Brazil':'Peru'});
 assert.equal(result.rows[0].key,'Brasil');assert.equal(result.rows[0].label,'Brazil');
});

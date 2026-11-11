const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{},Intl,URL};vm.createContext(c);
for(const f of ['news-data.js','case-metadata.js','case-context.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),c);
const api=c.window.CaseContext,events=c.window.NEWS_DATA.map(api.enrich),expected=Number(process.argv[2]);
assert(Number.isInteger(expected)&&expected>0,'Provide the exact approved publication count');
assert.equal(events.length,expected,'Publication blocked: unexpected record count');
assert.equal(new Set(events.map(e=>e.id)).size,expected,'Duplicate record IDs');
assert.equal(new Set(events.map(e=>e.case_id)).size,expected,'Duplicate stable case IDs');
const review=JSON.parse(fs.readFileSync('scripts/context-backfill-review.json','utf8'));
const report=[];
for(const e of events){
 assert.equal(e.status,'VALIDATED','Case '+e.id+' status');assert(e.case_context,'Case '+e.id+' lacks case_context');
 assert.equal(api.validationErrors(e).length,0,'Case '+e.id+' incomplete validation');
 assert(api.complete(e),'Case '+e.id+' not complete');
 for(const lang of ['pt','en','es'])assert(api.html(e,lang).includes('VALIDATED'),'Case '+e.id+' missing '+lang);
 if(e.context_review){
  const original=review.entries.find(r=>r.case===e.context_review.case);assert(original);
  for(const l of ['pt','en','es'])for(const part of ['facts','context','limits']){
   assert.equal(e.case_context.sections[l][part],original[l][part]);assert(e.case_context[l].includes(original[l][part]));
  }
  assert.equal(e.case_context.references.length,original.references.length);
  original.references.forEach((r,i)=>{const imported=e.case_context.references[i];for(const key of Object.keys(r))assert.equal(imported[key],r[key]);});
 }
 if(e.record_type==='aggregate_operation'||e.aggregate_operation){assert.equal(api.countable(e),false);assert.equal(e.record_type,'aggregate_operation');}
 report.push({id:e.id,case_id:e.case_id,city:e.city,status:e.status,languages:['pt','en','es'],reference_count:e.case_context.references.length,context_updated_at:e.context_updated_at,record_type:api.countable(e)?'event':'aggregate_operation',counted_globally:api.countable(e)});
}
assert.equal(events.filter(e=>e.context_review).length,review.entries.length);
assert.equal(events.filter(e=>!api.countable(e)).map(e=>e.id).sort().join(','),'3008,3033');
assert.equal(events.filter(api.complete).length,expected);
const result={audited_at:new Date().toISOString(),expected_records:expected,unique_records:events.length,complete_contexts:events.filter(api.complete).length,coverage_percent:100,individual_events:events.filter(api.countable).length,aggregate_operations:events.filter(e=>!api.countable(e)).length,reference_validation_basis:'32 user-validated review entries plus existing and newly source-checked contexts; reference-level verification provenance retained',cases:report};
fs.writeFileSync('scripts/context-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({unique_records:result.unique_records,complete_contexts:result.complete_contexts,individual_events:result.individual_events,aggregate_operations:result.aggregate_operations,case_ids:report.map(r=>r.case_id),result:'PASS'}));

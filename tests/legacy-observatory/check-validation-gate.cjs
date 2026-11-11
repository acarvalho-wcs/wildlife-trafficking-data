const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{},Intl,URL};vm.createContext(c);
for(const file of ['news-data.js','case-metadata.js','case-context.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),c);
for(const raw of c.window.NEWS_DATA){const e=c.window.CaseContext.enrich(raw);assert.deepEqual(c.window.CaseContext.validationErrors(e).join('; '),'','Case '+e.id+' cannot be VALIDATED without complete, source-verified context');}
console.log('PASS: validation gate; all validation requires complete case_context and dated reference verification.');

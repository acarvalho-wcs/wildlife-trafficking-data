const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes={},get=id=>nodes[id]??={value:'',setAttribute(){},addEventListener(name,fn){this[name]=fn},focus(){}};
let changes=0,tasks=[],segments=[],routeCallback;const window={NEWS_TERMS:{Brasil:['Brazil','Brasil']},DocumentedRoutes:{segments:()=>segments,subscribe:fn=>routeCallback=fn,state:()=>({status:'ready'})}};
const context=vm.createContext({window,document:{getElementById:get},setTimeout(fn,ms){tasks.push({fn,ms});return tasks.length},clearTimeout(id){if(tasks[id-1])tasks[id-1].cancelled=true}});
vm.runInContext(fs.readFileSync('dist/live-search.js','utf8'),context);
const S=window.RecordSearch;S.init(()=>changes++);
let reads=0;const e={id:'one',get title_pt(){reads++;return 'São Paulo'},title_en:'Macaw',title_es:'Guacamayo',country:'Brasil',nested:{items_cited:[{scientific:'Anodorhynchus leari',transport:{pt:'aeroporto',en:'airport',es:'aeropuerto'}}]}};
const cases=[e,{id:'two',context_en:'Pangolin'}];S.setCases(cases);const readsAfterIndex=reads;
const search=q=>{get('recordSearch').value=q;get('recordSearch').input();const job=tasks.at(-1);assert.equal(job.ms,125);job.fn();};
for(const term of ['SAO   PAULO','São Paulo','Anodorhynchus leari','macaw','guacamayo','airport','aeroporto','aeropuerto','Brazil']){search(term);assert(S.matches(e),term);assert(!S.matches(cases[1]));}
assert.equal(reads,readsAfterIndex,'text indexed once, not once per keystroke');S.setCases(cases);assert.equal(reads,readsAfterIndex,'same collection is not rebuilt');
segments=[{event:e,route:{id:'route1',segments:[{label_en:'unique nested maritime corridor'}]}}];routeCallback();search('maritime corridor');assert(S.matches(e));assert(!S.matches(cases[1]));assert.equal(reads,readsAfterIndex,'route update reuses case text index');
search('no match');assert(!cases.some(S.matches));search('');assert(cases.every(S.matches));
search('macaw');get('clearRecordSearch').click();assert.equal(get('recordSearch').value,'');assert(cases.every(S.matches));
const malicious={id:'three',title_pt:'<script>alert(1)</script>'};S.setCases([...cases,malicious]);search('Anodorhynchus');assert(S.matches(e));search('script');assert(S.matches(malicious),'index is inert text');
assert.equal(S.normalize('  RÉPTIL\t  tráfico '),'reptil trafico');
console.log('PASS: nested fields, scientific names, multilingual case/vocabulary/route values, diacritics, one-time indexing, growth and zero-results.');

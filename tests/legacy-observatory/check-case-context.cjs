const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},style:{},setAttribute(){},addEventListener(){},after(){},classList:{contains(){return false},toggle(){}}});return elements.get(id);};
const layers=new Set();let timer;
const map={setView(){return this},removeLayer(m){layers.delete(m)},on(){},invalidateSize(){}};
const context={window:{addEventListener(){}},Intl,URL,console,Date,setTimeout(fn,ms){timer={fn,ms};return 1},clearTimeout(){},requestAnimationFrame(fn){fn()},document:{hidden:false,documentElement:{},head:{appendChild(){}},getElementById:el,querySelector:el,querySelectorAll(){return []},createElement:el,addEventListener(){}},L:{map(){return map},tileLayer(){return {addTo(){}}},control:{zoom(){return {addTo(){return {options:{}}}}}},circleMarker(coords,style){return {coords,style,addTo(){layers.add(this);return this},bindPopup(content){this.content=content;return this},on(){},openPopup(){},setStyle(s){Object.assign(this.style,s)},setPopupContent(s){this.content=s}}}}};
vm.createContext(context);
for(const f of ['news-data.js','translations.js','case-metadata.js','case-context.js','case-media-data.js','case-media.js','live.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),context);
const api=context.window.CaseContext,now=Date.now(),iso=ms=>new Date(ms).toISOString();
for(const [age,recent] of [[0,true],[1,true],[86399999,true],[86400000,false],[86400001,false],[-1,false]])assert.equal(api.isRecent({added_at:iso(now-age)},now),recent);
for(const added_at of [null,undefined,'bad','2026-09-12'])assert.equal(api.isRecent({added_at},now),false);
assert(!api.isRecent({date:iso(now),eventDate:iso(now)},now));
const fixture={case_id:'TEST-ONLY',added_at:iso(now-3600000),context_status:'validated',context_updated_at:iso(now),context_pt:'Contexto verificado <script>',context_en:'Verified context <script>',context_es:'Contexto verificado <script>',context_references:[{title:'Research',url:'https://wildlife-research.wcs-associa-6434.chatgpt.site'},{title:'Journalism',url:'https://fauna-reportagens.wcs-associa-6434.chatgpt.site'},{title:'Unsafe',url:'javascript:alert(1)'}]};
for(const lang of ['pt','en','es']){
 const html=api.html(fixture,lang);assert(html.includes(api.labels[lang].title));assert(html.includes('VALIDATED'));assert(html.includes('References')||html.includes('Referências')||html.includes('Referencias'));assert(!html.includes('<script>'));assert(!html.includes('javascript:'));assert(html.includes('wildlife-research')&&html.includes('fauna-reportagens'));assert(api.added(fixture,lang,now).includes(api.labels[lang].added));
 for(const status of [undefined,'pending','draft','rejected','VALIDATED'])assert.equal(api.html({...fixture,context_status:status},lang),'');
 assert.equal(api.html({...fixture,['context_'+lang]:''},lang),'');
 assert.equal(api.html({...fixture,context_references:[]},lang),'');
 vm.runInContext(`lang='${lang}';setup()`,context);assert.equal(layers.size,91);assert(el('caseLegend').innerHTML.includes(api.labels[lang].recent.replace('<','&lt;')));assert.equal((el('eventsDirectory').innerHTML.match(/class="context-status"/g)||[]).length,91,'ninety-one validated contexts in each language');
 for(const key of ['country','species','year','mode']){
  const value=vm.runInContext(`filterValue(events[0],'${key}')`,context);el(key).value=String(value);vm.runInContext('render()',context);assert.equal(layers.size,vm.runInContext(`events.filter(e=>matchesFilter(e,'${key}',${JSON.stringify(String(value))})).length`,context));el(key).value='';
 }
}
vm.runInContext('render()',context);
// Exercise timer-driven expiration on an existing layer and record in memory only.
vm.runInContext(`events[0].added_at='${iso(now-3600000)}';refreshCaseClock()`,context);
const marker=[...layers].find(layer=>layer.eventId===context.window.NEWS_DATA[0].id);assert.equal(marker.style.fillColor,'#ff6b5f');
assert.equal(marker.style.fillOpacity,.95);
vm.runInContext(`events[0].added_at='${iso(now-86400001)}';refreshCaseClock()`,context);assert.equal(marker.style.fillColor,'#d3ff55');assert.equal(marker.style.fillOpacity,1);assert(layers.has(marker));assert(timer.ms>0&&timer.ms<=60000);
const previous={window:{}};
for(const f of ['dist/news-data.js','dist/translations.js'])vm.runInNewContext(cp.execFileSync('git',['show','HEAD:'+f],{encoding:'utf8'}),previous);
const editorialIds=new Set(Array.from({length:26},(_,i)=>3043+i));
const withoutContext=e=>{const {case_context,context_updated_at,...facts}=e;return facts;};
for(const old of previous.window.NEWS_DATA){const current=context.window.NEWS_DATA.find(e=>e.id===old.id);assert.equal(JSON.stringify(editorialIds.has(old.id)?withoutContext(current):current),JSON.stringify(editorialIds.has(old.id)?withoutContext(old):old),'only authorized new context fields may change');}
// Permanent preservation baseline for the 41 contexts and all event facts.
const baseline={window:{}};vm.runInNewContext(cp.execFileSync('git',['show','5e738ed9dfd008cf8daee1f7b291a7623aece0fe:dist/news-data.js'],{encoding:'utf8'}),baseline);
assert(context.window.NEWS_DATA.length>=baseline.window.NEWS_DATA.length,'baseline records must not be removed');
for(const old of baseline.window.NEWS_DATA){const current=context.window.NEWS_DATA.find(e=>e.id===old.id);if(!editorialIds.has(old.id))assert.equal(JSON.stringify(current),JSON.stringify(old),'original context and record preserved');else{assert.equal(JSON.stringify(withoutContext(current)),JSON.stringify(withoutContext(old)),'new case facts preserved');for(const l of ['pt','en','es']){assert.notEqual(current.case_context[l],old.case_context[l]);assert.notEqual(current.case_context[l],current.summary);}assert.equal(current.status,'VALIDATED');}}
for(const [id,old] of Object.entries(previous.window.NEWS_TRANSLATIONS))assert.equal(JSON.stringify(context.window.NEWS_TRANSLATIONS[id]),JSON.stringify(old),'existing translations must remain unchanged');
const metadata=fs.readFileSync('dist/case-metadata.js','utf8');require('./sync-case-metadata.cjs')();assert.equal(fs.readFileSync('dist/case-metadata.js','utf8'),metadata,'timestamps persist unchanged');
console.log('PASS: 24-hour boundaries, invalid/future timestamps, timer recoloring without layer replacement, 3 languages, all filters, popup/card rendering, context gates, safe links, historical data unchanged, metadata idempotence.');

for(const raw of context.window.NEWS_DATA){
 const e=api.enrich(raw);
 if(e.context_status!=='validated')continue;
 for(const l of ['pt','en','es']){const text=e['context_'+l];assert(text.trim().length>0);assert(api.html(e,l).includes('VALIDATED'));}
 assert(e.context_references.length>=1);
}
const original={window:{}};vm.runInNewContext(cp.execFileSync('git',['show','HEAD:dist/case-metadata.js'],{encoding:'utf8'}),original);
for(const [id,e] of Object.entries(original.window.CASE_METADATA)){assert.equal(e.added_at,context.window.CASE_METADATA[id].added_at);assert.equal(e.case_id,context.window.CASE_METADATA[id].case_id);}
console.log('PASS: 273 context texts, references, validated rendering, and preserved incorporation timestamps.');

// Coverage responds to records and validation state; summaries stay visible but never enter totals.
for(const l of ['pt','en','es']){
 vm.runInContext(`lang='${l}';setup()`,context);
 assert(el('contextCoverage').textContent.endsWith('91/91 — 100%'));
 assert.equal(el('nEvents').textContent,'86');
 const expected=vm.runInContext('events.filter(window.CaseContext.countable).reduce((s,e)=>s+(e.items||0),0)',context);
 assert.equal(el('nItems').textContent,vm.runInContext(`number(${expected})`,context));
}
vm.runInContext("events[0].context_status='pending';render()",context);
assert(el('contextCoverage').textContent.endsWith('90/91 — 99%'));
vm.runInContext("events[0].context_status='validated';events.pop();render()",context);
assert(el('contextCoverage').textContent.endsWith('90/90 — 100%'));
const valid=api.enrich(context.window.NEWS_DATA[0]);
for(const mutate of [e=>delete e.case_context,e=>e.case_context.es='',e=>e.case_context.references[0].verified=false,e=>e.case_context.references[0].url='javascript:alert(1)',e=>delete e.context_updated_at]){
 const e=JSON.parse(JSON.stringify(valid));mutate(e);assert(api.validationErrors(e).length>0);
}
console.log('PASS: dynamic coverage numerator and denominator, aggregate-free totals in PT/EN/ES, rejection of incomplete validation.');

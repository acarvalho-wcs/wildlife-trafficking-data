/* Behavioral report checks. Test records stay outside the published assets. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const types=['weekly','semiannual','annual'],codes=['pt','en','es'];
const languageKey='observatory-report-modal-language',sessionKey='observatory-report-modal-shown';
const files=['weekly-reports-data.js','observatory-citation.js','weekly-reports.js'];
const code=files.map(file=>fs.readFileSync('dist/'+file,'utf8')).join('\n');
function report(id,end,published){
 const r={id,period_start:end.slice(0,8)+'01',period_end:end,published_at:published,year:Number(end.slice(0,4)),languages:codes,doi:'10.5281/zenodo.12345',zenodo_url:'https://zenodo.org/records/12345'};
 for(const lang of codes){r['title_'+lang]='Title '+lang+' '+id;r['summary_'+lang]='Summary '+lang+' '+id;}
 return r;
}
const catalogs=(weekly=[],semiannual=[],annual=[])=>({weekly,semiannual,annual});
function setup(payload,{local=new Map(),session=new Map(),blocked=false,failures=new Set(),gates={}}={}){
 let document;
 class Element{
  constructor(tag='div',attrs={},owner=null){this.tagName=tag;this.attrs=attrs;this.owner=owner;this.listeners={};this.children=[];this.value='';this.open=false;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
  set innerHTML(html){this.html=html;this.children=[];for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){const attrs={};for(const a of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';this.children.push(new Element(match[1],attrs,this));}}
  get innerHTML(){return this.html||'';}
  get parentElement(){return this.owner;}
  contains(el){return el===this||el?.owner===this;}
  querySelectorAll(selector){return this.children.filter(el=>selector.startsWith('.')?(el.attrs.class||'').split(' ').includes(selector.slice(1)):(()=>{const m=selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);return m&&Object.hasOwn(el.attrs,m[1])&&(m[2]===undefined||el.attrs[m[1]]===m[2]);})());}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  fire(k){for(const fn of this.listeners[k]||[])fn({target:this});}
  click(){this.focus();this.fire('click');}
  focus(){document.activeElement=this;}
  appendChild(el){this.children.push(el);el.owner=this;return el;}
  remove(){this.owner.children=this.owner.children.filter(el=>el!==this);}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
 }
 const sidebar=new Element(),mobile=new Element(),copied=[];
 const host=new Element(),language=new Element('select');language.value='pt';
 const listeners={},intervals=[],requests=[];
 document={body:new Element('body'),readyState:'complete',hidden:false,activeElement:null,getElementById(id){return id==='reportsView'?host:id==='language'?language:id==='sidebarCitation'?sidebar:id==='mobileCitation'?mobile:null;},createElement(tag){return new Element(tag);},addEventListener(k,fn){(listeners[k]??=[]).push(fn);}};
 const storage=map=>({getItem(k){if(blocked)throw Error('blocked');return map.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');map.set(k,v);}});
 const window={localStorage:storage(local),sessionStorage:storage(session)};
 const c={window,document,navigator:{clipboard:{async writeText(value){copied.push(value)}}},URL,Intl,Date,AbortController,console,setTimeout(){return 1},clearTimeout(){},setInterval(fn,ms){intervals.push({fn,ms})},async fetch(url,options){
  requests.push({url,options});const type=types.find(t=>url==='https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/reports-'+t+'.json');
  assert(type,'only the three authorized catalogs are requested');if(gates[type])await gates[type];if(failures.has(type))throw Error('offline');return {ok:true,json:async()=>JSON.parse(JSON.stringify(payload[type]))};
 }};
 vm.createContext(c);vm.runInContext(code,c);
 return {sidebar,mobile,copied,api:window.WeeklyReportSource,view:window.WeeklyReports,host,language,document,requests,intervals,listeners,local,session,payload,failures,modal:()=>document.body.children.find(el=>el.tagName==='dialog'),clickCategory:type=>host.querySelector('[data-report-category="'+type+'"]').click()};
}
const count=(html,needle)=>html.split(needle).length-1;
(async()=>{
 const initial=report('first','2026-01-07','2026-01-20');
 const payload=catalogs([initial,initial]);
 const app=setup(payload);await app.api.refresh();
 assert.equal(app.requests.length,3);assert(app.requests.every(r=>r.options.cache==='no-store'&&r.options.credentials==='omit'));
 assert.equal(app.api.state().reports.length,1);assert.equal(count(app.host.innerHTML,'data-report-id='),1);
 assert.equal(app.host.querySelectorAll('[data-report-category]').length,3);
 const modal=app.modal();assert(modal?.open);assert(modal.innerHTML.includes('Selecione o idioma'));assert(modal.innerHTML.includes('Select language'));assert(modal.innerHTML.includes('Seleccione el idioma'));
 assert.equal(app.session.get(sessionKey),'1');
 modal.querySelector('[data-report-language="en"]').click();assert(modal.innerHTML.includes('Latest report'));assert(modal.innerHTML.includes('Title en first'));assert.equal(app.local.get(languageKey),'en');assert.equal(app.language.value,'pt');
 for(const [lang,title,button,empty]of [['pt','RELATÓRIOS','Ver relatório','Nenhum relatório publicado nesta categoria até o momento.'],['en','REPORTS','View report','No reports have been published in this category yet.'],['es','INFORMES','Ver informe','Aún no se han publicado informes en esta categoría.']]){
  app.view.render(lang);app.clickCategory('weekly');const html=app.host.innerHTML;
  assert(html.includes(title));assert(html.includes('Title '+lang+' first'));assert(html.includes('Summary '+lang+' first'));assert(html.includes(button));assert(html.includes('Português · English · Español'));
  assert(html.includes('href="https://doi.org/'+initial.doi+'" target="_blank"'));assert(html.includes('href="'+initial.zenodo_url+'" target="_blank"'));
  assert(!/\.pdf|\.docx|<iframe|<embed|\sdownload[= >]/i.test(html));
  for(const type of ['semiannual','annual']){app.clickCategory(type);assert(app.host.innerHTML.includes(empty));assert.equal(count(app.host.innerHTML,'data-report-id='),0);}
  assert(modal.innerHTML.includes('Title '+(lang==='pt'?'en':lang)+' first'),'open modal follows global language');
 }
 modal.querySelector('[data-report-close]').click();assert(!app.modal());
 payload.weekly.push(report('newly-added','2026-02-07','2026-02-10'));await app.api.refresh();app.clickCategory('weekly');assert(app.host.innerHTML.includes('newly-added'));assert(!app.modal(),'no reopening after a refresh');
 const reload=setup(payload,{local:app.local,session:app.session});await reload.api.refresh();assert(!reload.modal(),'same session reload does not reopen');
 const newSession=setup(payload,{local:app.local});await newSession.api.refresh();assert(newSession.modal().innerHTML.includes('Último informe publicado'),'new session uses saved language');
 newSession.modal().querySelector('[data-report-choose]').click();newSession.modal().querySelector('[data-report-language="es"]').click();assert(newSession.modal().innerHTML.includes('Último informe publicado'));assert.equal(newSession.language.value,'pt');
 assert.equal(app.intervals.length,1);assert.equal(app.intervals[0].ms,300000);
 const requestsBefore=app.requests.length;app.intervals[0].fn();await app.api.refresh();assert.equal(app.requests.length,requestsBefore+3);
 // Citation content, placement, shared reference and clipboard in both surfaces.
 const citationApp=setup(catalogs([initial]));await citationApp.api.refresh();
 citationApp.modal().querySelector('[data-report-language="pt"]').click();
 const reference='Wildlife Conservation Society Brasil. (2026). Illegal Wildlife Trafficking Global Observatory. WCS Brasil. https://doi.org/10.5281/zenodo.23282620';
 for(const [lang,heading,title,copy]of [['pt','Plataforma em fase de testes','Como citar o Observatório','Copiar citação'],['en','Platform in Testing Phase','How to Cite the Observatory','Copy citation'],['es','Plataforma en fase de pruebas','Cómo citar el Observatorio','Copiar cita']]){
  citationApp.view.render(lang);
  const modal=citationApp.modal();assert(modal.innerHTML.includes(heading));assert(modal.innerHTML.indexOf(heading)<modal.innerHTML.indexOf('id="reportModalTitle"'));
  for(const surface of [modal,citationApp.sidebar,citationApp.mobile]){
   assert(surface.innerHTML.includes('<em>Illegal Wildlife Trafficking Global Observatory</em>'));assert(surface.innerHTML.includes('href="https://doi.org/10.5281/zenodo.23282620" target="_blank" rel="noopener noreferrer"'));
   assert(surface.innerHTML.includes(copy));surface.querySelector('[data-copy-citation]').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(citationApp.copied.at(-1),reference);
  }
  assert(citationApp.sidebar.innerHTML.includes(title));assert.equal(citationApp.sidebar.innerHTML,citationApp.mobile.innerHTML);
  assert(modal.innerHTML.includes('href="https://doi.org/'+initial.doi+'"'));
 }
 assert.equal(citationApp.document.body.children.filter(e=>e.tagName==='dialog').length,1);
 // Publication priority must differ from coverage-period order; ties use period_end.
 const historical=report('latest-publication','2024-12-31','2026-03-10'),newerPeriod=report('newer-period','2026-03-07','2026-03-09');
 const ordering=setup(catalogs([newerPeriod,historical],[],[report('undated','2026-04-07',null)]),{session:new Map([[sessionKey,'1']])});await ordering.api.refresh();
 assert.equal(ordering.api.latest().id,'latest-publication');assert(ordering.host.innerHTML.indexOf('data-report-id="newer-period"')<ordering.host.innerHTML.indexOf('data-report-id="latest-publication"'));
 ordering.payload.semiannual=[report('publication-tie','2025-06-30','2026-03-10')];await ordering.api.refresh();assert.equal(ordering.api.latest().id,'publication-tie');
 ordering.payload.annual=[report('timestamp','2025-12-31','2026-03-10T09:00:00-03:00')];await ordering.api.refresh();assert.equal(ordering.api.latest().id,'timestamp');
 // Duplicate IDs across feeds and per-language copies yield one report.
 const copies=codes.map(lang=>{const r={...initial,languages:[lang]};for(const other of codes)if(other!==lang){delete r['title_'+other];delete r['summary_'+other];}return r;});
 const dedup=setup(catalogs([copies[0]], [copies[1]], [copies[2]]));await dedup.api.refresh();assert.equal(dedup.api.state().reports.length,1);assert.deepEqual(Array.from(dedup.api.state().reports[0].languages),codes);
 for(const lang of codes){dedup.view.render(lang);assert(dedup.host.innerHTML.includes('Title '+lang+' first'));}
 // Do not show anything until all catalogs have settled.
 let release;const gate=new Promise(resolve=>release=resolve);const delayed=setup(catalogs([initial],[],[historical]),{gates:{annual:gate}});await new Promise(resolve=>setImmediate(resolve));assert(!delayed.modal());release();await delayed.api.refresh();assert(delayed.modal());assert.equal(delayed.api.latest().id,'latest-publication');
 for(const invalid of [catalogs(),catalogs([null,{}, {...initial,id:''},{...initial,period_end:'2026-02-30'},{...initial,zenodo_url:'https://zenodo.org/records/12345/files/report.pdf'},{...initial,zenodo_url:'https://example.com/records/12345'},{...initial,published_at:'2999-01-01'}])]){
  const empty=setup(invalid);await empty.api.refresh();assert.equal(empty.api.state().reports.length,0);assert(!empty.modal());assert(empty.host.innerHTML.includes('Nenhum relatório publicado nesta categoria'));assert(!empty.session.has(sessionKey));
 }
 const partial=setup(catalogs([initial],[],[historical]),{failures:new Set(['weekly','semiannual'])});await partial.api.refresh();assert.equal(partial.api.latest().id,'latest-publication');assert(partial.modal());
 const offline=setup(catalogs([initial]),{failures:new Set(types)});await offline.api.refresh();assert(!offline.modal());assert.equal(offline.api.state().reports.length,0);
 offline.failures.clear();await offline.api.refresh();assert(offline.modal(),'recovers automatically when a catalog becomes available');
 offline.failures.add('weekly');await offline.api.refresh();assert.equal(offline.api.state().reports.length,1,'retain last valid category on temporary failure');
 const noStorage=setup(catalogs([initial]),{blocked:true});await noStorage.api.refresh();assert(noStorage.modal());noStorage.modal().querySelector('[data-report-language="pt"]').click();noStorage.modal().close();await noStorage.api.refresh();assert(!noStorage.modal(),'storage exceptions never break UI or reopen within the document');
 const unsafe=setup(catalogs([{...initial,title_pt:'<img src=x onerror=alert(1)>',summary_pt:'<script>alert(1)</script>'}]));await unsafe.api.refresh();assert(unsafe.host.innerHTML.includes('&lt;img'));assert(!unsafe.host.innerHTML.includes('<script>'));
 if(process.argv[2]){
  const weekly=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const actual=setup(catalogs(weekly));await actual.api.refresh();
  assert.equal(actual.api.latest().id,'2026-10-06_2026-10-12');
  for(const lang of codes){
   const modal=actual.modal();
   if(!modal.querySelector('[data-report-language="'+lang+'"]'))modal.querySelector('[data-report-choose]').click();
   modal.querySelector('[data-report-language="'+lang+'"]').click();
   const record=weekly[0],html=modal.innerHTML;
   assert(html.includes(record['title_'+lang]));assert(html.includes(record['summary_'+lang]));
   for(const value of ['68','20',lang==='en'?'7,228':'7.228',lang==='en'?'3,049':'3.049'])assert(html.includes(value));
   assert.equal(count(html,'href="https://doi.org/10.5281/zenodo.23443551"'),2);
   assert(html.includes('10.5281/zenodo.23282620'));
  }
  actual.payload.weekly=weekly.map((r,i)=>i? r:{...r,summary_es:r.summary_es+' Updated catalog.'});
  await actual.api.refresh();assert(actual.modal().innerHTML.includes('Updated catalog.'));
  console.log('PASS: actual weekly catalog renders requested title, quantities and DOI in PT/EN/ES; open popup refreshes.');
 }

 const sourceCode=files.map(file=>fs.readFileSync('dist/'+file,'utf8')).join('\n');assert(!sourceCode.includes('reports.json'));assert(!/\.pdf|\.docx|<iframe|<embed|\sdownload[= >]/i.test(sourceCode));
 for(const file of fs.readdirSync('dist',{recursive:true}))assert(!/\.(pdf|docx)$/i.test(file),'no report binaries are published');
 console.log('PASS: three exclusive catalogs; unique IDs; period and publication ordering; trilingual text; Zenodo/DOI only; empty/invalid/partial feeds; refresh; session/reload/global-language sync; citation text, placement and clipboard; safe markup; no local PDF/DOCX.');
})().catch(error=>{console.error(error);process.exitCode=1;});

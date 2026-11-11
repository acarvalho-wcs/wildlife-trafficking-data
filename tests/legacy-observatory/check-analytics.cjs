const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const core=fs.readFileSync('dist/assets/js/observatory-analytics.js','utf8'),events=fs.readFileSync('dist/assets/js/observatory-analytics-events.js','utf8');
function setup(lang='pt',blocked=false){const calls=[],listeners={},nodes={language:{value:lang},recordSearch:{value:''}},timers=new Map();let sequence=0;
 const c={URL,URLSearchParams,location:{origin:'https://example.org',pathname:'/',search:'?lang='+lang+'&email=private@example.org',href:'https://example.org/?email=private@example.org'},localStorage:{getItem:()=>lang},document:{referrer:'https://example.com/private?token=SECRET',getElementById:id=>nodes[id],addEventListener(type,fn){(listeners[type]??=[]).push(fn)}},setTimeout(fn){timers.set(++sequence,fn);return sequence},clearTimeout:id=>timers.delete(id)};
 c.window=c;c.gtag=(...args)=>{if(blocked)throw Error('blocked');calls.push(args)};vm.createContext(c);vm.runInContext(core,c);vm.runInContext(events,c);
 return {c,calls,nodes,listeners,flush(){for(const [id,fn]of [...timers]){timers.delete(id);fn()}},fire(type,target,extra={}){for(const fn of listeners[type]||[])fn({isTrusted:true,target,...extra})},count:name=>calls.filter(x=>x[0]==='event'&&x[1]===name).length};
}
for(const lang of ['pt','en','es']){
 const t=setup(lang),A=t.c.ObservatoryAnalytics;
 assert.equal(t.calls.filter(c=>c[0]==='config').length,1);const config=t.calls.find(c=>c[0]==='config');assert.equal(config[1],'G-TB6FW0EZES');assert.equal(config[2].send_page_view,true);assert.equal(config[2].allow_google_signals,false);assert.equal(config[2].allow_ad_personalization_signals,false);
 vm.runInContext(core,t.c);vm.runInContext(events,t.c);assert.equal(t.calls.filter(c=>c[0]==='config').length,1);assert.equal(t.listeners.click.length,1);
 for(const name of ['map_view','globe_view','case_open','route_open','search_use','filter_apply','report_open','report_pdf','publication_open','zenodo_click','research_open','doi_click','news_open','language_change','fullscreen_use']){A.track(name,{case_id:'public-123',case_country:'Brasil',route_id:'route-3',view:'map',report_id:'week-1',report_type:'weekly',publication_id:'article-1',publication_type:'analytical_article',paper_id:'paper-1',news_id:'news-1',filter_type:'country',from_language:'pt',to_language:'en',email:'SECRET',query:'SECRET',user_id:'SECRET'});assert.equal(t.count(name),1);const e=t.calls.at(-1)[2];assert.equal(e.site_area,'observatory');assert.equal(e.language,lang);assert(!JSON.stringify(e).includes('SECRET'));assert.equal(e.page_location,'https://example.org/');assert.equal(e.page_referrer,'https://example.com/');}
 const initial=t.count('search_use');for(const term of ['a','ar','ara','arara']){t.nodes.recordSearch.value=term;t.fire('input',{id:'recordSearch'})}assert.equal(t.count('search_use'),initial);t.flush();assert.equal(t.count('search_use'),initial+1);t.fire('keydown',{id:'recordSearch'},{key:'Enter'});assert.equal(t.count('search_use'),initial+1);
 t.nodes.recordSearch.value='private@example.org';t.fire('input',{id:'recordSearch'});t.flush();assert(!JSON.stringify(t.calls).includes('private@example.org'));
 t.fire('change',{id:'country',value:'SECRET'});assert.equal(t.calls.at(-1)[2].filter_type,'country');assert(!JSON.stringify(t.calls).includes('SECRET'));
 const next=lang==='en'?'es':'en',before=t.count('language_change');t.nodes.language.value=next;t.fire('change',{id:'language',value:next});assert.equal(t.count('language_change'),before+1);assert.equal(t.calls.at(-1)[2].from_language,lang);assert.equal(t.calls.at(-1)[2].to_language,next);t.fire('change',{id:'language',value:next});assert.equal(t.count('language_change'),before+1);
 t.fire('change',{id:'country'},{isTrusted:false});assert.equal(t.calls.at(-1)[1],'language_change');
}
const t=setup();
function link(href,{pub,report,matches=[],dataset={}}={}){return {href,dataset,closest:s=>s==='[data-publication-id]'?pub:s==='[data-report-id]'?report:null,matches:s=>s.split(',').some(x=>matches.includes(x)),hasAttribute:()=>false}}
function click(node){t.fire('click',{closest:()=>node})}
let n=t.count('zenodo_click');click(link('https://zenodo.org/records/23109743',{pub:{dataset:{publicationId:'article-1',publicationType:'analytical_article'}},matches:['.publication-primary']}));assert.equal(t.count('publication_open'),1);assert.equal(t.count('zenodo_click'),n+1);
t.c.WeeklyReportSource={state:()=>({reports:[{id:'week-1',type:'weekly'}]})};click(link('https://zenodo.org/records/1',{report:{dataset:{reportId:'week-1'}},matches:['.reports-access']}));assert.equal(t.count('report_open'),1);assert.equal(t.count('report_pdf'),0);click(link('https://zenodo.org/records/1/files/report.pdf',{report:{dataset:{reportId:'week-1'}}}));assert.equal(t.count('report_pdf'),1);
click(link('https://doi.org/10.1234/example'));assert.equal(t.count('doi_click'),1);assert.equal(t.calls.at(-1)[2].paper_id,undefined);
click(link('https://wildlife-research.wcs-associa-6434.chatgpt.site'));assert.equal(t.count('research_open'),1);click(link('https://fauna-reportagens.wcs-associa-6434.chatgpt.site'));assert.equal(t.count('news_open'),1);
const reports={dataset:{view:'reports'},matches:()=>false};click(reports);click(reports);assert.equal(t.count('section_view'),1);
const blocked=setup('pt',true);assert.doesNotThrow(()=>blocked.c.ObservatoryAnalytics.track('map_view'));blocked.fire('change',{id:'country'});
// Confirm that the requested additions do not rewrite existing UI or data.
const baseline='f80ae7e56ce9550a8255b66be27a1a5203e16697';
const changed=['dist/index.html','dist/publications.html','dist/how-it-works.html','dist/live.js','dist/globe-view.js','dist/assets/js/publications-page.js'];
for(const f of cp.execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{encoding:'utf8'}).trim().split('\n')){
 let current=fs.readFileSync(f,'utf8'),before=cp.execFileSync('git',['show',baseline+':'+f],{maxBuffer:16*1024*1024});
 if(!changed.includes(f)){assert.deepEqual(fs.readFileSync(f),before,f);continue;}
 if(f.endsWith('.html')){assert.equal((current.match(/googletagmanager.com\/gtag\/js/g)||[]).length,1);assert(current.indexOf('<!-- Google tag')<current.indexOf('<meta'));current=current.replace(/\n<!-- Google tag[\s\S]*?<script defer src="assets\/js\/observatory-analytics-events.js"><\/script>\n/,'');}
 else if(f.endsWith('publications-page.js'))current=current.replace(' data-publication-type="\'+safe(p.type)+\'"','');
 else if(f.endsWith('/live.js'))current=current.replace("try{window.ObservatoryAnalytics?.track('case_open',{case_id:e.id,case_country:e.country,view:'map'});}catch{}",'');
 else {
  current=current.replace("try{const e=api.filtered().find(e=>e.id===id);window.ObservatoryAnalytics?.track('case_open',{case_id:id,case_country:e?.country,view:mode});}catch{}",'');
  current=current.replace("try{window.ObservatoryAnalytics?.track('route_open',{route_id:d.route.id,view:mode});}catch{}",'');
  current=current.replace("  if(mode!==next){try{window.ObservatoryAnalytics?.track(next+'_view');}catch{}}\n",'');
  current=current.replace("if(next){try{window.ObservatoryAnalytics?.track('fullscreen_use',{view:mode});}catch{}}",'');
  current=current.replace("if(!expanded){try{window.ObservatoryAnalytics?.track('case_open',{case_id:e.id,case_country:e.country,view:'map'});}catch{}return;}",'if(!expanded)return;');
 }
 assert.equal(current,before.toString(),f+' original behavior retained');
}
console.log('PASS: GA4 single configuration; all 15 events; three languages; parameter allowlist; no query/PII/URL parameters; debounce and deduplication; outbound/report/publication handlers; blocked transport; all prior assets preserved except exact isolated analytics additions.');

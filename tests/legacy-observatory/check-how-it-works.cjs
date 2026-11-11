const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const dataFile='dist/assets/js/how-it-works.js',pageFile='dist/assets/js/how-it-works-page.js',linkFile='dist/assets/js/how-it-works-link.js';
for(const f of [dataFile,pageFile,linkFile])cp.execFileSync('node',['--check',f]);
const c={window:{}};vm.createContext(c);for(const f of [dataFile,pageFile])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const data=c.window.ObservatoryMethodology,render=c.window.MethodologyPage.markup;
const html=fs.readFileSync('dist/how-it-works.html','utf8');assert(html.includes(render('pt')),'full PT fallback is in sync');
const strip=s=>s.replace(/\*\*/g,'');
for(const lang of ['pt','en','es']){
 const d=data[lang],out=render(lang);assert.equal(d.intro.length,2);assert.equal(d.sections.length,9);
 assert(out.includes('href="./?lang='+lang+'"'));assert(!out.includes('role="dialog"'));
 for(const p of d.intro)assert(out.replace(/<[^>]*>/g,'').includes(strip(p)));
 d.sections.forEach((s,i)=>{assert.equal(s.id,data.pt.sections[i].id);assert.equal(s.blocks.length,data.pt.sections[i].blocks.length);assert(out.includes('href="#'+s.id+'"'));assert(out.includes('id="'+s.id+'"'));s.blocks.forEach((b,j)=>{if(Array.isArray(b))assert.equal(b.length,data.pt.sections[i].blocks[j].length);for(const t of Array.isArray(b)?b:[b])assert(out.replace(/<[^>]*>/g,'').includes(strip(t)));});});
 for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:[^"#]*)?"/g)){const url=m[1];if(!url.startsWith('http')&&!url.startsWith('./'))assert(fs.existsSync('dist/'+url),url+' resolves');}
}
const makeEnv=(url,store=new Map(),blocked=false)=>{
 const nodes=new Map(),events={},root={dataset:{}};
 const get=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='language'?'pt':id==='mapTheme'?'dark':'',dataset:{},handlers:{},textContent:'',href:'',innerHTML:'',focus(){this.focused=true},addEventListener(k,f){(this.handlers[k]??=[]).push(f)},dispatchEvent(e){e.target=this;this.onchange?.(e);for(const f of [...(this.handlers[e.type]||[])])f(e);}});return nodes.get(id)};
 const loc=new URL(url),history={replaceState(_a,_b,u){this.url=String(u)}};
 const localStorage={getItem(k){if(blocked)throw Error('blocked');return store.get(k)||null},setItem(k,v){if(blocked)throw Error('blocked');store.set(k,v)}};
 const window={addEventListener(k,fn){events[k]=fn}};
 const env={window,document:{documentElement:root,getElementById:get,title:''},localStorage,location:loc,history,URL,URLSearchParams,Event:class{constructor(type){this.type=type}}};
 vm.createContext(env);return {env,get,store,events,root,history};
};
for(const initial of ['pt','en','es'])for(const blocked of [false,true]){
 const x=makeEnv('https://example.org/?lang='+initial,new Map(),blocked);let dashboardLang='pt';x.get('language').onchange=e=>dashboardLang=e.target.value;
 vm.runInContext(fs.readFileSync(linkFile,'utf8'),x.env);assert.equal(x.get('language').value,initial);assert.equal(x.get('howItWorksLink').textContent,data[initial].title);assert(x.get('howItWorksLink').href.includes('lang='+initial));
 x.get('mapTheme').value='light';x.get('howItWorksLink').dispatchEvent(new x.env.Event('click'));assert(x.get('howItWorksLink').href.includes('theme=light'));
 const y=makeEnv('https://example.org/'+x.get('howItWorksLink').href,x.store,blocked);for(const f of [dataFile,pageFile])vm.runInContext(fs.readFileSync(f,'utf8'),y.env);assert.equal(y.root.lang,{pt:'pt-BR',en:'en',es:'es'}[initial]);assert.equal(y.root.dataset.theme,'light');assert(y.get('methodologyRoot').innerHTML.includes(data[initial].name));
 for(const next of ['pt','en','es']){y.get('methodologyLanguage').value=next;y.get('methodologyLanguage').dispatchEvent(new y.env.Event('change'));assert.equal(y.root.lang,{pt:'pt-BR',en:'en',es:'es'}[next]);assert(y.get('methodologyRoot').innerHTML.includes('href="./?lang='+next+'"'));if(!blocked)assert.equal(x.store.get('observatory-language'),next);}
 y.get('methodologyTheme').value='dark';y.get('methodologyTheme').dispatchEvent(new y.env.Event('change'));assert.equal(y.root.dataset.theme,'dark');
 // Return navigation preserves the chosen language even when storage is blocked.
 const z=makeEnv('https://example.org/?lang=es',x.store,blocked);vm.runInContext(fs.readFileSync(linkFile,'utf8'),z.env);assert.equal(z.get('language').value,'es');
 if(!blocked){x.events.pageshow({persisted:true});assert.equal(x.get('language').value,'es');assert.equal(dashboardLang,'es');}
}
const malicious=makeEnv('https://example.org/how-it-works.html?lang=%3Cscript%3E&theme=red');for(const f of [dataFile,pageFile])vm.runInContext(fs.readFileSync(f,'utf8'),malicious.env);assert.equal(malicious.root.lang,'pt-BR');assert.equal(malicious.root.dataset.theme,'dark');
const css=fs.readFileSync('dist/assets/css/how-it-works-page.css','utf8');assert(css.includes('data-theme="light"'));assert(css.includes('position:sticky'));assert(css.includes('position:static'));assert(css.includes('@media(max-width:760px)'));assert(css.includes('max-width:1200px'));
assert(!html.includes('live.js'));assert(!html.includes('news-data.js'));assert(!html.includes('globe-view.js'));
assert(!fs.readFileSync(linkFile,'utf8').includes('fetch('));
console.log('PASS: complete 9-section PT/EN/ES content; standalone document and real links; language handoff/return/Back; storage failure; light/dark themes; safe invalid parameters; local assets; responsive rules; main dashboard script untouched.');

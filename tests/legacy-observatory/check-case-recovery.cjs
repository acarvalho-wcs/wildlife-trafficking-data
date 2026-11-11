const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/news-data.js','utf8'),good=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
function page(feed=good){let current=feed,deleted=false;const window={indexedDB:{open(){throw Error('Persistent snapshots must not be read');},deleteDatabase(name){assert.equal(name,'observatory-validated-cases');deleted=true;}}};const context={window,URL,Date,AbortController,setTimeout,clearTimeout,console:{error(){}},fetch:async(url,options)=>{assert.equal(new URL(url).origin+new URL(url).pathname,'https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/cases.json');assert.equal(options.cache,'no-store');if(current instanceof Error)throw current;return{ok:true,json:async()=>current};}};vm.runInNewContext(source,context);assert(deleted);return {S:window.CaseSource,window,set:next=>current=next};}
(async()=>{
 const first=page();await first.S.refresh();assert.equal(first.S.state().status,'ready');assert.equal(first.window.NEWS_DATA.length,good.cases.length);
 first.set(new Error('offline'));await first.S.refresh();assert(first.S.state().stale);assert.equal(first.window.NEWS_DATA.length,good.cases.length);
 const reload=page(new Error('offline'));await reload.S.refresh();assert.equal(reload.S.state().status,'error');assert.equal(reload.window.NEWS_DATA.length,0);
 reload.set(good);await reload.S.refresh();assert.equal(reload.S.state().status,'ready');assert(!reload.S.state().stale);assert.equal(reload.window.NEWS_DATA.length,good.cases.length);
 console.log('PASS: canonical network loading; persistent snapshots retired; fresh reload cannot recover stale data; transient in-memory recovery remains.');
})().catch(e=>{console.error(e);process.exitCode=1;});

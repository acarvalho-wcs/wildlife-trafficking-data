const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const handlers={};const c={window:{},URL,document:{addEventListener(name,fn){handlers[name]=fn}}};vm.createContext(c);
for(const f of ['scientific-text.js','news-data.js','case-media-data.js','case-media.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),c);
const payload=JSON.parse(process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):cp.execFileSync('curl',['-fsSL','--max-time','40','https://acarvalho-wcs.github.io/wildlife-trafficking-data/cases.json'],{encoding:'utf8',maxBuffer:8*1024*1024}));
const media=c.window.CaseMedia,records=c.window.CaseSource.validate(payload).map(c.window.CaseSource.adapt),registry=c.window.CASE_MEDIA;
let covered=0;
for(const [id,entry]of Object.entries(registry)){
 // Legacy media are associated by legacy ID or exact article source URL.

 for(const m of entry.images||[]){assert(m.verified);assert(m.url&&m.source_url&&m.credit);assert(Number.isFinite(Date.parse(m.verified_at)));assert(media.safeUrl(m.url));assert(media.safeUrl(m.source_url));assert(!['ai_generated','logo'].includes(m.kind));}
}
for(const e of records){
 const images=media.images(e);if(images.length)covered++;
 for(const l of ['pt','en','es']){
  const html=media.html(e,l);assert(html);assert(!html.includes('undefined'));assert(html.includes('rel="noopener noreferrer"'));
  if(images.length){assert(html.includes('data-source-photo'));assert(html.includes('loading="lazy"'));assert(html.includes('<figcaption>'));}
  else assert(html.includes('case-media-empty'));
 }
}
assert.equal(media.safeUrl('javascript:alert(1)'),'');assert.equal(media.safeUrl('https://user:password@example.org/a.jpg'),'');
const raw={id:999999,url:'https://example.org/article',title:'<unsafe>',images:[{url:'javascript:alert(1)',source_url:'https://example.org',verified:true}]};assert(!media.html(raw).includes('<img'));
raw.images=[{url:'https://example.org/photo.jpg',source_url:'https://example.org/article',credit:'<credit>',kind:'illustrative',verified:true}];const html=media.html(raw,'en');assert(html.includes('&lt;credit&gt;'));assert(html.includes('&lt;unsafe&gt;'));assert(html.includes('does not document this seizure'));
let errorState=false;const img={hidden:false,hasAttribute:k=>k==='data-source-photo',closest:()=>({classList:{add:v=>errorState=v==='unavailable'}})};handlers.error({target:img});assert(img.hidden&&errorState,'Broken source images expose fallback without broken icon');
for(const asset of ['news-data.js','case-media-data.js','globe-view.css','recent-pulse.js'])assert.deepEqual(fs.readFileSync('dist/'+asset),cp.execFileSync('git',['show','fcb9c57e9ee84a90b569b0d8007b873d7d84cbd7:dist/'+asset],{maxBuffer:8*1024*1024}),asset+' unchanged');
for(const lang of ['pt','en','es']){
 raw.images[0]['caption_'+lang]='*Iguana iguana* e *Tridacna* sp.';
 const rendered=media.html(raw,lang);
 assert(rendered.includes('<em>Iguana iguana</em> e <em>Tridacna</em> sp.'));
 assert(rendered.includes('alt="Iguana iguana e Tridacna sp."'));
 assert(!rendered.includes('*Iguana'));
}
const index=fs.readFileSync('dist/index.html','utf8');assert(index.indexOf('src="case-media.js"')<index.indexOf('src="live.js"'));
console.log(`PASS: article media for ${covered}/${records.length} cases; multilingual cards, attribution, safe URLs, lazy images, failure fallback, scientific-name captions/alt and unchanged source/media/marker assets.`);

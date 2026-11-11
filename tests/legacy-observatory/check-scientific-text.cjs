const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{}};vm.runInNewContext(fs.readFileSync('dist/scientific-text.js','utf8'),c);const R=c.window.ScientificText;
for(const name of ['Iguana iguana','Prionace glauca','Panthera leo','Arapaima gigas'])assert.equal(R.html('*'+name+'*'),'<em>'+name+'</em>');
assert.equal(R.html('Iguana-verde (*Iguana iguana*)'),'Iguana-verde (<em>Iguana iguana</em>)');
assert.equal(R.html('*Tridacna* sp.'),'<em>Tridacna</em> sp.');
assert.equal(R.html('*Loxodonta* spp.'),'<em>Loxodonta</em> spp.');
assert.equal(R.html('*Amazona* cf. *amazonica*'),'<em>Amazona</em> cf. <em>amazonica</em>');
assert.equal(R.html('*Tridacna sp.*'),'<em>Tridacna </em>sp.');
assert.equal(R.html('*Amazona cf. amazonica*'),'<em>Amazona </em>cf.<em> amazonica</em>');
for(const raw of ['2 * 3 * 4','2*3*4','Nota* sem par','**negrito**','***triplo***','* texto *','*linha\nseguinte*','\\*literal*','*1*','https://example.org/*.jpg','*.jpg','A*B*C'])assert.equal(R.html(raw),raw,'non-emphasis stars preserved: '+raw);
assert.equal(R.html('<img src=x onerror=alert(1)> *Iguana iguana*'),'&lt;img src=x onerror=alert(1)&gt; <em>Iguana iguana</em>');
assert.equal(R.html('*<script>alert("x")</script>*'),'<em>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</em>');
const payload=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),before=JSON.stringify(payload);let marked=0,spans=0;
for(const [i,row] of payload.cases.slice(0,110).entries())for(const [key,value] of Object.entries(row))if(typeof value==='string'){
 const tokens=R.tokens(value),html=R.html(value);
 assert.equal(html.replace(/<\/?em>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'),R.plain(value));
 if(!value.includes('*'))assert.equal(R.plain(value),value,'unmarked data unchanged');
 if(tokens.some(t=>t.italic)){marked++;spans+=tokens.filter(t=>t.italic).length;assert(!R.plain(value).includes('*'),'first 110 valid markup fully consumed: '+i+' '+key);}
 for(const t of tokens)if(t.italic)assert(!/\b(?:sp|spp|cf)\./.test(t.text),'qualifiers remain roman');
}
assert.equal(JSON.stringify(payload),before,'canonical data never mutated');assert(marked>0);
console.log('PASS: seven requested examples, qualifiers, invalid/unrelated stars, hostile HTML escaped; first 110 cases audited, '+marked+' marked fields and '+spans+' italic spans; '+payload.cases.length+' source cases untouched.');

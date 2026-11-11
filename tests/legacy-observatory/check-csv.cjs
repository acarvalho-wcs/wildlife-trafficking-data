const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// Reuse the existing dashboard DOM/Leaflet harness, before its mutation tests.
const harness=fs.readFileSync('scripts/check-case-context.cjs','utf8').split('const api=context.window.CaseContext')[0];
const outer={require,console,URL};vm.createContext(outer);vm.runInContext(harness+'\nthis.runtime=context;this.element=el;',outer);
const c=outer.runtime,el=outer.element,run=s=>vm.runInContext(s,c),plain=x=>JSON.parse(JSON.stringify(x));
function parse(text){
 assert(text.startsWith('\uFEFFsep=,\r\n'),'Excel BOM and separator directive');
 const input=text.slice(8),rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<input.length;i++){const ch=input[i];if(ch==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(field);field='';}else if(ch==='\r'&&input[i+1]==='\n'&&!quoted){row.push(field);rows.push(row);row=[];field='';i++;}else field+=ch;}
 assert.equal(quoted,false);const header=rows.shift();return rows.map(values=>{assert.equal(values.length,header.length);return Object.fromEntries(header.map((key,i)=>[key,values[i]]));});
}
function checkSelection(){const rows=parse(run('csvText()'));assert.deepEqual(rows.map(r=>r.case_id),plain(run('filtered().map(e=>e.case_id)')));for(const row of rows){const e=plain(run(`record(events.find(e=>e.case_id===${JSON.stringify(row.case_id)}))`));assert.equal(row.case_description,e.summary);assert.equal(row.case_context,e['context_'+run('lang')]);assert.equal(row.country,e.country);assert.equal(row.source_url,e.url);assert.equal(row.latitude,String(e.lat));assert.equal(row.longitude,String(e.lng));assert.equal(row.added_at,e.added_at||'');}return rows;}
for(const lang of ['pt','en','es']){
 run(`lang='${lang}';setup()`);assert.equal(el('exportCsv').textContent,lang==='en'?'Export .csv':'Exportar .csv');
 assert.equal(checkSelection().length,91);
 for(const key of ['country','species','year','mode']){for(const value of plain(run(`['',...new Set(events.flatMap(e=>[filterValue(e,'${key}')]).flat())]`))){el(key).value=String(value);checkSelection();}el(key).value='';}
 el('country').value='Sri Lanka';el('species').value='Peixes';el('year').value='2026';el('mode').value='Marítimo';
 assert.deepEqual(checkSelection().map(r=>r.case_id),['3043','3045','3048','3049','3051','3064','3066','3067']);
 run('setup()');assert.equal(checkSelection().length,8,'language setup retains active filters');
 el('country').value='NOT-A-COUNTRY';assert.equal(checkSelection().length,0,'empty selection exports headers only');
 el('clear').onclick();assert.equal(checkSelection().length,91);
}
const all=checkSelection();assert.equal(all.find(r=>r.case_id==='3050').date,'2026-02');assert.equal(all.find(r=>r.case_id==='3050').event_date_precision,'month');assert.equal(all.find(r=>r.case_id==='3055').date,'');assert.equal(all.find(r=>r.case_id==='3055').publication_date,'2026-04-16');assert.equal(all.find(r=>r.case_id==='3047').aggregate_operation,'true');
// RFC-style quoting, Unicode and formula protection, including numeric coordinates.
const fixture='São Tomé, "aves"\nEspañol 中文';c.fixture=fixture;assert.equal(run('csvCell(fixture)'), '"São Tomé, ""aves""\nEspañol 中文"');assert.equal(run('csvCell(-11.48)'),'"-11.48"');assert.equal(run('csvCell("=1+1")'),'"\'=1+1"');
// Exercise the button's Blob/download path, not just the serializer.
let blob,clicked=false,removed=false,revoked=false;const callbacks=[];const anchor={click(){clicked=true},remove(){removed=true}};
c.Blob=Blob;c.URL={createObjectURL(value){blob=value;return 'blob:test'},revokeObjectURL(value){assert.equal(value,'blob:test');revoked=true;}};c.document.body={appendChild(a){assert.equal(a,anchor)}};c.document.createElement=tag=>{assert.equal(tag,'a');return anchor;};c.setTimeout=fn=>{callbacks.push(fn);return 1;};
el('country').value='Brasil';el('exportCsv').onclick();assert(clicked&&removed);assert.match(anchor.download,/^wildlife-trafficking-observatory_\d{4}-\d{2}-\d{2}\.csv$/);assert.equal(blob.type,'text/csv;charset=utf-8;');
(async()=>{const bytes=Buffer.from(await blob.arrayBuffer());assert.equal(bytes.subarray(0,3).toString('hex'),'efbbbf');assert.equal(parse(bytes.toString('utf8')).length,checkSelection().length);callbacks.forEach(fn=>fn());assert(revoked);console.log('PASS: current filters and combinations, empty/full selection, PT/EN/ES, 91 records, dates, contexts, accents, quoting, numeric coordinates, Excel UTF-8 BOM, actual download and cleanup.');})().catch(e=>{console.error(e);process.exitCode=1});

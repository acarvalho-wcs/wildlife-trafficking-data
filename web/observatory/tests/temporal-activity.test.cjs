const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({window:{},console});
for(const file of ['temporal-core.js','temporal-filter.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const C=context.window.ObservatoryTimeCore,T=context.window.ObservatoryTime;
const period={start:'2026-11-06',end:'2026-11-12'};
const mk=(event_date,publication_date,other={})=>({event_date,publication_date,event_date_precision:event_date?'day':'unknown',exclude_from_totals:false,...other});
test('Initial map defaults to last seven days, occurred OR published',()=>{
 const state=T.state();
 assert.equal(state.preset,'last7');assert.equal(state.basis,'occurrence_or_publication');
 assert.equal(C.preset('last7',Date.parse('2026-11-12T17:00:00Z')).start,period.start);
 assert.equal(C.preset('last7',Date.parse('2026-11-12T17:00:00Z')).end,period.end);
});
test('Published recently but occurred earlier is displayed without changing its occurrence date',()=>{
 const event=mk('2025-08-20','2026-11-10');
 assert.equal(C.contains(event,period,'occurrence_or_publication'),true);
 assert.equal(C.contains(event,period,'occurrence'),false);
 assert.equal(C.contains(event,period,'publication'),true);
 assert.equal(event.event_date,'2025-08-20');
});
test('Recent occurrence with older publication is displayed and selectable separately',()=>{
 const event=mk('2026-11-09','2026-11-03');
 assert.equal(C.contains(event,period,'occurrence_or_publication'),true);
 assert.equal(C.contains(event,period,'occurrence'),true);
 assert.equal(C.contains(event,period,'publication'),false);
});
test('Overlap counts each case exactly once in map selection and time series',()=>{
 const both=mk('2026-11-08','2026-11-11');
 const published=mk('2024-01-01','2026-11-12');
 const occurred=mk('2026-11-07','2026-11-01');
 const out=C.cumulative([both,published,occurred],period,'occurrence_or_publication');
 assert.equal(out.at(-1).total,3);
 assert.equal(out.find(x=>x.day==='2026-11-07').total,1);
 assert.equal(out.find(x=>x.day==='2026-11-08').total,2);
 assert.equal(out.find(x=>x.day==='2026-11-12').total,3);
});
test('Publication rescues imprecise or absent occurrence; neither date remains excluded',()=>{
 const pub=mk('2026-11-09','2026-11-10',{event_date_precision:'month'});
 assert.equal(C.contains(pub,period,'occurrence'),false);
 assert.equal(C.contains(pub,period,'occurrence_or_publication'),true);
 const undated=mk(null,null,{added_at:'2026-11-12T12:00:00Z',status:'VALIDATED'});
 assert.equal(C.contains(undated,period,'occurrence_or_publication'),false);
 assert.equal(C.contains(undated,period,'publication'),false);
});
test('Imprecise publication and outside-range dates do not enter the seven-day window',()=>{
 const imprecise=mk('2025-11-10','2026-11-10',{publication_date_precision:'month'});
 assert.equal(C.contains(imprecise,period,'occurrence_or_publication'),false);
 assert.equal(C.contains(mk('2026-11-05','2026-11-05'),period,'occurrence_or_publication'),false);
 assert.equal(C.contains(mk('2026-11-13','2026-11-13'),period,'occurrence_or_publication'),false);
});
test('Range-specific matching counts publication in later period even if occurrence predates it',()=>{
 const first={start:'2024-01-01',end:'2024-01-31'},second=period;
 const event=mk('2024-01-02','2026-11-10');
 assert.equal(C.cumulative([event],first,'occurrence_or_publication').at(-1).total,1);
 assert.equal(C.cumulative([event],second,'occurrence_or_publication').at(-1).total,1);
});
test('Seven-day boundaries use Manaus calendar days, not UTC calendar days',()=>{
 assert.equal(C.day('2026-11-12T03:59:00Z'),'2026-11-11');
 assert.equal(C.day('2026-11-12T04:00:00Z'),'2026-11-12');
});
test('The time dialog supports publication-only, occurrence-only and combination',()=>{
 for(const basis of ['publication','occurrence','occurrence_or_publication']){
  T.apply({basis,preset:'last7'});
  assert.equal(T.state().basis,basis);
 }
 T.reset();
 assert.equal(T.state().preset,'all');
});

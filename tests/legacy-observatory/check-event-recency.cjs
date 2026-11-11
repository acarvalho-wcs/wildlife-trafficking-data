const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{ScientificText:{html:String}},URL,Date,Intl};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/case-context.js','utf8'),c);
const C=c.window.CaseContext,now=Date.parse('2026-10-09T00:05:13Z');
for(const hours of [1,23,25,47,48,49,72,167,168,169,192]){
 const e={occurred_at:new Date(now-hours*3600000).toISOString(),publication_date:'2026-10-09',added_at:new Date(now).toISOString()};
 assert.equal(C.isRecent(e,now),hours<=168);assert.equal(C.color(e,now),hours<=168?'#ff6b5f':'#d3ff55');
}
for(const occurred_at of ['2026-10-09',null,undefined,'invalid','2026-10-08T23:00:00','2026-02-30T12:00:00Z','2026-10-10T00:00:00Z'])assert.equal(C.isRecent({occurred_at,event_datetime:new Date(now).toISOString(),event_date:'2026-10-09',added_at:new Date(now).toISOString(),publication_date:'2026-10-09'},now),false);
assert(C.isRecent({occurred_at:'2026-10-07T20:05:13-04:00'},now));
assert(C.isRecent({occurred_at:new Date(now-C.RECENT_WINDOW).toISOString()},now));
assert(!C.isRecent({occurred_at:new Date(now-C.RECENT_WINDOW-1).toISOString()},now));
assert(!C.isRecent({occurred_at:new Date(now+1).toISOString()},now));
assert.equal(C.labels.pt.recent,'Evento recente (últimos 7 dias)');
console.log('PASS: Through 168h recent, 169h/192h historical; UTC offsets, exact boundary, conservative date-only and occurred_at exclusivity.');

for(const nowText of ['2026-10-08T04:00:00Z','2026-10-09T00:29:24Z','2026-10-09T03:59:59.999Z']){
 const at=Date.parse(nowText);
 for(const e of [{occurred_at:'2026-10-07T00:00:00Z',occurred_at_precision:'day',event_date:'2026-10-07'},{occurred_at:'2026-10-07',event_date:'2026-10-07'},{event_date:'2026-10-07'}]){
  assert(C.isRecent(e,at));assert(!C.isRecent(e,Date.parse('2026-10-14T04:00:00Z')));
 }
}
assert(C.isRecent({event_date:'2026-01-31'},Date.parse('2026-02-02T03:59:59Z')));
assert(C.isRecent({event_date:'2025-12-31'},Date.parse('2026-01-02T03:59:59Z')));
console.log('PASS: day precision, missing occurrence timestamp, Manaus seven calendar days, midnight expiry and month/year rollover.');

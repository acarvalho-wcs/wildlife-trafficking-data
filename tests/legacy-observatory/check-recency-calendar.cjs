/* Date-only recency must not depend on a browser's localized date string. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(localizedFormat){
 const BrowserIntl={DateTimeFormat:class {
  constructor(...args){this.real=new Intl.DateTimeFormat(...args);}
  format(date){return localizedFormat?localizedFormat(date):this.real.format(date);}
  formatToParts(date){return this.real.formatToParts(date);}
 }};
 const c={window:{ScientificText:{html:String}},Date,Intl:BrowserIntl,URL};vm.createContext(c);
 vm.runInContext(fs.readFileSync('dist/case-context.js','utf8'),c);return c.window.CaseContext;
}
const now=Date.parse('2026-10-15T23:35:53Z');
for(const format of [null,()=> '10/15/2026',()=> '15/10/2026',()=> '15.10.2026']){
 const C=load(format);
 for(const day of ['2026-10-09','2026-10-14','2026-10-15']){
  for(const r of [{event_date:day},{occurred_at:day},{occurred_at:day+'T00:00:00Z',occurred_at_precision:'day',event_date:day}]){
   assert(C.isRecent(r,now));assert.equal(C.color(r,now),'#ff6b5f');
  }
 }
 for(const r of [{event_date:'2026-10-08',publication_date:'2026-10-15'},{event_date:null,publication_date:'2026-10-15',added_at:'2026-10-15T23:00:00Z'},{event_date:'2026-10-16'},{event_date:'2026-02-30'}])assert(!C.isRecent(r,now));
 assert(C.isRecent({event_date:'2026-10-14'},Date.parse('2026-10-21T03:59:59.999Z')));
 assert(!C.isRecent({event_date:'2026-10-14'},Date.parse('2026-10-21T04:00:00Z')));
}
console.log('PASS: Oct 14/15 red across ISO, US, BR and dotted locale formats; Manaus midnight rollover; unknown, old and future events stay historical.');

import test from "node:test";
import assert from "node:assert/strict";
import {parseOccurrence,occurrenceOf,matchesPeriod,csvText} from "../restricted-period-export.js";

test("Aurum Brazilian event date and source year",()=>{
 const rec={layer_type:"aurum",event_date:"06/06/2018",aurum_original_year:"2018"};
 assert.equal(occurrenceOf(rec).year,2018);
 assert.equal(occurrenceOf(rec).precision,"day");
 assert.equal(matchesPeriod(rec,"year","2018","",""),true);
 assert.equal(matchesPeriod(rec,"year","2025","",""),false);
});
test("Historical Aurum records without exact dates can be filtered by year",()=>{
 const rec={aurum_original_year:"2020"};
 assert.equal(occurrenceOf(rec).precision,"year");
 assert.equal(matchesPeriod(rec,"year","2020","",""),true);
 assert.equal(matchesPeriod(rec,"7d","","","",new Date("2026-11-02T12:00:00Z")),false);
});
test("Recent occurrences, including last day and date boundaries",()=>{
 const now=new Date("2026-11-02T12:00:00Z");
 assert.equal(matchesPeriod({event_date:"27/10/2026"},"7d","","","",now),true);
 assert.equal(matchesPeriod({event_date:"26/10/2026"},"7d","","","",now),false);
 assert.equal(matchesPeriod({event_date:"03/11/2026"},"7d","","","",now),false);
 assert.equal(matchesPeriod({event_date:"2026-11-02"},"7d","","","",now),true);
});
test("Exact-date and custom range filtering",()=>{
 const rec={event_date:"20/03/2025"};
 assert.equal(matchesPeriod(rec,"custom","","2025-03-20","2025-03-20"),true);
 assert.equal(matchesPeriod(rec,"custom","","2025-03-21","2025-03-31"),false);
 assert.equal(matchesPeriod(rec,"custom","","2025-03-31","2025-03-20"),false);
 assert.equal(parseOccurrence("31/02/2025"),null);
});
test("No occurrence date does not become its ingestion date",()=>{
 const rec={created_at:"2026-11-02T00:00:00Z",updated_at:"2026-11-02T00:00:00Z"};
 assert.equal(occurrenceOf(rec),null);
 assert.equal(matchesPeriod(rec,"all"),true);
 assert.equal(matchesPeriod(rec,"undated"),true);
 assert.equal(matchesPeriod(rec,"7d","","","",new Date("2026-11-02T12:00:00Z")),false);
});
test("CSV retains fields, Unicode, and protects injected formulas",()=>{
 const out=csvText([{name:'Arapaima "gigas", 218kg',danger:"=HYPERLINK(1,2)",lat:-7.6649}],[{label:"Título",value:r=>r.name},{label:"Contexto",value:r=>r.danger},{label:"Latitude",value:r=>r.lat}]);
 assert.ok(out.startsWith("\uFEFF"));
 assert.match(out,/"Arapaima ""gigas"", 218kg"/);
 assert.match(out,/"'=HYPERLINK\(1,2\)"/);
 assert.match(out,/"-7.6649"/);
 assert.equal(out.split("\r\n").length,3);
});

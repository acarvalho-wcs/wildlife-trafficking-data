import test from "node:test";
import assert from "node:assert/strict";
import "../../observatory/xlsx-export.js";
test("XLSX stores filtered records, numeric cells and formula-looking text safely",async()=>{
 const blob=globalThis.ObservatoryXlsx.createWorkbookBlob(["ID","Contexto","Latitude"],[["1","=HYPERLINK(1,2) 🦜",-7.6649],["2","Tráfico de fauna",0]],"Eventos");
 assert.equal(blob.type,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer);
 assert.equal(view.getUint32(0,true),0x04034b50);
 const xml=new TextDecoder().decode(bytes);
 assert.match(xml,/xl\/worksheets\/sheet1\.xml/);
 assert.match(xml,/autoFilter ref="A1:C3"/);
 assert.match(xml,/<pane ySplit="1"/);
 assert.match(xml,/=HYPERLINK\(1,2\) 🦜/);
 assert.doesNotMatch(xml,/<f>/);
 assert.match(xml,/<v>-7\.6649<\/v>/);
});

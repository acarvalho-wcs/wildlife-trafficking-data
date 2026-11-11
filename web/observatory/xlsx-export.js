/* Local XLSX exporter; input is always the caller's already-filtered records. */
(function(root){
"use strict";
const enc=new TextEncoder(),MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const table=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const escape=s=>String(s??"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function column(n){let s="";for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function cell(v,ref,bold){const style=bold?' s="1"':"";
 if(typeof v==="number"&&Number.isFinite(v))return '<c r="'+ref+'"'+style+'><v>'+v+'</v></c>';
 if(typeof v==="boolean")return '<c r="'+ref+'"'+style+' t="b"><v>'+(v?1:0)+'</v></c>';
 // The inlineStr type keeps untrusted =, +, -, @ prefixes as text, never formulas.
 return '<c r="'+ref+'"'+style+' t="inlineStr"><is><t xml:space="preserve">'+escape(String(v??"").slice(0,32767))+'</t></is></c>';
}
function crc(b){let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(files){const chunks=[],directory=[];let pos=0,dirSize=0;const d=new Date(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dt=((Math.max(1980,d.getFullYear())-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
 for(const [name,text] of files){const n=enc.encode(name),data=enc.encode(text),hash=crc(data),local=new Uint8Array(30+n.length),l=new DataView(local.buffer);
 l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint16(10,tm,true);l.setUint16(12,dt,true);l.setUint32(14,hash,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,n.length,true);local.set(n,30);chunks.push(local,data);
 const central=new Uint8Array(46+n.length),v=new DataView(central.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x0800,true);v.setUint16(12,tm,true);v.setUint16(14,dt,true);v.setUint32(16,hash,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,n.length,true);v.setUint32(42,pos,true);central.set(n,46);directory.push(central);dirSize+=central.length;pos+=local.length+data.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,dirSize,true);v.setUint32(16,pos,true);
 return new Blob([...chunks,...directory,end],{type:MIME});
}
function createWorkbookBlob(headers,records,name="Registros"){
 if(!Array.isArray(headers)||!headers.length||headers.length>16384||!Array.isArray(records)||records.length>1048575)throw Error("Invalid XLSX dimensions");
 const label=String(name).replace(/[\\/?*\[\]:]/g," ").slice(0,31)||"Registros",rows=[headers,...records],last=column(headers.length-1)+rows.length;
 const cols=headers.map((header,i)=>{let w=String(header).length+3;for(const r of records.slice(0,30))w=Math.max(w,Math.min(60,String(r[i]??"").length+2));return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.min(60,Math.max(12,w))+'" customWidth="1"/>';}).join("");
 const body=rows.map((r,i)=>'<row r="'+(i+1)+'"'+(i===0?' ht="24" customHeight="1"':'')+'>'+headers.map((_,j)=>cell(r[j],column(j)+(i+1),i===0)).join("")+'</row>').join("");
 const sheet='<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+cols+'</cols><sheetData>'+body+'</sheetData><autoFilter ref="A1:'+last+'"/></worksheet>';
 const wb='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+escape(label)+'" sheetId="1" r:id="rId1"/></sheets></workbook>';
 const styles='<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF153B4A"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf xfId="0" fontId="0" fillId="0" borderId="0"/><xf xfId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 const types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
 const relation=(items)=>'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+items+'</Relationships>';
 return zip([["[Content_Types].xml",types],["_rels/.rels",relation('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>')],["xl/workbook.xml",wb],["xl/_rels/workbook.xml.rels",relation('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')],["xl/styles.xml",styles],["xl/worksheets/sheet1.xml",sheet]]);
}
function downloadWorkbook(headers,rows,filename,sheetName="Registros"){
 const url=URL.createObjectURL(createWorkbookBlob(headers,rows,sheetName)),a=document.createElement("a");a.href=url;a.download=filename;a.style.display="none";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
root.ObservatoryXlsx=Object.freeze({createWorkbookBlob,downloadWorkbook});
})(typeof window==="undefined"?globalThis:window);

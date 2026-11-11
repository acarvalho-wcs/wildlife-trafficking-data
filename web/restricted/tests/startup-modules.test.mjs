import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

function parseSource(name){
 const code=readFileSync(name,"utf8")
   .replace(/^import .*;\s*$/gm,"")
   .replace(/^export /gm,"");
 return new Function(code+";\nreturn typeof validHttps === 'function' ? validHttps : null;");
}
for(const name of ["secure.js","explorer.js","intake.js","map-points.js","firebase-config.js"]){
 const compiled=parseSource(name);
 assert.equal(typeof compiled,"function");
 console.log("PASS: module compiles",name);
}
const validate=parseSource("intake.js")();
for(const uri of ["https://example.org/advert/1","https://chat.whatsapp.com/example"]){
 assert.equal(validate(uri),true,uri);
}
for(const uri of ["javascript:alert(1)","http://example.org/","ftp://example.org/","/relative","https://bad url"]){
 assert.equal(validate(uri),false,uri);
}
console.log("PASS: URL validation and no blank-screen syntax errors");

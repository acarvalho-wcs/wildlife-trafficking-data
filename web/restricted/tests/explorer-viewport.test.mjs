import test from "node:test";
import assert from "node:assert/strict";
import {viewportSignature,needsViewportFit} from "../explorer-viewport.js";

const sample={search:"",filters:["","",""],layers:["physical_market","advertisement"],locations:[
 {id:"SAM Farm",latitude:24.8607,longitude:67.0011},
 {id:"Other",latitude:-23.55,longitude:-46.63}
]};
test("selecting a species reframes one mapped result",()=>{
 const before=viewportSignature(sample);
 const filtered=viewportSignature({...sample,filters:["Chiropotes sp.","",""],locations:sample.locations.slice(0,1)});
 assert.notEqual(before,filtered);
 assert.equal(needsViewportFit(false,before,filtered),true);
});
test("typing, layers, and changed coordinates reframe",()=>{
 const start=viewportSignature(sample);
 assert.notEqual(start,viewportSignature({...sample,search:"SAM Farm"}));
 assert.notEqual(start,viewportSignature({...sample,layers:["physical_market"]}));
 assert.notEqual(start,viewportSignature({...sample,locations:[{id:"SAM Farm",latitude:23.3,longitude:67.1}]}));
});
test("manual map navigation is retained when filters are unchanged",()=>{
 const key=viewportSignature(sample);
 assert.equal(needsViewportFit(false,key,key),false);
 assert.equal(needsViewportFit(true,key,key),true);
});
test("layer ordering and search accents do not spuriously move the map",()=>{
 const key=viewportSignature(sample);
 assert.equal(key,viewportSignature({...sample,layers:["advertisement","physical_market"]}));
 assert.equal(viewportSignature({...sample,search:"Espécie"}),viewportSignature({...sample,search:"especie"}));
});

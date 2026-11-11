import test from "node:test";
import assert from "node:assert/strict";
import {scientificSegments} from "../scientific-format.js";
function italic(value,taxon=value){return scientificSegments(value,taxon).filter(x=>x.italic).map(x=>x.text);}
test("binomial and multiple taxa separated by plus",()=>{
 assert.deepEqual(italic("Panthera onca + Puma concolor"),["Panthera","onca","Puma","concolor"]);
});
test("genus italic, identification qualifiers roman",()=>{
 assert.deepEqual(italic("Chelonoidis sp. + Anodorhynchus spp. + Panthera cf. onca"),["Chelonoidis","Anodorhynchus","Panthera","onca"]);
});
test("trinomial names italicized without punctuation",()=>{
 assert.deepEqual(italic("Saguinus labiatus labiatus"),["Saguinus","labiatus","labiatus"]);
});
test("common terms and higher taxa remain roman",()=>{
 assert.deepEqual(italic("Swim bladder + Ornamental fish + Podocnemididae"),[]);
});
test("mixed common and binomial taxa",()=>{
 assert.deepEqual(italic("Sea cucumber + Arapaima gigas"),["Arapaima","gigas"]);
});
test("do not italicize scientific text absent from the label",()=>{
 assert.deepEqual(italic("Aurum record", "Panthera onca"),[]);
});

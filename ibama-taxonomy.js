/* Conservative fauna eligibility and individual scientific species identities. */
(function(root,factory){const p=factory();if(typeof module==='object'&&module.exports)module.exports=p;else root.IbamaTaxonomy=p;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const words=x=>norm(x).replace(/[^a-z0-9]+/g,' ').trim();
const animal=/\b(?:fauna|animais?|animalia|aves?|birds?|mammalia|mamiferos?|mammals?|repteis|reptil|reptilia|reptiles?|anfibios?|amphibia|amphibians?|peixes?|fish|pisces|actinopterygii|chondrichthyes|invertebrados?|insects?|insetos?|insecta|aracnideos?|arachnida|crustaceos?|crustacea|malacostraca|gastropoda|bivalvia|cephalopoda|elasmobranchii|osteichthyes|sarcopterygii|passeriformes|psittaciformes|testudines|squamata|crocodylia|crocodilia|primates|carnivora|rodentia|chiroptera|annelida|artr[oó]podes|arthropoda|moluscos?|mollusca|cnidaria|equinodermos?|echinodermata)\b/;
const plant=/\b(?:flora|plantas?|plantae|vegetais?|vegetal|arvores?|madeiras?|fungos?|fungi|algas?|botanica|angiospermas?|gimnospermas?|forestal|florestal)\b/;
const wood=/^(?:m\s*3|m³|metro[s]?\s+cubico[s]?|st|estereo[s]?)$/i;
const forest=/\b(?:madeira[s]?|toras?|lenha|carvao vegetal|produto[s]? florestal|produtos florestais|origem florestal|serraria|desmatamento|vegetacao|flora|supressao|arvores?|exploracao florestal)\b/;
const direct=/\b(?:animais? silvestres?|animais? da fauna|especimes? da fauna|fauna silvestre|caca predatoria|cacar|apanhar animais|capturar animais|comercio de animais|maus tratos (?:a|de|contra) animais|aves silvestres?|passaros silvestres?|animais? nativos?)\b/;
const generic=/\b(?:flora e fauna|fauna e flora|flora ou fauna|fauna ou flora|flora flora|fauna flora|flora fauna)\b/g;
const clean=x=>words(x).replace(generic,' ');
const stop=new Set(['spp','sp','cf','aff','indet','unknown','species','specie','specimens','especies','silvestre','silvestres','diversos','diversas','domestico','domestica','domesticos','domesticas','nao','not','unidentified','nativa','nativo','e','and','or','ou','de','da','do','dos','das','em','por','the','common','wild']);
function binomial(genus,epithet){if(stop.has(genus.toLowerCase())||stop.has(epithet.toLowerCase()))return '';return genus[0].toUpperCase()+genus.slice(1).toLowerCase()+' '+epithet.toLowerCase();}
function speciesNames(value){
 // A structured scientific-name field may include author/year, a subspecies, or multiple full names.
 // Never infer an abbreviated genus, hybrid, cf./aff. identification, or a genus-only record.
 const result=new Set(),raw=String(value??'').normalize('NFKC').replace(/\*/g,'').trim();
 for(let part of raw.split(/\s*(?:;|\/|\||\n|,(?=\s*[A-Z][a-z]+\s+[a-z]))\s*/)){
  part=part.trim().replace(/^\d+\s*(?:x\s*)?/i,'').replace(/\s+/g,' ');
  if(!part||/\b(?:cf|aff)\.?\s|[×]|\bhybrid\b/i.test(part))continue;
  const m=/^([A-Za-z]{2,}) ([A-Za-z][A-Za-z-]{1,})(?=$|[\s,(])/.exec(part);
  if(!m)continue;
  const rest=part.slice(m[0].length).trim();
  // A residual third epithet (subspecies) or nomenclatural author is permitted; arbitrary prose is not.
  if(rest&&!/^(?:[a-z][a-z-]{1,}(?:\s+(?:\(?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*)*(?:[, ]+\d{4})?\)?|\(?\d{4}\)?))?|(?:\(?[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*)*(?:[, ]+\d{4})?\)?|\(?\d{4}\)?))$/.test(rest))continue;
  const n=binomial(m[1],m[2]);if(n)result.add(n);
 }
 return [...result];
}
function markedNames(value){
 const out=new Set();
 for(const m of String(value??'').matchAll(/(?<!\*)\*([^*\r\n]+)\*(?!\*)/g))for(const n of speciesNames(m[1]))out.add(n);
 return [...out];
}
function osintCatalog(rows,known=new Set()){
 const genera=new Set(),names=new WeakMap();
 for(const n of known){const g=String(n).split(' ')[0];if(g)genera.add(g.toLowerCase());}
 for(const e of rows)for(const n of markedNames(e.taxon_text||e.taxon))genera.add(n.split(' ')[0].toLowerCase());
 for(const e of rows){
  const raw=String(e.taxon_text||e.taxon||''),found=new Set(markedNames(raw));
  // Unmarked names are recovered only with corroborated genera, not arbitrary two-word phrases.
  for(const m of raw.replace(/\*[^*\r\n]+\*/g,' ').matchAll(/\b([A-Z][a-z]+|[A-Z]{2,})\s+([a-z][a-z-]+|[A-Z]{2,})\b/g)){
   const before=raw; // The marked parser handles explicit uncertain IDs separately.
   if(!genera.has(m[1].toLowerCase())||stop.has(m[2].toLowerCase()))continue;
   const n=binomial(m[1],m[2]);if(n)found.add(n);
  }
  for(const n of candidateNames(raw))if(verified(n)&&!new RegExp('(?:cf|aff)\\.?\\s+'+n.replace(' ','\\s+'),'i').test(raw))found.add(n);
  names.set(e,[...new Set([...found].map(canonicalName))]);
 }
 return names;
}
const registry=new Map(Object.entries({"coryphospingus pileatus":{"name":"Coryphospingus pileatus","group":"Aves","source":"GBIF Checklist Bank https://www.gbif.org/taxon/YSS2"},"coryphospingus cucullatus":{"name":"Coryphospingus cucullatus","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"turdus leucomelas":{"name":"Turdus leucomelas","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"ara chloroptera":{"name":"Ara chloroptera","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"cyanocorax cyanopogon":{"name":"Cyanocorax cyanopogon","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"scardafella squammata":{"name":"Scardafella squammata","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"passerina cyanoides":{"name":"Passerina cyanoides","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"forpus xanthopterygius":{"name":"Forpus xanthopterygius","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"dendrocygna viduata":{"name":"Dendrocygna viduata","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"mimus saturninus":{"name":"Mimus saturninus","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"diopsittaca nobilis":{"name":"Diopsittaca nobilis","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"aratinga jandaya":{"name":"Aratinga jandaya","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"aratinga leucophthalmus":{"name":"Aratinga leucophthalmus","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"scaphidura oryzivora":{"name":"Scaphidura oryzivora","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"molothrus bonariensis":{"name":"Molothrus bonariensis","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"sporophila collaris":{"name":"Sporophila collaris","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"stephanophorus diadematus":{"name":"Stephanophorus diadematus","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"gallus gallus":{"name":"Gallus gallus","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"guaruba guarouba":{"name":"Guaruba guarouba","group":"Aves","source":"manual classification of audited source taxon; external exact-match pending"},"hydrochaeris hydrochaeris":{"name":"Hydrochoerus hydrochaeris","group":"Mamíferos","source":"GBIF Catalogue of Life https://www.gbif.org/taxon/3N622"},"tapirus terrestris":{"name":"Tapirus terrestris","group":"Mamíferos","source":"manual classification of audited source taxon; external exact-match pending"},"kerodon rupestris":{"name":"Kerodon rupestris","group":"Mamíferos","source":"manual classification of audited source taxon; external exact-match pending"},"felis catus":{"name":"Felis catus","group":"Mamíferos","source":"manual classification of audited source taxon; external exact-match pending"},"podocnemis sextuberculata":{"name":"Podocnemis sextuberculata","group":"Répteis","source":"manual classification of audited source taxon; external exact-match pending"},"geochelone carbonaria":{"name":"Geochelone carbonaria","group":"Répteis","source":"manual classification of audited source taxon; external exact-match pending"},"tupinambis merianae":{"name":"Tupinambis merianae","group":"Répteis","source":"manual classification of audited source taxon; external exact-match pending"},"mycteroperca bonaci":{"name":"Mycteroperca bonaci","group":"Peixes","source":"manual classification of audited source taxon; external exact-match pending"},"epinephelus morio":{"name":"Epinephelus morio","group":"Peixes","source":"manual classification of audited source taxon; external exact-match pending"},"amphiprion ocellaris":{"name":"Amphiprion ocellaris","group":"Peixes","source":"manual classification of audited source taxon; external exact-match pending"},"cardisoma guanhumi":{"name":"Cardisoma guanhumi","group":"Invertebrados","source":"manual classification of audited source taxon; external exact-match pending"}}));
function setRegistry(records){for(const [key,v] of Object.entries(records||{})){if(!v||typeof v.name!=='string'||!v.group||!speciesNames(v.name).length||v.kingdom!=='Animalia'||v.matchType!=='EXACT')continue;registry.set(norm(key),v);registry.set(norm(v.name),{...v,name:v.name});}}
function verified(name){return registry.get(norm(name));}
function canonicalName(name){return verified(name)?.name||name;}
function candidateNames(value){
 const raw=String(value??'').replace(/\*/g,'');
 const out=new Set(speciesNames(raw));
 // Additional complete, explicitly delimited binomials; registry verification required before use.
 for(const m of raw.matchAll(/\b([A-Z][a-z]+|[A-Z]{2,})\s+([a-z][a-z-]+|[A-Z]{2,})\b/g)){
  if(stop.has(m[1].toLowerCase())||stop.has(m[2].toLowerCase()))continue;
  const n=binomial(m[1],m[2]);if(n)out.add(n);
 }
 return [...out];
}
function itemNames(item){const out=new Set(speciesNames(item.scientific_name));for(const n of candidateNames(item.scientific_name))if(verified(n))out.add(n);return [...out];}
function plantItem(x){return plant.test(words(x?.group))||wood.test(norm(x?.unit));}
function animalItem(x){return animal.test(words(x?.group))&&!plantItem(x);}
function allItems(p){return [...(p.species_referenced||[]),...(p.seized_specimens||[]),...(p.narrative_species||[])];}
function eligibility(p){
 if(p.fauna_evidence?.version==='national-full-v3'&&['official_fauna','official_fishing','linked_animal_specimen','direct_fauna_conduct','previous_validated'].includes(p.fauna_evidence.reason))return {ok:true,reason:p.fauna_evidence.reason};
 const o=p.official||{},type=words(o.administrative_class||p.type),desc=clean(o.infraction_description||p.description),detail=clean(o.narrative_detail),items=allItems(p);
 const official=/\bfauna\b/.test(type)&&!plant.test(type),positive=items.some(animalItem),forestry=forest.test(desc)||forest.test(detail)&&items.some(plantItem),conduct=direct.test(desc)||direct.test(detail);
 if(positive)return {ok:true,reason:'documented_animal_specimen'};
 if(forestry&&!conduct)return {ok:false,reason:'forest_only_or_generic_legal_reference'};
 if(official&&!forestry)return {ok:true,reason:'official_fauna_class'};
 if(conduct&&!forestry)return {ok:true,reason:'direct_fauna_conduct'};
 return {ok:false,reason:forestry?'mixed_or_forest_without_animal_evidence':'no_direct_fauna_evidence'};
}
function common(value){const a=String(value??'').trim().split(/\s*[,;\/|]\s*/)[0]?.trim()||'';return a.length>=2&&a.length<=80&&!/\d|[()[\]{}]/.test(a)&&!(/^[A-Z][a-z]+ [a-z][a-z-]+$/.test(a)&&/^[A-Z][a-z]+ [a-z]+(?:ensis|icus|ina|inus|us|ae|ii|orum|arum)$/.test(a))&&!/^(?:fauna|animal|animais|ave|aves|peixe|peixes|reptil|repteis|mamifero|mamiferos|nao informado|desconhecido|unknown|sem identificacao|indeterminado|especime|outros?)$/i.test(words(a))?a:'';}
function entries(items,known=new Set()){const out=new Map();for(const item of items||[]){if(plantItem(item))continue;const names=itemNames(item);for(const rawName of names){const name=canonicalName(rawName),key=norm(name),v=verified(rawName);if(!animalItem(item)&&!known.has(norm(rawName))&&!known.has(key)&&!v)continue;const alias=names.length===1?common(item.common_name):'';if(!out.has(key)||!out.get(key).common&&alias)out.set(key,{key,name,common:alias,group:v?.group||'',sourceName:rawName});}}return [...out.values()];}
return Object.freeze({norm,words,speciesNames,markedNames,osintCatalog,candidateNames,itemNames,verified,canonicalName,setRegistry,animalItem,plantItem,eligibility,entries,common,allItems});
});

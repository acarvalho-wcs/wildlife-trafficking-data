// Safe formatting of biological names in restricted map cards, filters and reports.
// Genus and Latin epithets are italic; sp., spp., cf. and aff. remain roman.
// Text nodes only: never interpret species data as HTML.
const trimName=value=>String(value??"").trim().replace(/\s+/g," ");
const escapeRegex=value=>String(value).replace(/[^A-Za-z0-9]/g,"\\$&");
const NON_LATIN_START=new Set([
 "sea","swim","ornamental","capuchin","star","fin","blue","red","wildlife",
 "live","river","giant","freshwater","marine","fish","fishes","shark",
 "bird","birds","primate","primates","unknown","bushmeat","animal",
 "animals","turtle","turtles","seafood","black","green","white","brown",
 "golden","forest","common","spotted","saltwater"
]);
const HIGHER_RANK=/(?:idae|inae|iformes|aceae|phyta|mycota|opsida)$/iu;
const BINOMIAL=/(?<![\p{L}\p{N}])([A-Z][a-z-]{2,}|[A-Z]\.)\s+(?:(?:cf\.|aff\.)\s+)?(?:spp\.|sp\.|[a-z][a-z-]{2,})(?![\p{L}\p{N}])/gu;
const QUALIFIER=/^(?:sp\.|spp\.|cf\.|aff\.)$/iu;

function sourceValues(taxon){
 const result=[];
 for(const item of Array.isArray(taxon)?taxon:[taxon]){
  if(item==null)continue;
  if(typeof item==="object"){
   for(const key of ["wildlife_group","scientific_name","scientific_names","scientificName","scientific_species","taxon"]){
    if(item[key])result.push(...sourceValues(item[key]));
   }
  }else if(String(item).trim())result.push(String(item));
 }
 return result;
}
function candidates(source){
 const names=[];
 for(const text of sourceValues(source)){
  for(const m of text.matchAll(BINOMIAL)){
   const genus=m[1];
   if(NON_LATIN_START.has(genus.toLowerCase())||HIGHER_RANK.test(genus))continue;
   let full=m[0];
   // Include trinomial names when the third epithet ends at a delimiter.
   const after=text.slice(m.index+m[0].length);
   const third=after.match(/^\s+([a-z][a-z-]{2,})(?=\s*(?:[+,;|).]|$))/u);
   if(third&&!QUALIFIER.test(full.split(/\s+/).at(-1)))full+=third[0];
   names.push(trimName(full));
  }
  const single=trimName(text);
  if(/^[A-Z][a-z-]{3,}$/u.test(single)&&
     !NON_LATIN_START.has(single.toLowerCase())&&!HIGHER_RANK.test(single)){
   names.push(single); // A genus without a species identification.
  }
 }
 return [...new Set(names)].sort((a,b)=>b.length-a.length);
}
function spans(value,taxon){
 const ranges=[];
 const add=(start,end)=>{
  if(start<0||end<=start||ranges.some(r=>start<r[1]&&end>r[0]))return;
  ranges.push([start,end]);
 };
 for(const name of candidates(taxon)){
  const search=new RegExp("(?<![\\p{L}\\p{N}])"+name.split(/\s+/).map(escapeRegex).join("\\s+")+"(?![\\p{L}\\p{N}])","giu");
  for(const m of value.matchAll(search)){
   const words=[...m[0].matchAll(/[A-Za-zÀ-ÿ-]+\.?/gu)];
   for(const word of words){
    if(!QUALIFIER.test(word[0]))add(m.index+word.index,m.index+word.index+word[0].length);
   }
  }
 }
 // Conservative fallback for labels not accompanied by taxonomic metadata.
 if(!sourceValues(taxon).length){
  const label=trimName(value);
  for(const name of candidates(label)){
   const offset=value.indexOf(name);
   const before=value.slice(0,offset).trim();
   const after=value.slice(offset+name.length).trim();
   const introduced=/(?:\b(?:de|do|da|of|for|species|especie|espécie)\s*|[:(—–-]\s*)$/iu.test(before);
   if(!((!before&&!after)||introduced))continue;
   const local=[...name.matchAll(/[A-Za-zÀ-ÿ-]+\.?/gu)];
   for(const word of local)if(!QUALIFIER.test(word[0]))add(offset+word.index,offset+word.index+word[0].length);
  }
 }
 return ranges.sort((a,b)=>a[0]-b[0]);
}
export function scientificSegments(value,taxon=""){
 const text=String(value??"");
 const ranges=spans(text,taxon);
 const segments=[];let index=0;
 for(const [start,end] of ranges){
  if(start>index)segments.push({text:text.slice(index,start),italic:false});
  segments.push({text:text.slice(start,end),italic:true});
  index=end;
 }
 if(index<text.length)segments.push({text:text.slice(index),italic:false});
 if(!segments.length)segments.push({text,italic:false});
 return segments;
}
export function appendScientific(parent,value,taxon=""){
 parent.replaceChildren();
 for(const segment of scientificSegments(value,taxon)){
  if(segment.italic){
   const italic=document.createElement("i");
   italic.className="scientific-name";
   italic.textContent=segment.text;
   parent.append(italic);
  }else parent.append(document.createTextNode(segment.text));
 }
 return parent;
}
export function appendScientificTerm(parent,taxon){
 return appendScientific(parent,taxon,taxon);
}

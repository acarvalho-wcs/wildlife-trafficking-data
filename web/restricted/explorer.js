import {viewportSignature,needsViewportFit} from "./explorer-viewport.js";
import {periodLabels,occurrenceOf,matchesPeriod,csvText} from "./restricted-period-export.js";
import {appendScientific,appendScientificTerm} from "./scientific-format.js";
import { localizedField, localizedTitle, localizedDescription } from "./record-locale.js";

let projectionMode="map", mapColorMode="dark";
let dataset=[], canonicalRecords=[],reviewedPoints=[],aurumQuantities=Object.create(null), language="pt", map=null, pins=[], mapReady=false, mapLoaded=false, activeId=null, activeGroupKey=null, fallbackLayer=null, fallbackTiles=null, fallbackPins=null, fallbackCenter=[-53,-12], fallbackZoom=4, mapAttempted=false;
const rasterCache=new Map();let rasterFrame=null,lastViewportSignature=null;
const el=id=>document.getElementById(id);
const trans={
 pt:{searchCount:"registros encontrados",searchBox:"BUSCAR REGISTROS",searchRecordsPlaceholder:"Buscar espécie, local, rota, país, termo...",k:"EXPLORADOR GEOGRÁFICO",title:"Mercados de fauna: mapa e filtros",desc:"Mapeamento aproximado, não a localização de vendedores. Combine os filtros para explorar anúncios.",reset:"Limpar filtros",search:"Busca livre",species:"Espécie",state:"Estado / região",city:"Município",source:"Fonte",status:"Verificação",product:"Produto",matches:"registros correspondentes",map:"no mapa",unmapped:"sem localização mapeável",results:"Resultados",notice:"Marcadores indicam posições aproximadas, nunca endereços de vendedores.",searchPlaceholder:"Espécie, fonte, cidade, produto...",fallbackLabel:"Texto disponível em outro idioma",resetMap:"Centralizar registros",mapUnavailable:"O mapa está parcialmente indisponível. O restante do painel permanece acessível.",empty:"Nenhum registro corresponde aos filtros.",all:"Todos",more:"Detalhes",close:"Fechar",link:"Fonte original",precision:"Precisão geográfica",price:"Preço anunciado",quantity:"Quantidade",review:"Situação",observation:"Contexto da observação",noDate:"Data não informada",country:"País",unlocated:"Sem coordenadas verificadas para este registro. O mapa permanece na posição atual.",layers:"Camadas",fullscreen:"Tela cheia",exitFullscreen:"Sair da tela cheia",layerNames:{advertisement:"Anúncios",platform:"Plataformas",fair:"Feiras",physical_market:"Vendedores físicos",aurum:"Aurum"},layersHeading:"Camadas do mapa",layersHint:"Selecione as categorias exibidas no mapa.",layersLegend:"Categorias de registros",layersSafety:"Localizações aproximadas de registros revisados; não identificam pessoas nem comprovam irregularidades.",layersClose:"Fechar camadas",evidence:"Evidência",corroborated:"Corroborada",sourceDraft:"Registro administrativo revisado"},
 en:{searchCount:"records found",searchBox:"SEARCH RECORDS",searchRecordsPlaceholder:"Search species, location, route, country, keyword...",k:"GEOGRAPHIC EXPLORER",title:"Wildlife markets: map and filters",desc:"Approximate mapping, not seller locations. Combine filters to explore listings.",reset:"Clear filters",search:"Free search",species:"Species",state:"State / region",city:"Municipality",source:"Source",status:"Verification",product:"Product",matches:"matching records",map:"on map",unmapped:"without mappable location",results:"Results",notice:"Markers show approximate locations, never seller addresses.",searchPlaceholder:"Species, source, city, product...",fallbackLabel:"Text available in another language",resetMap:"Center on records",mapUnavailable:"Part of the map is unavailable. The rest of the dashboard remains accessible.",empty:"No records match these filters.",all:"All",more:"Details",close:"Close",link:"Original source",precision:"Spatial accuracy",price:"Advertised price",quantity:"Quantity",review:"Status",observation:"Observation context",noDate:"Date not available",country:"Country",unlocated:"No verified coordinates for this record. The map remains at its current location.",layers:"Layers",fullscreen:"Fullscreen",exitFullscreen:"Exit fullscreen",layerNames:{advertisement:"Listings",platform:"Platforms",fair:"Fairs",physical_market:"Physical sellers",aurum:"Aurum"},layersHeading:"Map layers",layersHint:"Choose which categories appear on the map.",layersLegend:"Record categories",layersSafety:"Approximate locations of reviewed records; they do not identify people or establish wrongdoing.",layersClose:"Close layers",evidence:"Evidence",corroborated:"Corroborated",sourceDraft:"Reviewed administrative record"},
 es:{searchCount:"registros encontrados",searchBox:"BUSCAR REGISTROS",searchRecordsPlaceholder:"Buscar especie, lugar, ruta, país, término...",k:"EXPLORADOR GEOGRÁFICO",title:"Mercados de fauna: mapa y filtros",desc:"Georreferenciación aproximada, no ubicaciones de vendedores. Combine filtros para explorar anuncios.",reset:"Limpiar filtros",search:"Búsqueda",species:"Especie",state:"Estado / región",city:"Municipio",source:"Fuente",status:"Verificación",product:"Producto",matches:"registros coincidentes",map:"en el mapa",unmapped:"sin ubicación cartografiable",results:"Resultados",notice:"Los marcadores indican posiciones aproximadas, nunca direcciones de vendedores.",searchPlaceholder:"Especie, fuente, ciudad, producto...",fallbackLabel:"Texto disponible en otro idioma",resetMap:"Centrar registros",mapUnavailable:"Una parte del mapa no está disponible. El resto del panel sigue accesible.",empty:"Ningún registro coincide con los filtros.",all:"Todos",more:"Detalles",close:"Cerrar",link:"Fuente original",precision:"Precisión geográfica",price:"Precio anunciado",quantity:"Cantidad",review:"Estado",observation:"Contexto de observación",noDate:"Fecha no disponible",country:"País",unlocated:"Este registro no tiene coordenadas verificadas. El mapa permanece en su posición actual.",layers:"Capas",fullscreen:"Pantalla completa",exitFullscreen:"Salir de pantalla completa",layerNames:{advertisement:"Anuncios",platform:"Plataformas",fair:"Ferias",physical_market:"Vendedores físicos",aurum:"Aurum"},layersHeading:"Capas del mapa",layersHint:"Seleccione las categorías visibles en el mapa.",layersLegend:"Categorías de registros",layersSafety:"Ubicaciones aproximadas de registros revisados; no identifican personas ni demuestran irregularidades.",layersClose:"Cerrar capas",evidence:"Evidencia",corroborated:"Corroborada",sourceDraft:"Registro administrativo revisado"}
};
const layerNames=["advertisement","platform","fair","physical_market","aurum"];
const activeLayers=()=>new Set([...document.querySelectorAll("#explorer-layers input:checked")].map(e=>e.value));

// Aurum coordinates in Firestore may predate the geographic audit.
// Fail closed until the local Brazil municipality/UF reference has been loaded.
let aurumGeography=null,aurumGeoRequested=false;
const aurumStateNames={"acre":"AC","alagoas":"AL","amapa":"AP","amazonas":"AM","bahia":"BA","ceara":"CE","distrito federal":"DF","espirito santo":"ES","goias":"GO","maranhao":"MA","mato grosso":"MT","mato grosso do sul":"MS","minas gerais":"MG","para":"PA","paraiba":"PB","parana":"PR","pernambuco":"PE","piaui":"PI","rio de janeiro":"RJ","rio grande do norte":"RN","rio grande do sul":"RS","rondonia":"RO","roraima":"RR","santa catarina":"SC","sao paulo":"SP","sergipe":"SE","tocantins":"TO"};
const aurumNormalize=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/-/g," ").trim().replace(/\s+/g," ");
const aurumUF=v=>{const s=String(v||"").trim().toUpperCase();return /^[A-Z]{2}$/.test(s)?s:aurumStateNames[aurumNormalize(v)]||"";};
function aurumInsideRing(x,y,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function aurumInsideState(lon,lat,g){const polys=g.type==="Polygon"?[g.coordinates]:g.coordinates;return polys.some(p=>aurumInsideRing(lon,lat,p[0])&&!p.slice(1).some(h=>aurumInsideRing(lon,lat,h)));}
function aurumDistanceKm(lat,lon,clat,clon){const rad=Math.PI/180,p1=lat*rad,p2=clat*rad,dp=(clat-lat)*rad,dl=(clon-lon)*rad;const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 12742*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));}
async function loadAurumGeography(){
 if(aurumGeoRequested)return;aurumGeoRequested=true;
 try{
  const [st,cm]=await Promise.all([fetch(new URL("./assets/geography/brazil_states.geojson",import.meta.url)),fetch(new URL("./assets/geography/brazil_municipal_centers.csv",import.meta.url))]);
  if(!st.ok||!cm.ok)throw Error("Geographic reference unavailable");
  const features=(await st.json()).features,lines=(await cm.text()).trim().split(/\r?\n/);
  const polygons=new Map(features.map(f=>[f.properties.sigla,f.geometry])),centers=new Map();
  for(const line of lines.slice(1)){const cols=line.split(",");if(cols.length!==5)continue;centers.set(cols[1]+":"+aurumNormalize(cols[2]),{lat:Number(cols[3]),lon:Number(cols[4]),ibge:cols[0]});}
  if(polygons.size!==27||centers.size<5500)throw Error("Incomplete geographic reference");
  aurumGeography={polygons,centers};
 }catch(err){console.warn("Aurum geography unavailable; retaining records and coordinates while keeping the two confirmed corrections",err);}
 finally{rebuildDataset();options();render(true);}
}
function validateAurumMapPoint(r){
 if(r.layer_type!=="aurum")return r;
 // Explicit corrections confirmed against Aurum Integration, rows 635-636.
 const caseId=String(r.aurum_case_id||r.id||"").replace(/^aurum-/,"");
 if((caseId==="PMP2026_421"||caseId==="PMP2026_422")&&aurumNormalize(r.country)==="brazil"&&aurumUF(r.state)==="AC"&&aurumNormalize(r.municipality)==="cruzeiro do sul")return {...r,latitude:-7.6649,longitude:-72.6504,location_precision:"municipality",aurum_geolocation_display:"verified_override"};
 const country=aurumNormalize(r.country);
 if(country!=="brazil"&&country!=="brasil")return r; // This reference covers Brazil only.
 if(!aurumGeography)return r; // Loading or unavailable: never remove valid records from the explorer.
 const uf=aurumUF(r.state),shape=aurumGeography.polygons.get(uf);
 if(!shape)return {...r,latitude:null,longitude:null,location_precision:"unlocated",aurum_geolocation_display:"state_unresolved"};
 const city=aurumNormalize(r.municipality),center=city?aurumGeography.centers.get(uf+":"+city):null;
 if(city&&!center)return {...r,latitude:null,longitude:null,location_precision:"unlocated",aurum_geolocation_display:"municipality_unresolved"};
 const lat=Number(r.latitude),lon=Number(r.longitude);
 const inState=Number.isFinite(lat)&&Number.isFinite(lon)&&aurumInsideState(lon,lat,shape);
 if(inState&&(!center||aurumDistanceKm(lat,lon,center.lat,center.lon)<=100))return r;
 if(!center)return {...r,latitude:null,longitude:null,location_precision:"unlocated",aurum_geolocation_display:"coordinates_unverified"};
 return {...r,latitude:center.lat,longitude:center.lon,location_precision:"municipality",aurum_geolocation_display:"municipality_center",ibge_municipality_code:center.ibge};
}

function rebuildDataset(){
 const canonical=canonicalRecords.filter(r=>!/^mel_|^honey_|^bee_honey/.test(String(r.product_type||"").toLowerCase())).map(r=>({...r,layer_type:r.layer_type|| (r.record_kind==="platform"?"platform":"advertisement")}));
 const points=reviewedPoints.filter(r=>r.published===true && layerNames.includes(r.layer_type)).map(validateAurumMapPoint).map(r=>({
  ...r,id:"point-"+r.id,source:r.layer_type==="aurum"?"Registros Aurum":trans[language].sourceDraft,
  scientific_name:r.scientific_name||"",wildlife_group:r.wildlife_group||"",status:r.evidence_status==="corroborated"?"Verificado":"Em revisão",
  product_type:r.layer_type,
  description_pt:r.description_pt||r.notes||"", // Existing notes stay the original-language fallback.
  description_en:r.description_en||"",description_es:r.description_es||""
 }));
 dataset=[...canonical,...points];
 // The dashboard total must count the same unfiltered catalog as the explorer, including published Aurum points.
 const total=document.getElementById("records-count");
 if(total)total.textContent=String(dataset.length);
}
const controls={species:"scientific_name",state:"state",city:"municipality",source:"source",status:"status",product:"product_type"};
const speciesValues=r=>r.layer_type==="aurum"?[r.wildlife_group||r.scientific_name].filter(Boolean):[r.scientific_name,...(Array.isArray(r.species_observed)?r.species_observed:[]),...(Array.isArray(r.species_offered)?r.species_offered:[]),...(Array.isArray(r.species_additional)?r.species_additional:[])];
const normalize=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();

/* Search works across structured evidence, independent of the display language.
   Match at word starts so "aves" cannot accidentally match "chaves". */
const normalizeSearch=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const searchFields=[
 "title","title_pt","title_en","title_es","name","scientific_name","scientific_names",
 "genus","taxon","taxa","species","species_name","species_names","species_list",
 "species_observed","species_offered","species_additional","species_aliases",
 "common_name","common_name_pt","common_name_en","common_name_es","common_names",
 "fauna_group","fauna_groups","animal_group","animal_groups","wildlife_group",
 "fauna_class","taxonomic_class","class","product_type","product_category",
 "country","country_name","country_pt","country_en","country_es","country_code",
 "country_iso2","country_iso3","origin_country","destination_country",
 "state","state_name","region","municipality","city","location","location_name",
 "route","route_text","origin","destination","source","source_url","status",
 "description","description_pt","description_en","description_es","notes",
 "social_handle","keywords","tags"
];
const countryFields=["country","country_name","country_pt","country_en","country_es","country_code","country_iso2","country_iso3","origin_country","destination_country"];
const synonymGroups=[
 ["aves","ave","bird","birds","avian","avifauna","passaros","passaro","pajaros","pajaro","oiseau","oiseaux"],
 ["mamiferos","mamifero","mammals","mammal","mamiferos"],
 ["repteis","reptil","reptiles","reptile","reptiles"],
 ["peixes","peixe","fish","fishes","peces","pez"],
 ["tubaroes","tubarao","sharks","shark","tiburones","tiburon"]
];
const searchIndexCache=new WeakMap();
function addSearchValues(value,parts,depth=0){
 if(typeof value==="string"){
  const normalized=normalizeSearch(value);
  if(normalized)parts.push(normalized);
 }else if(depth<4&&Array.isArray(value)){
  for(const entry of value.slice(0,300))addSearchValues(entry,parts,depth+1);
 }else if(depth<4&&value&&typeof value==="object"){
  for(const [key,entry] of Object.entries(value).slice(0,120)){
   // Timestamp / numeric metadata is not a free-text search field.
   if(!key.startsWith("_"))addSearchValues(entry,parts,depth+1);
  }
 }
}
function searchableRecordParts(record){
 const cached=searchIndexCache.get(record);if(cached)return cached;
 const parts=[];
 for(const field of searchFields)addSearchValues(record[field],parts);
 const countryNames=countryFields.flatMap(field=>{
  const list=[];addSearchValues(record[field],list);return list;
 });
 const brazil=/\b(?:brasil|brazil|brazilian|brasileiro|brasileira|brasileno|brasilena)\b/;
 const structuredBrazil=countryNames.some(value=>brazil.test(value)||value==="br"||value==="bra"||value.startsWith("br ")||value.startsWith("bra "));
 if(structuredBrazil||parts.some(value=>brazil.test(value)))parts.push("brasil brazil brazilian brasileiro brasileira br bra");
 for(const names of synonymGroups){
  if(parts.some(value=>names.some(name=>(" "+value+" ").includes(" "+name+" ")))){
   parts.push(names.join(" "));
  }
 }
 searchIndexCache.set(record,parts);
 return parts;
}
function matchesFreeSearch(record,rawTerm){
 const term=normalizeSearch(rawTerm);
 if(!term)return true;
 return searchableRecordParts(record).some(value=>(" "+value).includes(" "+term));
}

const safe=r=>r && typeof r==="object"&&!Array.isArray(r);
const inclusionDate=value=>{
 if(!value)return 0;
 if(typeof value.toMillis==="function")return value.toMillis();
 if(typeof value.seconds==="number")return value.seconds*1000;
 if(typeof value==="number")return value>1e11?value:value>1e9?value*1000:0;
 if(typeof value==="string"){const n=Date.parse(value);return Number.isFinite(n)?n:0;}
 return 0;
};
const newestFirst=rows=>[...rows].sort((a,b)=>{
 const fields=["created_at","createdAt","added_at","addedAt","ingested_at","ingestedAt","published_at","publishedAt","updated_at","updatedAt"];
 const when=r=>{for(const key of fields){const n=inclusionDate(r[key]);if(n)return n;}return 0;};
 return when(b)-when(a);
});
function textNode(tag,value,cls){const n=document.createElement(tag);n.textContent=value??"";if(cls)n.className=cls;return n;}
function coords(r){return Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)&&r.latitude>=-90&&r.latitude<=90&&r.longitude>=-180&&r.longitude<=180&&["address","municipality","state","country","regional"].includes(r.location_precision)?[r.latitude,r.longitude]:null;}
function options(filtered=dataset){
 for(const [id,key] of Object.entries(controls)){
  const element=el("explorer-"+id),old=element.value;
  let values=[...new Set(filtered.flatMap(r=>id==="species"?speciesValues(r):[r[key]]).filter(v=>typeof v==="string"&&v.trim()).map(v=>v.trim()))].sort((a,b)=>a.localeCompare(b));
  element.replaceChildren(new Option(trans[language].all,""));
  for(const value of values){const caption=(id==="status"||id==="product")?localizedField({[key]:value},key,language):value.replaceAll("_"," ");element.add(new Option(caption,value));}
  element.value=values.includes(old)?old:"";
 }
 refreshSpeciesPicker();
}

function refreshSpeciesPicker(){
 const select=el("explorer-species"),trigger=el("species-trigger"),menu=el("species-menu");
 if(!select||!trigger||!menu)return;
 const active=select.value,selected=select.options[select.selectedIndex];
 trigger.replaceChildren();
 if(active)trigger.append(appendScientificTerm(document.createElement("span"),selected?.textContent||active));
 else trigger.append(document.createTextNode(trans[language].all));
 menu.replaceChildren();
 for(const choice of select.options){
  const btn=document.createElement("button");btn.type="button";btn.role="option";
  btn.setAttribute("aria-selected",String(choice.value===active));
  if(choice.value)btn.append(appendScientificTerm(document.createElement("span"),choice.textContent));
  else btn.textContent=trans[language].all;
  btn.addEventListener("click",()=>{
    select.value=choice.value;menu.hidden=true;trigger.setAttribute("aria-expanded","false");
    refreshSpeciesPicker();select.dispatchEvent(new Event("change",{bubbles:true}));
    trigger.focus();
  });
  menu.append(btn);
 }
}
function setupSpeciesPicker(){
 const trigger=el("species-trigger"),menu=el("species-menu");
 if(!trigger||!menu||trigger.dataset.wired)return;
 trigger.dataset.wired="1";
 trigger.addEventListener("click",()=>{menu.hidden=!menu.hidden;trigger.setAttribute("aria-expanded",String(!menu.hidden));});
 trigger.addEventListener("keydown",event=>{
  if(event.key==="Escape"){menu.hidden=true;trigger.setAttribute("aria-expanded","false");}
  if(event.key==="ArrowDown"){event.preventDefault();menu.hidden=false;trigger.setAttribute("aria-expanded","true");menu.querySelector("button")?.focus();}
 });
 menu.addEventListener("keydown",event=>{
  if(event.key==="Escape"){menu.hidden=true;trigger.setAttribute("aria-expanded","false");trigger.focus();}
 });
 document.addEventListener("click",event=>{
  if(!event.target.closest(".species-filter")){menu.hidden=true;trigger.setAttribute("aria-expanded","false");}
 });
}
function selectedPeriod(){return el("explorer-period")?.value||"all";}
function periodMatches(r){return matchesPeriod(r,selectedPeriod(),el("explorer-year")?.value,el("explorer-date-from")?.value,el("explorer-date-to")?.value);}
function showPeriodDetails(){const p=selectedPeriod();for(const [id,visible] of [["explorer-year-wrap",p==="year"],["explorer-date-from-wrap",p==="custom"],["explorer-date-to-wrap",p==="custom"]]){const node=el(id);if(node)node.hidden=!visible;}}
function updatePeriodYears(){const select=el("explorer-year");if(!select)return;const old=select.value;const years=[...new Set(dataset.map(occurrenceOf).filter(Boolean).map(v=>v.year))].sort((a,b)=>b-a);select.replaceChildren(...years.map(y=>new Option(String(y),String(y))));if(years.length)select.value=years.includes(Number(old))?old:String(years[0]);}
function matchesOtherFilters(r){
 if(!matchesFreeSearch(r,el("explorer-search").value)||!periodMatches(r))return false;
 return Object.entries(controls).every(([id,key])=>!el("explorer-"+id).value||(id==="species"?speciesValues(r).includes(el("explorer-"+id).value):r[key]===el("explorer-"+id).value));
}
function matches(r){
 return activeLayers().has(r.layer_type||"advertisement")&&matchesOtherFilters(r);
}
function updateLayerCounts(){
 for(const layer of layerNames){
  const count=dataset.filter(r=>(r.layer_type||"advertisement")===layer&&matchesOtherFilters(r)&&coords(r)).length;
  const badge=document.querySelector('[data-layer-count="'+layer+'"]');
  if(badge){badge.textContent=String(count);badge.setAttribute("aria-label",String(count));}
 }
}
const faunaVocabulary={
 birds:{pt:"aves",en:"birds",es:"aves"}, "wildlife meat":{pt:"carne de fauna silvestre",en:"wildlife meat",es:"carne de fauna silvestre"},
 "animal parts":{pt:"partes de animais",en:"animal parts",es:"partes de animales"},
 reptiles:{pt:"répteis",en:"reptiles",es:"reptiles"}, birdsong:{pt:"aves canoras",en:"songbirds",es:"aves canoras"},
 "feathers":{pt:"penas",en:"feathers",es:"plumas"}, "arachnids":{pt:"aracnídeos",en:"arachnids",es:"arácnidos"},
 snakes:{pt:"serpentes",en:"snakes",es:"serpientes"}, "iguana":{pt:"iguana",en:"iguana",es:"iguana"},
 "axolotl":{pt:"axolote",en:"axolotl",es:"ajolote"}, "frog":{pt:"rã",en:"frog",es:"rana"},
 "fauna silvestre":{pt:"fauna silvestre",en:"wildlife",es:"fauna silvestre"},
 "aves silvestres":{pt:"aves silvestres",en:"wild birds",es:"aves silvestres"},
 "peixes ornamentais":{pt:"peixes ornamentais",en:"ornamental fish",es:"peces ornamentales"},
 "aves":{pt:"aves",en:"birds",es:"aves"},
 "mamíferos":{pt:"mamíferos",en:"mammals",es:"mamíferos"},
 "répteis":{pt:"répteis",en:"reptiles",es:"reptiles"},
 "primatas":{pt:"primatas",en:"primates",es:"primates"},
 "psitacídeos":{pt:"psitacídeos",en:"parrots and allies",es:"psitácidos"},
 "derivados de fauna":{pt:"derivados de fauna",en:"wildlife derivatives",es:"derivados de fauna"}
};
function translatedFaunaGroup(group){const term=String(group).trim();return faunaVocabulary[term.toLowerCase()]?.[language]||term;}
function keyAsScientific(label){return label===trans[language].species;}
function addField(wrap,label,value,url){if(value===null||value===undefined||value==="")return;const d=document.createElement("div");const content=keyAsScientific(label)?appendScientific(document.createElement("strong"),String(value),String(value)):textNode("strong",String(value));if(url){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.append(content);d.append(textNode("span",label),a);}else d.append(textNode("span",label),content);wrap.append(d);}
function closeMapCard(){
 activeId=null;activeGroupKey=null;
 const d=el("explorer-map-card");
 if(d){d.hidden=true;d.replaceChildren();}
 const legacy=el("explorer-detail");if(legacy)legacy.hidden=true;
}
function appendLegalCard(d,r){
 if(r.record_kind==="platform"||!r.scientific_name)return;
 if(!["national_red_list_status","national_red_list_listing_status","cites_appendix","cms_appendix","legal_trade_framework","cites_listing_status","cms_listing_status"].some(k=>r[k]))return;
 const tr={pt:["Proteção legal e restrições ao comércio","Lista nacional / ICMBio","Não verificado","Ponto da loja: não representa origem dos animais"],en:["Legal protection and trade restrictions","Brazilian national red list","Not verified","Store point: not the origin of animals"],es:["Protección legal y restricciones comerciales","Lista nacional de Brasil","No verificado","Punto comercial: no representa el origen de los animales"]}[language];
 const block=document.createElement("section");block.className="explorer-legal-context";block.append(textNode("h4",tr[0]));
 for(const [label,value] of [[tr[1],r.national_red_list_status],["CITES",r.cites_appendix],["CMS",r.cms_appendix]]){
  const row=document.createElement("p"),key=document.createElement("strong");key.textContent=label+": ";row.append(key,document.createTextNode((label===tr[1]&&r.national_red_list_listing_status==="not_listed"?({pt:"Não incluída na Lista Nacional",en:"Not listed on the Brazilian national list",es:"No incluida en la lista nacional brasileña"}[language]):value)||((label==="CITES"||label==="CMS")&&r[label==="CITES"?"cites_listing_status":"cms_listing_status"]==="not_listed"?({pt:"Não incluída nos apêndices de 2026",en:"Not listed in the 2026 appendices",es:"No incluida en los apéndices de 2026"}[language]):tr[2])));block.append(row);
 }
 if(language==="pt" && r.legal_trade_framework)block.append(textNode("p",r.legal_trade_framework));
 if(r["legal_note_"+language])block.append(textNode("p",r["legal_note_"+language]));
 for(const url of [r.national_red_list_source_url,r.legal_trade_source_url]){
  if(typeof url==="string"&&url.startsWith("https://")){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=tr[1]+" ↗";block.append(a,document.createTextNode(" "));}
 }
 d.append(block);
}
function aurumQuantityForDisplay(r){
 if(r.layer_type!=="aurum")return "";
 // Corrections explicitly confirmed in the source Integration sheet.
 const id=String(r.aurum_case_id||r.id||"").replace(/^(?:point-)?aurum-/,"");
 if(Object.prototype.hasOwnProperty.call(aurumQuantities,id)&&typeof aurumQuantities[id]==="string")return aurumQuantities[id];
 if(id==="PMP2026_1177")return "218kg";
 if(id==="PMP2026_421")return "18kg";
 if(id==="PMP2026_422")return "53kg";
 if(typeof r.aurum_display_quantity==="string"&&r.aurum_display_quantity.trim())return r.aurum_display_quantity.trim();
 const original=typeof r.aurum_n_seized_specimens==="string"?r.aurum_n_seized_specimens.trim():"";
 if(!original)return "";
 const numeric=original.match(/\d+(?:[.,]\d+)*/g)||[];
 if(numeric.length>1)return original;
 const kg=original.match(/^\s*(\d+(?:[.,]\d+)*)\s*(?:kg|kilograms?|quilogramas?)\b/i);
 if(kg)return kg[1]+"kg";
 const count=original.match(/^\s*(\d+(?:[.,]\d+)*)\b/);
 return count?count[1]:"";
}
function aurumContextWithQuantity(r,context){
 const quantity=aurumQuantityForDisplay(r);
 if(!quantity)return context;
 // Stop at the next structured field; decimal points within quantities are safe.
 return context.replace(/(Quantidade\/peso: |Quantity\/weight: |Cantidad\/peso: )[\s\S]*?(?=\. (?:Produto|Product|Producto):)/,(_,label)=>label+quantity);
}
function showDetail(r){
 activeId=r.id;
 const d=el("explorer-map-card");d.replaceChildren();
 d.dataset.recordId=r.id;
 const header=document.createElement("div");header.className="explorer-detail-head";
 const head=appendScientific(document.createElement("h3"),localizedTitle(r,language)||r.source||r.id,r.layer_type==="aurum"?(r.wildlife_group||r.scientific_name):r.scientific_name);
 head.id="explorer-map-card-title";
 header.append(head);
 const close=textNode("button","×","explorer-map-card-close");close.type="button";
 close.setAttribute("aria-label",trans[language].close);close.title=trans[language].close;
 close.addEventListener("click",closeMapCard);header.append(close);d.append(header);
 const category=trans[language].layerNames[r.layer_type||"advertisement"];
 if(category)d.append(textNode("div",category,"explorer-map-card-category"));
 if(activeGroupKey&&groupOfSelectedLocation().length>1){
  const back=textNode("button",coincidentLabels[language].back,"explorer-coincident-back");
  back.type="button";back.addEventListener("click",()=>showMarkerGroup(groupOfSelectedLocation()));
  d.append(back);
 }
 const info=document.createElement("div");info.className="explorer-detail-grid";
 const associated=[...(r.species_observed||[]),...(r.species_additional||[]),...(r.species_offered||[])];
 for(const [key,label] of [
   ["scientific_name",trans[language].species],
   ["source",trans[language].source],
   ["state",trans[language].state],
   ["municipality",trans[language].city],
   ["country",trans[language].country],
   ["product_type",trans[language].product],
   ...(r.layer_type==="aurum"?[["event_date",{pt:"Data da ocorrência",en:"Event date",es:"Fecha de ocurrencia"}[language]]]:[["status",trans[language].review]]),
   ["location_precision",trans[language].precision]
 ]){if(key==="scientific_name" && r.record_kind==="platform" && associated.length){addField(info,trans[language].species,({pt:"24 táxons associados",en:"24 associated taxa",es:"24 taxones asociados"}[language]).replace("24",String(new Set(associated).size)));continue;}addField(info,label,key==="scientific_name"&&r.layer_type==="aurum"?(r.wildlife_group||localizedField(r,key,language)):key==="source"&&r.layer_type==="aurum"?"Registros Aurum":localizedField(r,key,language),key==="source"&&r.layer_type==="aurum"?"https://aurum-wcs.streamlit.app/":undefined);}
 if(Number.isFinite(r.advertised_price)){
  try{addField(info,trans[language].price,new Intl.NumberFormat(language==="en"?"en-US":language==="es"?"es-ES":"pt-BR",{style:"currency",currency:r.currency||"BRL"}).format(r.advertised_price));}catch{}
 }
 if(Number.isFinite(r.advertised_quantity))addField(info,trans[language].quantity,r.advertised_quantity);
 d.append(info);
 const context=localizedDescription(r,language);
 if(context.text){
  d.append(textNode("h4",trans[language].observation));
  if(context.sourceLanguage!==language)d.append(textNode("small",trans[language].fallbackLabel+" ("+context.sourceLanguage.toUpperCase()+")"));
  const displayedContext=r.layer_type==="aurum"?aurumContextWithQuantity(r,context.text.replace(/\s*(?:Dados históricos da planilha; não equivalem a verificação independente da ocorrência\.|Historical spreadsheet data; not independently verified\.|Datos históricos de la hoja; sin verificación independiente\.)\s*$/,"")):context.text;
   d.append(appendScientific(document.createElement("p"),displayedContext,r.layer_type==="aurum"?(r.wildlife_group||r.scientific_name):r.scientific_name));
 }
 if(Array.isArray(r.species_observed)&&r.species_observed.length){const h={pt:"Espécies documentadas no perfil (não necessariamente oferecidas)",en:"Species documented on the profile (not necessarily offered)",es:"Especies documentadas en el perfil (no necesariamente ofrecidas)"}[language];d.append(textNode("h4",h));const p=document.createElement("p");r.species_observed.forEach((name,i)=>{if(i)p.append(document.createTextNode(", "));p.append(appendScientificTerm(document.createElement("span"),name));});d.append(p);}
 if(Array.isArray(r.species_additional)&&r.species_additional.length){const h={pt:"Outros táxons registrados",en:"Other recorded taxa",es:"Otros taxones registrados"}[language];d.append(textNode("h4",h));const p=document.createElement("p");r.species_additional.forEach((name,i)=>{if(i)p.append(document.createTextNode(", "));p.append(appendScientificTerm(document.createElement("span"),name));});d.append(p);}
 const externalLinks=document.createElement("div");externalLinks.className="explorer-external-links";if(r.social_profile_url&&/^https:\/\//.test(r.social_profile_url)){const a=textNode("a",r.social_handle||"Instagram");a.href=r.social_profile_url;a.target="_blank";a.rel="noopener noreferrer";externalLinks.append(a);}
 if(Array.isArray(r.fauna_groups)&&r.fauna_groups.length){d.append(textNode("h4",{pt:"Grupos de fauna documentados",en:"Documented fauna groups",es:"Grupos de fauna documentados"}[language]));d.append(textNode("p",r.fauna_groups.map(translatedFaunaGroup).join(" · ")));}
 appendLegalCard(d,r);
 if(["platform_store_municipality","platform_store_address"].includes(r.location_basis)){
  const labels={pt:"Localização aproximada da loja física; não indica origem ou localização dos exemplares.",en:"Approximate physical shop location; not the origin or location of specimens.",es:"Ubicación aproximada de la tienda física; no indica origen ni ubicación de ejemplares."};
  d.append(textNode("p",labels[language],"explorer-map-no-location"));
 }
 if(!coords(r))d.append(textNode("p",trans[language].unlocated,"explorer-map-no-location"));
 if(typeof r.source_url==="string"&&/^https:\/\/[^/]+/.test(r.source_url)){
  const link=textNode("a",trans[language].link+" ↗");link.href=r.source_url;link.target="_blank";link.rel="noopener noreferrer";externalLinks.append(link);
 }
 if(externalLinks.childElementCount)d.append(externalLinks);
 d.hidden=false;
}
function focusRecord(r,fromGroup=false){
 if(!fromGroup)activeGroupKey=null;
 showDetail(r);
 const location=coords(r);
 if(!location)return; // A worldwide directory or location-free listing must not move the map.
 const [lat,lng]=location;
 if(mapReady&&mapLoaded&&map){
  map.flyTo({center:[lng,lat],zoom:Math.max(map.getZoom(),7),speed:1.2,essential:true});
 }else if(fallbackLayer){
  fallbackCenter=[lng,lat];
  fallbackZoom=Math.max(fallbackZoom,7);
  renderRasterMarkers(dataset.filter(matches).filter(item=>coords(item)),false);
 }
}

const latLimit=latitude=>Math.max(-85.05112878,Math.min(85.05112878,latitude));
function projection(lon,lat,zoom){
 const scale=256*Math.pow(2,zoom),p=latLimit(lat)*Math.PI/180;
 return [((lon+180)/360)*scale,(1-Math.log(Math.tan(p)+1/Math.cos(p))/Math.PI)*scale/2];
}
function inverseProjection(x,y,zoom){
 const scale=256*Math.pow(2,zoom);
 const yy=Math.max(0,Math.min(scale,y)),n=Math.PI*(1-2*yy/scale);
 return [(x/scale*360-180+540)%360-180,Math.atan(Math.sinh(n))*180/Math.PI];
}
function initializeRasterFallback(){
 if(fallbackLayer)return;
 const host=el("explorer-map");host.replaceChildren();
 const layer=document.createElement("div");layer.className="nimf-raster-layer";
 const tiles=document.createElement("canvas");tiles.className="nimf-raster-tiles";tiles.setAttribute("aria-hidden","true");
 const pinsLayer=document.createElement("div");pinsLayer.className="nimf-raster-pins";
 const controls=document.createElement("div");controls.className="nimf-raster-controls";
 for(const [symbol,change] of [["+",1],["−",-1]]){
  const button=document.createElement("button");button.type="button";button.textContent=symbol;
  button.setAttribute("aria-label",change===1?"Ampliar mapa":"Reduzir mapa");
  button.addEventListener("click",()=>{
   fallbackZoom=Math.max(2,Math.min(11,fallbackZoom+change));
   renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),false);
  });
  controls.append(button);
 }
 const reset=document.createElement("button");reset.type="button";reset.textContent="◎";reset.id="nimf-map-reset";
 reset.addEventListener("click",()=>renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),true));
 controls.append(reset);
 const credit=textNode("div","© OpenStreetMap contributors","nimf-raster-attribution");
 const at=textNode("div","","nimf-raster-coordinates");
 layer.append(tiles,pinsLayer,controls,credit,at);host.append(layer);
 fallbackLayer=layer;fallbackTiles=tiles;fallbackPins=pinsLayer;
 host.dataset.activeEngine="raster";
 let gesture=null;
 layer.addEventListener("pointerdown",event=>{
  if(event.target.closest("button"))return;
  gesture={x:event.clientX,y:event.clientY,centre:projection(fallbackCenter[0],fallbackCenter[1],fallbackZoom)};
  layer.setPointerCapture(event.pointerId);
 });
 layer.addEventListener("pointermove",event=>{
  if(!gesture)return;
  const lonlat=inverseProjection(gesture.centre[0]-(event.clientX-gesture.x),gesture.centre[1]-(event.clientY-gesture.y),fallbackZoom);
  fallbackCenter=lonlat;renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),false);
 });
 const stop=()=>{gesture=null;};
 layer.addEventListener("pointerup",stop);layer.addEventListener("pointercancel",stop);
 layer.addEventListener("wheel",event=>{
  if(event.ctrlKey)return;event.preventDefault();
  fallbackZoom=Math.max(2,Math.min(11,fallbackZoom+(event.deltaY<0?1:-1)));
  renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),false);
 },{passive:false});
 if(typeof ResizeObserver!=="undefined"){
  const observer=new ResizeObserver(()=>{if(fallbackLayer)renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),false);});
  observer.observe(host);
 }
}

function drawRasterFrame(){
 if(!fallbackTiles||!rasterFrame)return;
 const {cells,width,height}=rasterFrame,ctx=fallbackTiles.getContext("2d");
 if(!ctx)return;
 const dpr=Math.min(2,window.devicePixelRatio||1);
 fallbackTiles.width=Math.round(width*dpr);fallbackTiles.height=Math.round(height*dpr);
 fallbackTiles.style.width=width+"px";fallbackTiles.style.height=height+"px";
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,width,height);
 ctx.fillStyle="#b9d8de";ctx.fillRect(0,0,width,height);
 let loaded=0;
 for(const cell of cells){
  let entry=rasterCache.get(cell.key);
  if(!entry){
   const image=new Image();image.decoding="async";
   entry={image,ready:false,failed:false};
   rasterCache.set(cell.key,entry);
   // Keep cache bounded for extended browsing sessions.
   if(rasterCache.size>240)rasterCache.delete(rasterCache.keys().next().value);
   image.onload=()=>{entry.ready=true;if(fallbackLayer && fallbackLayer.style.display!=="none")drawRasterFrame();};
   image.onerror=()=>{entry.failed=true;if(fallbackLayer && fallbackLayer.style.display!=="none")drawRasterFrame();};
   image.src="https://tile.openstreetmap.org/"+cell.key+".png";
  }
  if(entry.ready){loaded++;ctx.drawImage(entry.image,Math.round(cell.left),Math.round(cell.top),257,257);}
  else{ctx.fillStyle="#e5e7e0";ctx.fillRect(cell.left,cell.top,256,256);}
 }
 el("explorer-map").dataset.loadedTiles=String(loaded);
}
// Fit the actual filtered geographic extent, not a fixed global zoom.
 // The widest longitude gap is excluded so locations near the antimeridian
 // remain grouped rather than centring the map on the other hemisphere.
function filteredExtent(rows,width,height){
 if(!rows.length)return null;
 if(rows.length===1)return {center:[rows[0].longitude,rows[0].latitude],zoom:7};
 const longitudes=rows.map(r=>(r.longitude+180+360)%360/360).sort((a,b)=>a-b);
 let gap=-1,startIndex=0;
 for(let i=0;i<longitudes.length;i++){
  const next=i===longitudes.length-1?longitudes[0]+1:longitudes[i+1];
  const currentGap=next-longitudes[i];
  if(currentGap>gap){gap=currentGap;startIndex=(i+1)%longitudes.length;}
 }
 const start=longitudes[startIndex],span=1-gap,centreX=(start+span/2)%1;
 const centreLongitude=centreX*360-180;
 const normalizedY=rows.map(r=>projection(0,latLimit(r.latitude),0)[1]/256);
 const top=Math.min(...normalizedY),bottom=Math.max(...normalizedY);
 const centreLatitude=inverseProjection(centreX*256,((top+bottom)/2)*256,0)[1];
 const padding=76;
 let zoom=2;
 for(let z=8;z>=2;z--){
  const scale=256*(2**z);
  if(span*scale<=Math.max(120,width-2*padding)&&
     (bottom-top)*scale<=Math.max(120,height-2*padding)){
   zoom=z;break;
  }
 }
 return {center:[centreLongitude,centreLatitude],zoom};
}
function markerGroupKey(r){
 const point=coords(r);
 return point?point.map(v=>v.toFixed(5)).join(":"):null;
}
function markerGroups(rows){
 const groups=new Map();
 for(const r of rows){
  const key=markerGroupKey(r);
  if(!key)continue;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(r);
 }
 return [...groups.values()];
}
const coincidentLabels={
 pt:{heading:"Casos nesta região",back:"Voltar à lista de casos",count:"casos neste ponto"},
 en:{heading:"Cases at this location",back:"Back to case list",count:"cases at this point"},
 es:{heading:"Casos en esta región",back:"Volver a la lista de casos",count:"casos en este punto"}
};
function showMarkerGroup(items){
 if(!items.length)return;
 if(items.length===1){focusRecord(items[0]);return;}
 activeId=null;activeGroupKey=markerGroupKey(items[0]);
 const d=el("explorer-map-card");
 d.replaceChildren();delete d.dataset.recordId;
 const header=document.createElement("div");header.className="explorer-detail-head";
 const heading=textNode("h3",coincidentLabels[language].heading+" ("+items.length+")");
 heading.id="explorer-map-card-title";
 const close=textNode("button","×","explorer-map-card-close");close.type="button";
 close.setAttribute("aria-label",trans[language].close);close.title=trans[language].close;
 close.addEventListener("click",closeMapCard);
 header.append(heading,close);d.append(header);
 const list=document.createElement("div");list.className="explorer-coincident-list";
 for(const record of items){
  const item=document.createElement("button");item.type="button";item.className="explorer-coincident-item";
  item.append(appendScientific(document.createElement("strong"),localizedTitle(record,language)||record.id,record.layer_type==="aurum"?(record.wildlife_group||record.scientific_name):record.scientific_name));
  const detail=[trans[language].layerNames[record.layer_type||"advertisement"],record.municipality||record.state||record.country,record.layer_type==="aurum"?record.event_date:""].filter(Boolean).join(" · ");
  if(detail)item.append(textNode("small",detail));
  item.addEventListener("click",()=>focusRecord(record,true));
  list.append(item);
 }
 d.append(list);d.hidden=false;
}
function groupOfSelectedLocation(){
 if(!activeGroupKey)return [];
 return markerGroups(dataset.filter(matches).filter(r=>coords(r))).find(items=>markerGroupKey(items[0])===activeGroupKey)||[];
}
function renderRasterMarkers(rows,fit=false){
 if(!fallbackLayer)return;
 const host=el("explorer-map"),width=Math.max(320,host.clientWidth),height=Math.max(420,host.clientHeight);
 if(fit && rows.length){
  const viewport=filteredExtent(rows,width,height);
  fallbackCenter=viewport.center;fallbackZoom=viewport.zoom;
 }
 const maxTile=2**fallbackZoom,scale=256*maxTile;
 const [cx,cy]=projection(fallbackCenter[0],fallbackCenter[1],fallbackZoom),left=cx-width/2,top=cy-height/2;
 const startX=Math.floor(left/256),endX=Math.ceil((left+width)/256),startY=Math.floor(top/256),endY=Math.ceil((top+height)/256);

 const cells=[];
 for(let y=startY;y<endY;y++){
  if(y<0||y>=maxTile)continue;
  for(let x=startX;x<endX;x++){
   cells.push({key:fallbackZoom+"/"+((x%maxTile+maxTile)%maxTile)+"/"+y,
     left:x*256-left,top:y*256-top});
  }
 }
 rasterFrame={cells,width,height};
 drawRasterFrame();
 fallbackPins.replaceChildren();
 for(const group of markerGroups(rows)){
  const r=group[0],multiple=group.length>1;
  const [px,py]=projection(r.longitude,r.latitude,fallbackZoom);
  let sx=px-left;const dx=sx-width/2;
  if(dx>scale/2)sx-=scale;
  if(dx<-scale/2)sx+=scale;
  const sy=py-top;
  if(sx < -20 || sx>width+20 || sy< -20 || sy>height+20)continue;
  const pin=document.createElement("button");pin.type="button";pin.className="nimf-raster-pin";
  pin.style.left=sx+"px";pin.style.top=sy+"px";
  pin.title=multiple?group.length+" "+coincidentLabels[language].count:[r.scientific_name||localizedTitle(r,language),r.municipality||r.state].filter(Boolean).join(" · ");
  pin.setAttribute("aria-label",pin.title);
  pin.dataset.layer=multiple&&new Set(group.map(item=>item.layer_type)).size>1?"group":r.layer_type||"advertisement";
  if(multiple){pin.dataset.groupSize=String(group.length);pin.textContent=String(group.length);}
  pin.addEventListener("click",()=>multiple?showMarkerGroup(group):focusRecord(r));fallbackPins.append(pin);
 }
 fallbackLayer.querySelector(".nimf-raster-coordinates").textContent=fallbackCenter[1].toFixed(2)+"°, "+fallbackCenter[0].toFixed(2)+"° · Z"+fallbackZoom;
 host.dataset.centerLongitude=String(fallbackCenter[0]);host.dataset.centerLatitude=String(fallbackCenter[1]);
 host.dataset.zoom=String(fallbackZoom);
 host.dataset.centerTile=fallbackZoom+"/"+Math.floor(cx/256)+"/"+Math.floor(cy/256);
 host.dataset.tileCount=String(cells.length);
 host.dataset.mappedCount=String(rows.length);
}
function mapStyleUrl(){return "https://basemaps.cartocdn.com/gl/"+(mapColorMode==="dark"?"dark-matter":"positron")+"-gl-style/style.json";}
function updateMapThemeButton(){
 const labels={pt:{dark:"Escuro",light:"Claro",name:"Cor do mapa"},en:{dark:"Dark",light:"White",name:"Map color"},es:{dark:"Oscuro",light:"Claro",name:"Color del mapa"}}[language];
 const group=el("map-color-switch");if(group)group.setAttribute("aria-label",labels.name);
 for(const [id,mode] of [["map-color-dark","dark"],["map-color-light","light"]]){
  const button=el(id);if(button){button.textContent=labels[mode];button.setAttribute("aria-pressed",String(mapColorMode===mode));button.classList.toggle("is-active",mapColorMode===mode);}
 }
 const host=el("explorer-map");if(host)host.dataset.mapColor=mapColorMode;
}
function setMapColorMode(color){
 if(color!=="dark"&&color!=="light")return;
 mapColorMode=color;updateMapThemeButton();
 if(mapReady&&mapLoaded&&map){
  try{map.setStyle(mapStyleUrl(),{diff:false});}
  catch(e){try{map.setStyle({version:8,sources:{basemap:{type:"raster",tiles:["https://basemaps.cartocdn.com/"+(color==="light"?"light_all":"dark_all")+"/{z}/{x}/{y}.png"],tileSize:256}},layers:[{id:"safe-raster",type:"raster",source:"basemap"}]});}catch(ignore){}}
 }
 if(fallbackLayer)fallbackLayer.dataset.mapColor=color;
}
for(const [id,mode] of [["map-color-dark","dark"],["map-color-light","light"]])el(id)?.addEventListener("click",()=>setMapColorMode(mode));
function setupMap(){
 if(!fallbackLayer)initializeRasterFallback();
 if(mapReady||mapAttempted||!window.maplibregl)return;
 if(typeof window.maplibregl.supported==="function"&&!window.maplibregl.supported()){el("explorer-map").dataset.mapError="webgl-unavailable";return;}
 mapAttempted=true;
 const host=el("explorer-map"),glHost=document.createElement("div");
 glHost.className="nimf-gl-map";glHost.style.opacity="0";glHost.setAttribute("aria-hidden","true");
 host.append(glHost);
 let loadTimedOut=false;
 let alternateStyleAttempted=false;
 const fallbackWebglStyle=color=>({version:8,sources:{basemap:{type:"raster",tiles:["https://basemaps.cartocdn.com/"+(color==="light"?"light_all":"dark_all")+"/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors © CARTO"}},layers:[{id:"safe-raster",type:"raster",source:"basemap"}]});
 const fail=()=>{
  if(mapLoaded || loadTimedOut)return;
  loadTimedOut=true;
  if(map){try{map.remove();}catch(e){}map=null;}
  glHost.remove();fallbackLayer.style.display="";
  el("explorer-map").dataset.activeEngine="raster";el("explorer-map").dataset.mapError="webgl-load-failed";
  renderRasterMarkers(dataset.filter(matches).filter(r=>coords(r)),true);
 };
 try{
  map=new window.maplibregl.Map({
   container:glHost,
   style:mapStyleUrl(),
   center:[fallbackCenter[0],fallbackCenter[1]],zoom:fallbackZoom,
   attributionControl:true,cooperativeGestures:true,projection:{type:projectionMode==="globe"?"globe":"mercator"}
  });
  map.addControl(new window.maplibregl.NavigationControl({showCompass:true,showZoom:true}),"bottom-right");
  map.on("move",updateGlobeMarkerVisibility);
  map.on("rotate",updateGlobeMarkerVisibility);
  map.on("pitch",updateGlobeMarkerVisibility);
  map.on("load",()=>{
   if(loadTimedOut)return;
   mapLoaded=true;mapReady=true;
   applyProjection(false);
   el("explorer-map").dataset.mapError="";
   // The user may filter while the WebGL engine loads. Always use the current
   // filtered results rather than the initial global camera.
   map.resize();
   drawMarkers(dataset.filter(matches).filter(r=>coords(r)),true);
   requestAnimationFrame(()=>{
    if(!mapReady||!mapLoaded||loadTimedOut)return;
    map.resize();
    drawMarkers(dataset.filter(matches).filter(r=>coords(r)),true);
    glHost.style.opacity="1";glHost.removeAttribute("aria-hidden");
    fallbackLayer.style.display="none";
    el("explorer-map").dataset.activeEngine="maplibre";
   });
  });
  map.on("error",()=>{
   if(mapLoaded||loadTimedOut)return;
   if(!alternateStyleAttempted){alternateStyleAttempted=true;try{map.setStyle(fallbackWebglStyle(mapColorMode));return;}catch(e){}}
   fail();
  });
  setTimeout(()=>{if(!mapLoaded)fail();},10000);
 }catch(e){fail();}
}
function syncToolbarProjection(){
 for(const [id,mode] of [["map-toolbar-mode-map","map"],["map-toolbar-mode-globe","globe"]]){const button=el(id);if(button){button.classList.toggle("is-active",projectionMode===mode);button.setAttribute("aria-pressed",String(projectionMode===mode));}}
}
function applyProjection(fit=true){
 const mapButton=el("explorer-mode-map"),globeButton=el("explorer-mode-globe");
 if(mapButton){mapButton.classList.toggle("is-active",projectionMode==="map");mapButton.setAttribute("aria-pressed",String(projectionMode==="map"));}
 if(globeButton){globeButton.classList.toggle("is-active",projectionMode==="globe");globeButton.setAttribute("aria-pressed",String(projectionMode==="globe"));}
 syncToolbarProjection();
 const host=el("explorer-map");host.dataset.projectionMode=projectionMode;
 if(mapReady&&mapLoaded&&map){
  try{map.setProjection({type:projectionMode==="globe"?"globe":"mercator"});host.dataset.projectionApplied=projectionMode;}catch(error){
   host.dataset.mapError="projection-not-supported";
   if(projectionMode==="globe"){projectionMode="map";applyProjection(false);}
  }
  if(fit)drawMarkers(dataset.filter(matches).filter(r=>coords(r)),true);
  updateGlobeMarkerVisibility();
  requestAnimationFrame(()=>map.resize());
 }
}
function setProjectionMode(mode){
 if(mode!=="map"&&mode!=="globe")return;
 projectionMode=mode;applyProjection(true);
 if(!mapReady&&window.maplibregl&&!mapAttempted)setupMap();
 if(!mapReady&&mode==="globe"){
  const notice=el("explorer-map-notice");
  if(notice)notice.textContent={pt:"GLOBE requer WebGL. MAP 2D permanece disponível enquanto o mapa 3D carrega ou caso o navegador não ofereça suporte.",en:"GLOBE requires WebGL. MAP 2D remains available while 3D loads or if the browser cannot support it.",es:"GLOBE requiere WebGL. MAP 2D sigue disponible mientras carga el mapa 3D o si el navegador no lo admite."}[language];
 }
}
for(const [id,mode] of [["explorer-mode-map","map"],["explorer-mode-globe","globe"]]){
 const button=el(id);if(button)button.addEventListener("click",()=>setProjectionMode(mode));
}
for(const [id,mode] of [["map-toolbar-mode-map","map"],["map-toolbar-mode-globe","globe"]]){
 const button=el(id);if(button)button.addEventListener("click",()=>setProjectionMode(mode));
}
function updateGlobeMarkerVisibility(){
 if(!map||!mapReady||!mapLoaded)return;
 const globe=projectionMode==="globe";
 const center=map.getCenter();
 const latitude=center.lat*Math.PI/180,longitude=center.lng*Math.PI/180;
 const cosLat=Math.cos(latitude),sinLat=Math.sin(latitude);
 for(const marker of pins){
  const elem=marker.getElement();
  if(!globe){elem.style.visibility="visible";elem.style.pointerEvents="auto";continue;}
  const pos=marker.getLngLat(),lat=pos.lat*Math.PI/180,dlon=(pos.lng-center.lng)*Math.PI/180;
  const facing=sinLat*Math.sin(lat)+cosLat*Math.cos(lat)*Math.cos(dlon);
  const visible=facing>0.005;
  elem.style.visibility=visible?"visible":"hidden";
  elem.style.pointerEvents=visible?"auto":"none";
  elem.setAttribute("aria-hidden",String(!visible));
 }
}
function drawMarkers(rows,fit=false){
 if(!mapReady||!mapLoaded)return;
 for(const p of pins)p.remove();pins=[];
 const bounds=new window.maplibregl.LngLatBounds();
 for(const group of markerGroups(rows)){
  const r=group[0],multiple=group.length>1;
  const [lat,lng]=coords(r);
  const dot=document.createElement("button");dot.type="button";dot.className="nimf-map-dot";
  dot.title=multiple?group.length+" "+coincidentLabels[language].count:[r.scientific_name||localizedTitle(r,language),r.municipality||r.state].filter(Boolean).join(" · ");
  dot.setAttribute("aria-label",dot.title);
  dot.dataset.layer=multiple&&new Set(group.map(item=>item.layer_type)).size>1?"group":r.layer_type||"advertisement";
  if(multiple){dot.dataset.groupSize=String(group.length);dot.textContent=String(group.length);}
  dot.style.cssText="border-radius:100%;width:12px;height:12px;cursor:pointer;box-shadow:0 1px 9px #0006";
  dot.addEventListener("click",()=>multiple?showMarkerGroup(group):focusRecord(r));
  pins.push(new window.maplibregl.Marker({element:dot}).setLngLat([lng,lat]).addTo(map));bounds.extend([lng,lat]);
 }
 if(fit && rows.length===1){map.stop();map.jumpTo({center:bounds.getCenter(),zoom:7});}
 else if(fit && rows.length>1){map.stop();map.fitBounds(bounds,{padding:75,maxZoom:8,duration:0});}
 // Record the actual on-screen camera for functional verification.
 const mapHost=el("explorer-map"),center=map.getCenter();
 mapHost.dataset.centerLongitude=String(center.lng);
 mapHost.dataset.centerLatitude=String(center.lat);
 mapHost.dataset.zoom=String(map.getZoom());
 mapHost.dataset.mappedCount=String(rows.length);
 // With zero mappable records, remove the pins without moving to a fake area.
 updateGlobeMarkerVisibility();
 requestAnimationFrame(()=>map.resize());
}
function render(fitMap=false){
 const f=newestFirst(dataset.filter(matches)),m=f.filter(r=>coords(r)),T=trans[language];
 const viewKey=viewportSignature({search:el("explorer-search").value,filters:[...Object.keys(controls).map(id=>el("explorer-"+id).value),selectedPeriod(),el("explorer-year").value,el("explorer-date-from").value,el("explorer-date-to").value],layers:[...activeLayers()],locations:m});
 const fitNow=needsViewportFit(fitMap,lastViewportSignature,viewKey);
 lastViewportSignature=viewKey;
 updateLayerCounts();
 el("explorer-map").dataset.visibleMarkerCount=String(m.length);
 el("explorer-count").textContent=String(f.length);
 const counter=el("map-filter-results-count");if(counter)counter.textContent=f.length+" "+T.searchCount;
 el("explorer-map-count").textContent=m.length+" "+T.map;
 el("explorer-export-csv").disabled=f.length===0;
 el("explorer-unmapped-count").textContent=(f.length-m.length)+" "+T.unmapped;
 const list=el("explorer-cards");list.replaceChildren();
 if(!f.length)list.append(textNode("p",T.empty,"secure-small"));
 for(const r of f){
   const card=document.createElement("button");card.type="button";card.className="explorer-card";
   card.append(appendScientific(document.createElement("strong"),localizedTitle(r,language)||r.id,r.layer_type==="aurum"?(r.wildlife_group||r.scientific_name):r.scientific_name),textNode("span",[r.municipality,r.state].filter(Boolean).join(", ")||r.country||""),textNode("small",[trans[language].layerNames[r.layer_type||"advertisement"],r.layer_type==="aurum"?"Registros Aurum":r.source,r.layer_type==="aurum"?r.event_date:localizedField(r,"status",language)].filter(Boolean).join(" · ")),textNode("em",T.more+" →"));
   card.addEventListener("click",()=>focusRecord(r));
   list.append(card);
 }
 if(activeId&&!f.some(r=>r.id===activeId)){closeMapCard();}
 if(activeId){const item=f.find(r=>r.id===activeId);if(item)showDetail(item);}
 else if(activeGroupKey){const group=markerGroups(m).find(items=>markerGroupKey(items[0])===activeGroupKey);if(group&&group.length>1)showMarkerGroup(group);else closeMapCard();}
 setupMap();
 if(fallbackLayer)renderRasterMarkers(m,fitNow);
 if(mapReady)drawMarkers(m,fitNow);
}
export function initExplorer(rows,lang="pt"){
 language=trans[lang]?lang:"pt";
 canonicalRecords=(Array.isArray(rows)?rows:[]).filter(safe).map((r,i)=>({...r,id:r.id||r.record_id||String(i)}));rebuildDataset();
 for(const id of Object.keys(controls))el("explorer-"+id).value="";
 el("explorer-search").value="";closeMapCard();
 setupSpeciesPicker();updatePeriodYears();showPeriodDetails();options();setExplorerLanguage(language);render(true);
}
export function setMapPoints(rows,quantityIndex){
 if(quantityIndex&&typeof quantityIndex==="object"&&!Array.isArray(quantityIndex))aurumQuantities=quantityIndex;
 if((Array.isArray(rows)?rows:[]).some(r=>r.layer_type==="aurum"))void loadAurumGeography();
 reviewedPoints=(Array.isArray(rows)?rows:[]).filter(safe).filter(r=>r.published===true);
 rebuildDataset();updatePeriodYears();options();render(true);
}
export function setExplorerLanguage(lang){
 language=trans[lang]?lang:"pt";const t=trans[language];rebuildDataset();updateMapThemeButton();
 const p=periodLabels[language],select=el("explorer-period");
 if(select){
  el("explorer-period-label").textContent=p.period;
  [p.all,p.d7,p.d30,p.d90,p.d365,p.year,p.custom,p.undated].forEach((value,i)=>{if(select.options[i])select.options[i].textContent=value;});
  el("explorer-year-label").textContent=p.yearLabel;
  el("explorer-date-from-label").textContent=p.from;
  el("explorer-date-to-label").textContent=p.to;
 }
 const exportButton=el("explorer-export-csv");
 if(exportButton){exportButton.textContent=p.export;exportButton.title=p.title;exportButton.setAttribute("aria-label",p.title);}
 el("layers-title").textContent=t.layersHeading;
 el("layers-toggle-label").textContent=t.layers;
 el("layers-hint").textContent=t.layersHint;
 el("layers-legend").textContent=t.layersLegend;
 el("layers-safety").textContent=t.layersSafety;
 el("layers-close").setAttribute("aria-label",t.layersClose);
 el("layers-close").title=t.layersClose;
 for(const el of document.querySelectorAll("[data-layer-title]"))el.textContent=t.layerNames[el.dataset.layerTitle];
 const expanded=el("explorer-map-wrap")?.classList.contains("is-fullscreen")||document.querySelector(".explorer-map-wrap")?.classList.contains("is-fullscreen");
 el("explorer-fullscreen").textContent=expanded?t.exitFullscreen:t.fullscreen;
 syncToolbarFullscreen(expanded);syncToolbarProjection();
 el("explorer-search").placeholder=t.searchRecordsPlaceholder;
 el("explorer-search-label").textContent=t.searchBox;
 el("explorer-map").setAttribute("aria-label",t.title);
 el("explorer-reset").setAttribute("aria-label",t.reset);
 const reset=el("nimf-map-reset");if(reset){reset.setAttribute("aria-label",t.resetMap);reset.title=t.resetMap;}
 for(const [id,key] of Object.entries({kicker:"k",title:"title",desc:"desc",reset:"reset","search-label":"search","species-label":"species","state-label":"state","city-label":"city","source-label":"source","status-label":"status","product-label":"product","count-label":"matches","results-title":"results","map-notice":"notice"})){const target=el("explorer-"+id);if(target)target.textContent=t[key];}
 options();render();
}
export function clearExplorer(){
 dataset=[];canonicalRecords=[];reviewedPoints=[];aurumQuantities=Object.create(null);lastViewportSignature=null;closeMapCard();setLayersPanel(false);if(document.querySelector(".explorer-map-wrap.is-fullscreen"))toggleFullScreen(false);el("explorer-cards").replaceChildren();for(const pin of pins)pin.remove();pins=[];if(fallbackPins)fallbackPins.replaceChildren();
}
function resizeDisplayedMap(){
 const visible=dataset.filter(matches).filter(r=>coords(r));
 if(fallbackLayer)renderRasterMarkers(visible,false);
 if(mapReady)requestAnimationFrame(()=>map.resize());
}
function syncToolbarFullscreen(expanded){
 const button=el("map-toolbar-fullscreen"),label=el("map-toolbar-fullscreen-label");
 if(button)button.setAttribute("aria-pressed",String(expanded));
 if(label)label.textContent=expanded?trans[language].exitFullscreen:trans[language].fullscreen;
}
function toggleFullScreen(force){
 const wrap=document.querySelector(".explorer-map-wrap");
 const expanded=force===undefined?!wrap.classList.contains("is-fullscreen"):!!force;
 wrap.classList.toggle("is-fullscreen",expanded);
 document.body.classList.toggle("nimf-map-fullscreen",expanded);
 el("explorer-fullscreen").setAttribute("aria-pressed",String(expanded));
 el("explorer-fullscreen").textContent=expanded?trans[language].exitFullscreen:trans[language].fullscreen;
 syncToolbarFullscreen(expanded);
 requestAnimationFrame(()=>{resizeDisplayedMap();setTimeout(resizeDisplayedMap,120);});
}
el("explorer-fullscreen").addEventListener("click",()=>toggleFullScreen());
el("map-toolbar-fullscreen")?.addEventListener("click",()=>toggleFullScreen());
function setLayersPanel(open){
 const panel=el("explorer-layers"),toggle=el("layers-toggle");
 panel.classList.toggle("open",open);
 panel.setAttribute("aria-hidden",String(!open));
 panel.inert=!open;
 toggle.setAttribute("aria-expanded",String(open));
 if(open)el("layers-close").focus();
 else if(panel.contains(document.activeElement))toggle.focus();
}
el("layers-toggle").addEventListener("click",()=>setLayersPanel(!el("explorer-layers").classList.contains("open")));
el("layers-close").addEventListener("click",()=>setLayersPanel(false));
document.addEventListener("keydown",ev=>{
 if(ev.key!=="Escape")return;
 if(el("explorer-layers").classList.contains("open")){ev.stopPropagation();setLayersPanel(false);return;}
 if(document.querySelector(".explorer-map-wrap.is-fullscreen"))toggleFullScreen(false);
});
for(const input of document.querySelectorAll("#explorer-layers input"))input.addEventListener("change",()=>{
 // Update pins, visible results and automatic camera together.
 render(true);
});
for(const id of Object.keys(controls))el("explorer-"+id).addEventListener("change",()=>render(true));
el("explorer-search").addEventListener("input",()=>render(true));
el("explorer-reset").addEventListener("click",()=>{el("explorer-search").value="";for(const id of Object.keys(controls))el("explorer-"+id).value="";el("explorer-period").value="all";el("explorer-date-from").value="";el("explorer-date-to").value="";showPeriodDetails();render(true);});

function exportFilteredCsv(){
 const rows=newestFirst(dataset.filter(matches));
 if(!rows.length)return;
 // Export only already-authorized visible records, never raw Firestore/admin objects.
 const columns=[
  {label:"ID",value:r=>r.aurum_case_id||r.id},
  {label:"Camada",value:r=>r.layer_type||"advertisement"},
  {label:"Título",value:r=>localizedTitle(r,language)||r.title||""},
  {label:"Data da ocorrência",value:r=>r.event_date||r.occurrence_date||r.date_of_occurrence||r.seizure_date||r.incident_date||r.observation_date||r.date||r.event_year||r.aurum_original_year||""},
  {label:"Ano da ocorrência",value:r=>occurrenceOf(r)?.year||""},
  {label:"Espécie / grupo de fauna",value:r=>r.wildlife_group||r.scientific_name||""},
  {label:"Quantidade/peso",value:r=>r.layer_type==="aurum"?aurumQuantityForDisplay(r):Number.isFinite(r.advertised_quantity)?r.advertised_quantity:""},
  {label:"Produto",value:r=>r.layer_type==="aurum"?(r.aurum_original_product||String(r.description_pt||"").match(/(?:^|\. )Produto: (.*?)(?:\. Situação original:|$)/)?.[1]||""):r.product_type||""},
  {label:"País",value:r=>r.country},
  {label:"Estado / região",value:r=>r.state},
  {label:"Município",value:r=>r.municipality},
  {label:"Latitude aproximada",value:r=>coords(r)?r.latitude:""},
  {label:"Longitude aproximada",value:r=>coords(r)?r.longitude:""},
  {label:"Precisão geográfica",value:r=>r.location_precision},
  {label:"Fonte",value:r=>r.layer_type==="aurum"?"Registros Aurum":r.source||""},
  {label:"Link de referência",value:r=>r.source_url||""},
  {label:"Contexto PT",value:r=>r.layer_type==="aurum"?aurumContextWithQuantity(r,r.description_pt||""):r.description_pt||""},
  {label:"Contexto EN",value:r=>r.layer_type==="aurum"?aurumContextWithQuantity(r,r.description_en||""):r.description_en||""},
  {label:"Contexto ES",value:r=>r.layer_type==="aurum"?aurumContextWithQuantity(r,r.description_es||""):r.description_es||""}
 ];
 const csv=csvText(rows,columns);
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),anchor=document.createElement("a");
 const now=new Date(),day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 anchor.href=url;anchor.download="area-restrita-registros-filtrados-"+day+".csv";
 anchor.style.display="none";document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
el("explorer-export-csv").addEventListener("click",exportFilteredCsv);
el("explorer-period").addEventListener("change",()=>{showPeriodDetails();render(true);});
for(const id of ["explorer-year","explorer-date-from","explorer-date-to"])el(id).addEventListener("change",()=>render(true));


import {collection,query,where,limit,onSnapshot,addDoc,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {useLang,localizedTitle} from "./record-locale.js";
let db=null,currentUser=null,isAdmin=false,unsubscribe=null,items=[],selectedId=null,language="pt",onPoints=null,installed=false;
const $=id=>document.getElementById(id);
const layers=["advertisement","platform","fair","physical_market"];
const vocab={
pt:{title:"Cadastro administrativo de camadas",help:"Registre apenas locais aproximados e evidências corroboradas para publicação. Não inclua nomes de pessoas, endereços privados nem acusações não verificadas.",layer:"Camada",name:"Título genérico, sem identificar pessoas",species:"Espécie (se conhecida)",country:"País",state:"Estado / região",city:"Município",lat:"Latitude aproximada",lon:"Longitude aproximada",precision:"Precisão espacial",evidence:"Evidência",url:"Link de referência (opcional)",published:"Visibilidade",notes:"Contexto técnico, sem dados pessoais",save:"Salvar ponto",cancel:"Cancelar edição",draft:"Rascunho, somente administrador",public:"Publicado para autorizados",verified:"Corroborada",reported:"Relato não confirmado",error:"Não foi possível salvar. Verifique campos, evidências e regras do Firestore.",success:"Ponto salvo para revisão/publicação.",noItems:"Nenhum ponto administrativo cadastrado.",edit:"Editar",mustReview:"A publicação requer evidência corroborada.",noPerson:"Evite nomes de pessoas e locais residenciais. Utilize apenas o centro aproximado do município.",layerOptions:["Anúncios","Plataformas","Feiras livres","Comércio presencial sob investigação","Aurum"]},
en:{title:"Administrator layer registry",help:"Publish only corroborated evidence at approximate locations. Do not include names, private addresses or unverified allegations.",layer:"Layer",name:"Generic title, without identifying people",species:"Species (if known)",country:"Country",state:"State / region",city:"Municipality",lat:"Approximate latitude",lon:"Approximate longitude",precision:"Spatial precision",evidence:"Evidence",url:"Reference link (optional)",published:"Visibility",notes:"Technical context without personal information",save:"Save point",cancel:"Cancel edit",draft:"Draft, administrators only",public:"Published to approved users",verified:"Corroborated",reported:"Unconfirmed report",error:"Could not save. Check fields, evidence and Firestore rules.",success:"Map point saved for review/publication.",noItems:"No administrative points yet.",edit:"Edit",mustReview:"Publication requires corroborated evidence.",noPerson:"Do not include names or private residences; use approximate municipality centres only.",layerOptions:["Listings","Platforms","Open-air markets","Physical trade under investigation","Aurum"]},
es:{title:"Registro administrativo de capas",help:"Publique solo pruebas corroboradas y ubicaciones aproximadas. No incluya nombres, direcciones privadas ni acusaciones sin verificar.",layer:"Capa",name:"Título genérico sin identificar personas",species:"Especie (si se conoce)",country:"País",state:"Estado / región",city:"Municipio",lat:"Latitud aproximada",lon:"Longitud aproximada",precision:"Precisión espacial",evidence:"Evidencia",url:"Enlace de referencia (opcional)",published:"Visibilidad",notes:"Contexto técnico sin datos personales",save:"Guardar punto",cancel:"Cancelar edición",draft:"Borrador, solo administradores",public:"Publicado para autorizados",verified:"Corroborada",reported:"Reporte no confirmado",error:"No se pudo guardar. Compruebe los campos, las pruebas y las reglas de Firestore.",success:"Punto guardado para revisión/publicación.",noItems:"Sin puntos administrativos.",edit:"Editar",mustReview:"La publicación requiere evidencia corroborada.",noPerson:"Evite nombres o residencias privadas; utilice centros aproximados del municipio.",layerOptions:["Anuncios","Plataformas","Ferias libres","Comercio presencial bajo investigación","Aurum"]}
};
const T=()=>vocab[language],text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value??"";return n;};
const https=value=>{if(!value)return true;try{const u=new URL(value);return u.protocol==="https:"&&!/\s/.test(value);}catch{return false;}};
function setMessage(value){$("admin-map-feedback").textContent=value||"";}
function resetForm(){
 selectedId=null;$("admin-map-form").reset();$("map-published").value="false";$("map-evidence").value="reported";setMessage("");
}
function editPoint(item){
 selectedId=item.id;
 const fields={layer:item.layer_type,title:item.title_pt||item.title,title_en:item.title_en||"",title_es:item.title_es||"",notes_en:item.description_en||"",notes_es:item.description_es||"",notes:item.description_pt||item.notes||"",species:item.scientific_name,country:item.country,state:item.state,city:item.municipality,latitude:item.latitude,longitude:item.longitude,precision:item.location_precision,evidence:item.evidence_status,url:item.source_url,published:String(item.published),notes:item.notes};
 for(const [key,val] of Object.entries(fields))$("map-"+key.replaceAll("_","-")).value=val??"";
 $("admin-map-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
export function promoteTip(item){
 if(!isAdmin||!currentUser)return;
 resetForm();
 const layer=layers.includes(item.type)?item.type:"platform";
 $("map-layer").value=layer;
 // Never carry unreviewed free-text allegations or personal names to a shared layer.
 $("map-title").value=layer==="fair"?"Feira sob avaliação — município a confirmar":layer==="physical_market"?"Comércio presencial sob avaliação — município a confirmar":"Fonte sob avaliação — município a confirmar";
 $("map-species").value=item.species||"";
 $("map-url").value=https(item.url)?item.url:"";
 $("map-notes").value="";
 setMessage(T().noPerson);
 $("admin-map-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderAdminList(){
 const list=$("admin-map-list");list.replaceChildren();
 if(!items.length)list.append(text("p",T().noItems));
 for(const item of items.filter(entry=>entry.layer_type!=="aurum")){
  const card=document.createElement("article");card.className="tip-item";
  card.append(text("strong",localizedTitle(item,language)),text("small",T().layerOptions[layers.indexOf(item.layer_type)]+" · "+[item.municipality,item.state].filter(Boolean).join(", ")));
  card.append(text("span",item.published?T().public:T().draft));
  const edit=text("button",T().edit);edit.type="button";edit.className="secure-secondary";edit.addEventListener("click",()=>editPoint(item));card.append(edit);list.append(card);
 }
}
export function setMapPointLanguage(lang){
 language=useLang(lang);
 const panel=$("admin-map-panel");if(!panel)return;
 panel.querySelector("#admin-map-title").textContent=T().title;
 panel.querySelector("#admin-map-help").textContent=T().help;
 const fields={layer:"layer",title:"name",title_en:"title_en",title_es:"title_es",notes_en:"notes_en",notes_es:"notes_es",species:"species",country:"country",state:"state",city:"city",latitude:"lat",longitude:"lon",precision:"precision",evidence:"evidence",url:"url",published:"published",notes:"notes"};
 for(const [id,key] of Object.entries(fields)){const elm=panel.querySelector('[data-map-field="'+id+'"]');if(elm)elm.textContent=T()[key]||({pt:{title_en:"Título em inglês",title_es:"Título em espanhol",notes_en:"Contexto em inglês",notes_es:"Contexto em espanhol"},en:{title_en:"English title",title_es:"Spanish title",notes_en:"English context",notes_es:"Spanish context"},es:{title_en:"Título en inglés",title_es:"Título en español",notes_en:"Contexto en inglés",notes_es:"Contexto en español"}}[language]?.[key]||key);}
 for(let i=0;i<layers.length;i++)$("map-layer").options[i].textContent=T().layerOptions[i];
 $("map-evidence").options[0].textContent=T().reported;$("map-evidence").options[1].textContent=T().verified;
 $("map-published").options[0].textContent=T().draft;$("map-published").options[1].textContent=T().public;
 $("map-save").textContent=T().save;$("map-cancel").textContent=T().cancel;
 renderAdminList();
}
export function startMapPoints(database,user,admin,whenUpdated,lang="pt"){
 closeMapPoints();db=database;currentUser=user;isAdmin=admin===true&&user?.email?.trim().toLowerCase()==="acarvalho@wcs.org";onPoints=whenUpdated;language=useLang(lang);
 const panel=$("admin-map-panel");panel.hidden=!isAdmin;
 if(isAdmin)setMapPointLanguage(language);
 const ref=collection(db,"map_points");
 const q=isAdmin?query(ref):query(ref,where("published","==",true));
 const uid=user.uid;
 unsubscribe=onSnapshot(q,snap=>{
  if(!currentUser||currentUser.uid!==uid)return;
  items=snap.docs.map(d=>({id:d.id,...d.data()}));
  const index=items.find(p=>p.id==="aurum-quantity-index"&&p.layer_type==="aurum_quantity_index"&&p.published===true);
  const quantities=index&&index.quantityByCaseId&&typeof index.quantityByCaseId==="object"&&!Array.isArray(index.quantityByCaseId)?index.quantityByCaseId:{};
  onPoints(items.filter(p=>p.published===true&&p.layer_type!=="aurum_quantity_index"),quantities);
  if(isAdmin)renderAdminList();
 },err=>{
  console.warn("NIMF map points unavailable",err?.code||err);
  if(isAdmin)setMessage(T().error);
  if(onPoints)onPoints([],{});
 });
 if(installed)return;installed=true;
 $("map-cancel").addEventListener("click",resetForm);
 $("admin-map-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!isAdmin||!currentUser)return;
  const save=$("map-save");save.disabled=true;
  const obj={
   layer_type:$("map-layer").value,title:$("map-title").value.trim(),title_pt:$("map-title").value.trim(),title_en:$("map-title-en").value.trim(),title_es:$("map-title-es").value.trim(),description_pt:$("map-notes").value.trim(),description_en:$("map-notes-en").value.trim(),description_es:$("map-notes-es").value.trim(),
   scientific_name:$("map-species").value.trim(),country:$("map-country").value.trim(),
   state:$("map-state").value.trim(),municipality:$("map-city").value.trim(),
   latitude:Number($("map-latitude").value),longitude:Number($("map-longitude").value),
   location_precision:$("map-precision").value,evidence_status:$("map-evidence").value,
   source_url:$("map-url").value.trim(),notes:$("map-notes").value.trim(),
   published:$("map-published").value==="true",updated_at:serverTimestamp(),updated_by:currentUser.uid
  };
  if(!layers.includes(obj.layer_type)||!https(obj.source_url)||!Number.isFinite(obj.latitude)||!Number.isFinite(obj.longitude)||
     Math.abs(obj.latitude)>85||Math.abs(obj.longitude)>180||obj.title.length<5||
     (obj.published&&obj.evidence_status!=="corroborated")||
      (obj.published&&["title_pt","title_en","title_es","description_pt","description_en","description_es"].some(key=>!obj[key]))){
   setMessage(T().mustReview);save.disabled=false;return;
  }
  try{
   if(selectedId)await updateDoc(doc(db,"map_points",selectedId),obj);
   else await addDoc(ref,{...obj,created_at:serverTimestamp(),created_by:currentUser.uid});
   resetForm();setMessage(T().success);
  }catch(e){setMessage(T().error);console.warn("Map point save rejected",e?.code||e);}
  finally{save.disabled=false;}
 });
}
export function closeMapPoints(){
 if(unsubscribe)unsubscribe();unsubscribe=null;db=null;currentUser=null;isAdmin=false;items=[];onPoints=null;selectedId=null;
 $("admin-map-panel").hidden=true;$("admin-map-list").replaceChildren();
}

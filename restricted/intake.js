import { collection, query, where, limit, onSnapshot, addDoc, doc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { useLang } from "./record-locale.js";
let db=null,user=null,admin=false,started=false,unsubOwn=null,unsubAdmin=null,language="pt";
let ownItems=[],adminItems=[],feedbackKey="",promote=null,authorEmails=new Map(),unsubContacts=null;
const $=id=>document.getElementById(id);
const states=["received","triage","checking","investigating","resolved","closed"];
const I={
 pt:{kicker:"TROCA DE INFORMAÇÕES",heading:"Contribuições para investigação",intro:"Envie links e informações para triagem. Apenas você e administradores autorizados podem consultar sua contribuição. Não inclua dados pessoais desnecessários.",type:"Tipo de informação",types:["Plataforma / site","Anúncio de fauna","Grupo ou canal de comércio","Feira livre","Ponto de comércio presencial sob investigação","Outro indício"],promote:"Preparar ponto no cadastro do mapa",urlGuidance:"Link opcional para feiras, comércio presencial ou outros indícios; evite endereços particulares.",title:"Título / assunto",url:"Link de referência (HTTPS)",species:"Espécie (se conhecida)",location:"Localidade mencionada",details:"Descrição factual",send:"Enviar para triagem",mine:"Minhas contribuições",mineDesc:"Acompanhe o andamento de seus envios. As notas são destinadas ao autor.",admin:"Triagem administrativa",adminDesc:"Avalie os registros recebidos; decisões ficam visíveis ao autor.",none:"Nenhuma contribuição enviada ainda.",noneAdmin:"Nenhum envio para avaliação.",open:"Abrir referência ↗",update:"Atualização",note:"Nota de acompanhamento visível ao autor",save:"Registrar andamento",errUpdate:"Não foi possível atualizar. Confira as regras do Firestore.",invalid:"Não foi possível enviar. Verifique o link HTTPS e as permissões.",sent:"Recebido para triagem.",errOwn:"Não foi possível carregar suas contribuições. Confira as regras de acesso.",errAdmin:"Não foi possível carregar a triagem administrativa.",untitled:"Sem título",example:"Ex.: Oferta de espécie controlada",specPlaceholder:"Nome científico ou comum",locationPlaceholder:"País, estado, município",detailsPlaceholder:"Descreva o que a fonte mostra; indique incertezas e evite acusações não verificadas.",states:["Recebido","Em triagem","Em verificação","Investigação iniciada","Concluído","Encerrado"]},
 en:{kicker:"INFORMATION EXCHANGE",heading:"Investigation contributions",intro:"Submit links and source information for review. Only you and authorized administrators can access your submission. Do not include unnecessary personal information.",type:"Information type",types:["Platform / website","Wildlife listing","Trading group or channel","Open-air market","Physical trading location under investigation","Other lead"],promote:"Prepare reviewed map point",urlGuidance:"Link optional for fairs, physical locations and other leads; avoid private addresses.",title:"Title / subject",url:"Reference link (HTTPS)",species:"Species (if known)",location:"Reported location",details:"Factual description",send:"Submit for review",mine:"My contributions",mineDesc:"Track the status of your submissions. Notes are intended for the contributor.",admin:"Administrative review",adminDesc:"Review submitted leads; decisions are visible to the contributor.",none:"No contributions submitted yet.",noneAdmin:"No submissions pending review.",open:"Open reference ↗",update:"Update",note:"Progress note visible to the contributor",save:"Record progress",errUpdate:"Could not update the status. Check Firestore permissions.",invalid:"Could not submit. Check the HTTPS link and access permissions.",sent:"Submitted for review.",errOwn:"Could not load your contributions. Check access rules.",errAdmin:"Could not load the administrative review queue.",untitled:"Untitled",example:"e.g. Offer involving a controlled species",specPlaceholder:"Scientific or common name",locationPlaceholder:"Country, state, municipality",detailsPlaceholder:"Describe what the source shows, indicate uncertainty and avoid unverified allegations.",states:["Received","In triage","Under verification","Investigation started","Resolved","Closed"]},
 es:{kicker:"INTERCAMBIO DE INFORMACIÓN",heading:"Contribuciones para investigación",intro:"Envíe enlaces e información para evaluación. Solo usted y los administradores autorizados pueden consultar su contribución. No incluya datos personales innecesarios.",type:"Tipo de información",types:["Plataforma / sitio web","Anuncio de fauna","Grupo o canal de comercio","Feria libre","Punto de comercio presencial bajo investigación","Otro indicio"],promote:"Preparar punto para el mapa",urlGuidance:"Enlace opcional para ferias, comercio presencial u otros indicios; evite direcciones privadas.",title:"Título / asunto",url:"Enlace de referencia (HTTPS)",species:"Especie (si se conoce)",location:"Localidad mencionada",details:"Descripción factual",send:"Enviar para evaluación",mine:"Mis contribuciones",mineDesc:"Siga el estado de sus envíos. Las notas están destinadas a su autor.",admin:"Evaluación administrativa",adminDesc:"Evalúe las informaciones recibidas; las decisiones serán visibles para el autor.",none:"Todavía no hay contribuciones.",noneAdmin:"No hay envíos para evaluación.",open:"Abrir referencia ↗",update:"Actualización",note:"Nota de seguimiento visible para el autor",save:"Registrar avance",errUpdate:"No se pudo actualizar. Compruebe los permisos de Firestore.",invalid:"No se pudo enviar. Compruebe el enlace HTTPS y los permisos.",sent:"Enviado para evaluación.",errOwn:"No fue posible cargar sus contribuciones. Compruebe las reglas de acceso.",errAdmin:"No fue posible cargar la evaluación administrativa.",untitled:"Sin título",example:"Ej.: Oferta de especie controlada",specPlaceholder:"Nombre científico o común",locationPlaceholder:"País, estado, municipio",detailsPlaceholder:"Describa lo que muestra la fuente; indique las incertidumbres y evite acusaciones no verificadas.",states:["Recibido","En evaluación","En verificación","Investigación iniciada","Resuelto","Cerrado"]}
};
for(const [lang,extra] of Object.entries({pt:{author:"E-mail do autor",unknownAuthor:"E-mail não disponível",history:"Histórico de triagens",historyDesc:"Casos concluídos ou encerrados, preservados para consulta.",noneHistory:"Nenhuma triagem concluída."},en:{author:"Contributor email",unknownAuthor:"Email unavailable",history:"Triage history",historyDesc:"Resolved or closed cases retained for reference.",noneHistory:"No completed reviews."},es:{author:"Correo del autor",unknownAuthor:"Correo no disponible",history:"Historial de evaluaciones",historyDesc:"Casos resueltos o cerrados conservados para consulta.",noneHistory:"No hay evaluaciones finalizadas."}}))Object.assign(I[lang],extra);
const typeKeys=["platform","advertisement","group","fair","physical_market","other"];
const txt=()=>I[language];
const node=(tag,content)=>{const n=document.createElement(tag);n.textContent=content??"";return n;};
const validHttps=value=>{try{const u=new URL(String(value));return u.protocol==="https:"&&!!u.hostname&&!String(value).includes(" ");}catch{return false;}};
const stateLabel=state=>txt().states[Math.max(0,states.indexOf(state))]||state;
function feedback(key){feedbackKey=key;$("tip-feedback").textContent=key?txt()[key]||"":"";}
function setLabel(selector,value){const label=document.querySelector(selector)?.closest("label");if(!label)return;const first=label.firstChild;if(first&&first.nodeType===Node.TEXT_NODE)first.nodeValue=value;else label.prepend(document.createTextNode(value));}
function summary(item,canEdit){
 const T=txt(),block=document.createElement("article");block.className="tip-item";
 block.append(node("strong",item.title||T.untitled));
 const small=node("small",[T.types[Math.max(0,typeKeys.indexOf(item.type))],item.species||"",item.location||""].filter(Boolean).join(" · "));block.append(small);
 const status=node("span",stateLabel(item.status));status.className="tip-status";block.append(status);
 if(validHttps(item.url)){const a=node("a",T.open);a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";block.append(a);}
 if(item.details)block.append(node("p",item.details)); // User-authored evidence remains verbatim.
 if(item.review_note)block.append(node("p",T.update+": "+item.review_note));
 if(canEdit){
  const email=item.owner_email||authorEmails.get(item.owner_uid)||(item.owner_uid===user?.uid?user.email:"");
  const contact=node("p",T.author+": ");contact.className="submission-author-email";
  if(email){const a=node("a",email);a.href="mailto:"+encodeURIComponent(email).replace(/%40/g,"@");contact.append(a);}else contact.append(node("span",T.unknownAuthor));
  block.append(contact);
  const select=document.createElement("select");
  for(const k of states)select.add(new Option(stateLabel(k),k));
  select.value=item.status;
  const note=document.createElement("textarea");note.rows=2;note.maxLength=1500;note.value=item.review_note||"";note.placeholder=T.note;
  const save=node("button",T.save);save.type="button";save.className="secure-secondary";
  save.addEventListener("click",async()=>{
   save.disabled=true;
   try{
    const batch=writeBatch(db);
    batch.update(doc(db,"submissions",item.id),{status:select.value,review_note:note.value.trim(),updated_at:serverTimestamp()});
    batch.set(doc(collection(db,"submissions",item.id,"history")),{status:select.value,note:note.value.trim(),created_at:serverTimestamp(),actor_uid:user.uid});
    await batch.commit();
   }catch(e){feedback("errUpdate");}
   finally{save.disabled=false;}
  });
  block.append(select,note,save);
  if(typeof promote==="function"&&["platform","advertisement","fair","physical_market"].includes(item.type)){
   const action=node("button",T.promote);action.type="button";action.className="secure-secondary";
   action.addEventListener("click",()=>promote(item));block.append(action);
  }
 }
 return block;
}
function renderLists(){
 const mine=$("my-tips"),other=$("admin-tips"),history=$("admin-history-tips");mine.replaceChildren();other.replaceChildren();history?.replaceChildren();
 const sorted=a=>[...a].sort((x,y)=>(y.created_at?.seconds||0)-(x.created_at?.seconds||0));
 if(!ownItems.length)mine.append(node("p",txt().none));else for(const item of sorted(ownItems))mine.append(summary(item,false));
 if(admin){
  const pending=sorted(adminItems.filter(item=>!["resolved","closed"].includes(item.status)));
  const finished=sorted(adminItems.filter(item=>["resolved","closed"].includes(item.status)));
  if(!pending.length)other.append(node("p",txt().noneAdmin));else for(const item of pending)other.append(summary(item,true));
  if(history){if(!finished.length)history.append(node("p",txt().noneHistory));else for(const item of finished)history.append(summary(item,true));}
 }
}
export function setIntakeLanguage(lang){
 language=useLang(lang);const T=txt(),sec=document.querySelector(".private-contributions");
 if(!sec)return;
 sec.querySelector(".explorer-head .secure-label").textContent=T.kicker;
 sec.querySelector(".explorer-head h3").textContent=T.heading;
 sec.querySelector(".explorer-head p").textContent=T.intro;
 for(const [sel,key] of [["#tip-type","type"],["#tip-title","title"],["#tip-url","url"],["#tip-species","species"],["#tip-location","location"],["#tip-details","details"]])setLabel(sel,T[key]);
 const select=$("tip-type");
 for(let i=0;i<select.options.length;i++)select.options[i].textContent=T.types[i];
 $("tip-title").placeholder=T.example;$("tip-species").placeholder=T.specPlaceholder;
 $("tip-location").placeholder=T.locationPlaceholder;$("tip-details").placeholder=T.detailsPlaceholder;
 $("tip-submit").textContent=T.send;
 $("tip-url-note").textContent=T.urlGuidance;
 updateLinkRequirement();
 // Admin review is in the collapsible utility dock, not .contributions-columns.
 const mine=$("my-contributions-panel"),review=$("admin-review");
 if(mine){mine.querySelector("h3").textContent=T.mine;mine.querySelector("p.secure-small").textContent=T.mineDesc;}
 if(review){review.querySelector("h3").textContent=T.admin;review.querySelector("p.secure-small").textContent=T.adminDesc;}
 if($("admin-history-title"))$("admin-history-title").textContent=T.history;if($("admin-history-description"))$("admin-history-description").textContent=T.historyDesc;
 renderLists();if(feedbackKey)$("tip-feedback").textContent=T[feedbackKey]||"";
}
function updateLinkRequirement(){
 $("tip-url").required=!["fair","physical_market","other"].includes($("tip-type").value);
}
export async function openIntake(database,currentUser,isAdmin,lang="pt",onPromote=null){
 db=database;user=currentUser;admin=isAdmin===true&&currentUser?.email?.trim().toLowerCase()==="acarvalho@wcs.org";promote=onPromote;ownItems=[];adminItems=[];
 if(unsubOwn)unsubOwn();if(unsubAdmin)unsubAdmin();unsubOwn=null;unsubAdmin=null;
 $("admin-review").hidden=!admin;$("admin-history").hidden=!admin;setIntakeLanguage(lang);
 if(unsubContacts){unsubContacts();unsubContacts=null;}authorEmails.clear();
 if(admin){unsubContacts=onSnapshot(query(collection(db,"access_requests"),limit(500)),snap=>{
  authorEmails=new Map(snap.docs.map(d=>[d.id,d.data()?.email]).filter(([,email])=>typeof email==="string"&&email.includes("@")));
  renderLists();
 },error=>console.warn("Contributor contact lookup unavailable",error?.code||error));}
 const uid=user.uid;
 unsubOwn=onSnapshot(query(collection(db,"submissions"),where("owner_uid","==",uid),limit(100)),snap=>{
  if(!user||user.uid!==uid)return;
  ownItems=snap.docs.map(d=>({id:d.id,...d.data()}));renderLists();
 },()=>feedback("errOwn"));
 if(admin)unsubAdmin=onSnapshot(query(collection(db,"submissions"),limit(150)),snap=>{
  if(!user||user.uid!==uid)return;
  adminItems=snap.docs.map(d=>({id:d.id,...d.data()}));renderLists();
 },()=>feedback("errAdmin"));
 if(started)return;started=true;
 $("tip-type").addEventListener("change",updateLinkRequirement);
 $("tip-form").addEventListener("submit",async ev=>{
  ev.preventDefault();if(!user)return;
  const send=$("tip-submit");send.disabled=true;feedback("");
  try{
   const values={owner_uid:user.uid,owner_email:user.email||"",type:$("tip-type").value,title:$("tip-title").value.trim(),url:$("tip-url").value.trim(),species:$("tip-species").value.trim(),location:$("tip-location").value.trim(),details:$("tip-details").value.trim(),status:"received",review_note:"",created_at:serverTimestamp(),updated_at:serverTimestamp()};
   if(!validHttps(values.url) && !(["fair","physical_market","other"].includes(values.type)&&values.url===""))throw new Error("invalid url");
   await addDoc(collection(db,"submissions"),values);
   $("tip-form").reset();feedback("sent");
  }catch(e){feedback("invalid");}finally{send.disabled=false;}
 });
}
export function closeIntake(){
 if(unsubOwn)unsubOwn();if(unsubAdmin)unsubAdmin();if(unsubContacts)unsubContacts();unsubOwn=null;unsubAdmin=null;unsubContacts=null;authorEmails.clear();
 user=null;db=null;admin=false;promote=null;ownItems=[];adminItems=[];
 $("my-tips").replaceChildren();$("admin-tips").replaceChildren();$("admin-history-tips")?.replaceChildren();$("admin-review").hidden=true;$("admin-history").hidden=true;feedback("");
}

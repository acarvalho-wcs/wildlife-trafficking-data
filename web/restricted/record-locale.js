// Localized presentation of canonical Firestore record fields.
// Never alters source evidence, taxon names, identifiers, or Firestore documents.
export const langs=["pt","en","es"];
export const useLang=l=>langs.includes(l)?l:"pt";
const dictionaries={
 pt:{
  status:{"Histórico - não revalidado":"Histórico — não revalidado","Em revisão":"Em revisão","Verificado":"Verificado",pending_review:"Pendente de revisão",verified:"Verificado"},
  category:{"Plataforma":"Plataforma","Anúncio comercial":"Anúncio comercial","Anuncio comercial":"Anúncio comercial",listing:"Anúncio comercial"},
  precision:{municipality:"Município (aproximado)",state:"Estado (aproximado)",country:"País (aproximado)",regional:"Região (aproximada)"},
  product:{kambo_secretion:"Secreção de Kambô",live_frogs:"Rãs vivas",kambo_ceremony:"Cerimônia ou retiro de Kambô",kambo_training:"Treinamento de Kambô",directory:"Diretório temático",informational:"Conteúdo informativo",social_profile:"Perfil social",unverified_service:"Serviço não confirmado",research_reference:"Referência de pesquisa",iakp_directory_profile:"Perfil de diretório IAKP",online_store:"Loja virtual",practitioner_directory:"Diretório de praticantes",colonia_formigas_vivas:"Colônia de formigas vivas",colonia_abelhas_sem_ferrao:"Colônia de abelhas sem ferrão",colony:"Colônia",stingless_bee_colony:"Colônia de abelhas sem ferrão"},
  titlePrefix:"Colônia anunciada de ",generic:"Anúncio de fauna",fallback:"Não informado"
 },
 en:{
  status:{"Histórico - não revalidado":"Historical — not revalidated","Em revisão":"Under review","Verificado":"Verified",pending_review:"Pending review",verified:"Verified"},
  category:{"Plataforma":"Platform","Anúncio comercial":"Commercial listing","Anuncio comercial":"Commercial listing",listing:"Commercial listing"},
  precision:{municipality:"Municipality (approximate)",state:"State (approximate)",country:"Country (approximate)",regional:"Region (approximate)"},
  product:{kambo_secretion:"Kambo secretion",live_frogs:"Live frogs",kambo_ceremony:"Kambo ceremony or retreat",kambo_training:"Kambo training",directory:"Thematic directory",informational:"Information page",social_profile:"Social profile",unverified_service:"Unconfirmed service",research_reference:"Research reference",iakp_directory_profile:"IAKP directory profile",online_store:"Online store",practitioner_directory:"Practitioner directory",colonia_formigas_vivas:"Live ant colony",colonia_abelhas_sem_ferrao:"Stingless bee colony",colony:"Colony",stingless_bee_colony:"Stingless bee colony"},
  titlePrefix:"Advertised colony of ",generic:"Wildlife listing",fallback:"Not specified"
 },
 es:{
  status:{"Histórico - não revalidado":"Histórico — sin revalidar","Em revisão":"En revisión","Verificado":"Verificado",pending_review:"Pendiente de revisión",verified:"Verificado"},
  category:{"Plataforma":"Plataforma","Anúncio comercial":"Anuncio comercial","Anuncio comercial":"Anuncio comercial",listing:"Anuncio comercial"},
  precision:{municipality:"Municipio (aproximado)",state:"Estado (aproximado)",country:"País (aproximado)",regional:"Región (aproximada)"},
  product:{kambo_secretion:"Secreción de kambó",live_frogs:"Ranas vivas",kambo_ceremony:"Ceremonia o retiro de kambó",kambo_training:"Formación en kambó",directory:"Directorio temático",informational:"Contenido informativo",social_profile:"Perfil social",unverified_service:"Servicio sin confirmar",research_reference:"Referencia de investigación",iakp_directory_profile:"Perfil del directorio IAKP",online_store:"Tienda virtual",practitioner_directory:"Directorio de practicantes",colonia_formigas_vivas:"Colonia de hormigas vivas",colonia_abelhas_sem_ferrao:"Colonia de abejas sin aguijón",colony:"Colonia",stingless_bee_colony:"Colonia de abejas sin aguijón"},
  titlePrefix:"Colonia anunciada de ",generic:"Anuncio de fauna",fallback:"No informado"
 }
};
export function localizedField(record,key,lang="pt"){
 const d=dictionaries[useLang(lang)];
 if(key==="title")return localizedTitle(record,lang);
 const raw=record?.[key];
 if(raw==null||raw==="")return d.fallback;
 if(key==="category")return d.category[raw]??String(raw).replaceAll("_"," ");
 if(key==="status"||key==="verification_status")return d.status[raw]??String(raw).replaceAll("_"," ");
 if(key==="product_type")return d.product[raw]??String(raw).replaceAll("_"," ");
 if(key==="location_precision")return d.precision[raw]??String(raw).replaceAll("_"," ");
 return String(raw);
}
export function localizedTitle(record,lang="pt"){
 const sci=record?.scientific_name;
 if(sci && typeof sci==="string"){
  // The canonical title is specifically generated for advertised colonies;
  // retain unknown titles instead of inferring product types.
  if(/^Col[oô]nia anunciada de /i.test(record.title??"")||/^(advertised colony|colonia anunciada)/i.test(record.title??""))return dictionaries[useLang(lang)].titlePrefix+sci;
 }
 return record?.["title_"+useLang(lang)]||record?.title||sci||dictionaries[useLang(lang)].generic;
}
export function localizedDescription(record,lang="pt"){
 const target=useLang(lang);
 const selected=record?.["description_"+target];
 if(typeof selected==="string"&&selected.trim())return {text:selected.trim(),sourceLanguage:target};
 for(const other of langs.filter(l=>l!==target)){
  const value=record?.["description_"+other];
  if(typeof value==="string"&&value.trim())return {text:value.trim(),sourceLanguage:other};
 }
 // Older Firestore documents may have only a single unlabeled description or note.
 // Never claim such source text has been translated.
 for(const key of ["description","notes"]){
  const value=record?.[key];
  if(typeof value==="string"&&value.trim())return {text:value.trim(),sourceLanguage:"original"};
 }
 return {text:"",sourceLanguage:null};
}

"use strict";
const I18N={
 pt:{
  navCaption:"PLATAFORMA / PRÉVIA",overview:"Visão geral",sources:"Fontes monitoradas",taxa:"Espécies",listings:"Anúncios",observations:"Observações",method:"Metodologia",sidebarPrivacy:"Dados reservados fora desta prévia",sidebarHint:"O acervo restrito permanece exclusivamente no repositório privado.",previewPill:"PRÉVIA PÚBLICA",eyebrow:"DEMONSTRAÇÃO DE INTERFACE · DESENVOLVIMENTO",titleOverview:"Painel de inteligência",descriptionOverview:"Exploração de mercados e fontes abertas sobre fauna silvestre.",descriptionOther:"Demonstração pública, sem acesso aos registros reservados.",metricSources:"Fontes cadastradas",metricSourcesDesc:"Metadados públicos",metricTaxa:"Espécies",metricListings:"Anúncios",metricObs:"Observações",metricPending:"Não exibidos nesta prévia",progressTag:"01 / ESTRUTURA",progressTitle:"Inteligência de mercado",progressCopy:"Ambiente de análise preparado para fontes, espécies, anúncios e observações. Registros reservados não são publicados nesta demonstração.",progressFoot:"Interface em elaboração",mapTitle:"Inteligência geoespacial",mapCopy:"Módulo futuro. Nenhuma posição, rota ou ocorrência é inferida nesta prévia.",sourceTitle:"Fontes-piloto",sourceSubtitle:"Apenas informações institucionais publicamente verificáveis.",noTaxaTitle:"Catálogo de espécies",noTaxaCopy:"A taxonomia permanece no repositório privado e não é carregada no site demonstrativo.",noListingsTitle:"Registros comerciais",noListingsCopy:"Nenhum anúncio individual ou informação de negociação é exposto nesta prévia.",noObsTitle:"Observações de mercado",noObsCopy:"A consulta aos registros verificados continuará restrita ao GitHub privado.",methodTag:"CONTEXTO E CRITÉRIOS",methodTitle:"Evidência antes de inferência",methodCopy:"O NIMF diferencia plataformas, espécies, anúncios comerciais, observações e eventos criminais documentados. A presença de um produto em uma plataforma não demonstra ilegalidade.",methodPrivacy:"Esta é uma demonstração pública sem dados reservados. Os conjuntos canônicos ficam no repositório privado do GitHub e não são carregados no navegador.",refO:"Oficiais",refS:"Científicas",refN:"Notícias",refI:"Institucionais",refM:"Mercado",footerDemo:"PRÉVIA · SEM DADOS RESTRITOS",allTypes:"Todos os tipos",marketplace:"Marketplace",directory:"Diretório",searchPlaceholder:"Pesquisar fontes",name:"Fonte",type:"Tipo",scope:"Abrangência",link:"Link",open:"Abrir ↗",empty:"Nenhuma fonte encontrada",br:"Brasil",world:"Internacional"},
 en:{
  navCaption:"PLATFORM / PREVIEW",overview:"Overview",sources:"Monitored sources",taxa:"Species",listings:"Listings",observations:"Observations",method:"Methodology",sidebarPrivacy:"Restricted data excluded",sidebarHint:"Private records remain exclusively in the private repository.",previewPill:"PUBLIC PREVIEW",eyebrow:"INTERFACE DEMO · IN DEVELOPMENT",titleOverview:"Intelligence dashboard",descriptionOverview:"Exploring open sources and markets related to wildlife.",descriptionOther:"Public preview without access to restricted records.",metricSources:"Registered sources",metricSourcesDesc:"Public metadata only",metricTaxa:"Species",metricListings:"Listings",metricObs:"Observations",metricPending:"Not shown in this preview",progressTag:"01 / FRAMEWORK",progressTitle:"Market intelligence",progressCopy:"Analysis workspace prepared for sources, species, listings and observations. Restricted records are excluded from this demonstration.",progressFoot:"Interface in progress",mapTitle:"Geospatial intelligence",mapCopy:"Future module. No locations, routes or events are inferred in this preview.",sourceTitle:"Pilot sources",sourceSubtitle:"Publicly verifiable institutional metadata only.",noTaxaTitle:"Species catalogue",noTaxaCopy:"Taxonomic data remains in the private repository and is not loaded by this demo.",noListingsTitle:"Market listings",noListingsCopy:"No individual listings or transaction information is exposed in this preview.",noObsTitle:"Market observations",noObsCopy:"Verified observations remain available only to authorized users of the private GitHub repository.",methodTag:"CONTEXT AND CRITERIA",methodTitle:"Evidence before inference",methodCopy:"NIMF separates platforms, species, listings, market observations and documented criminal events. Presence of a product on a platform does not establish illegality.",methodPrivacy:"This is a public interface demo without restricted data. Canonical records stay in private GitHub and are not fetched by this website.",refO:"Official",refS:"Scientific",refN:"News",refI:"Institutional",refM:"Market",footerDemo:"PREVIEW · NO RESTRICTED DATA",allTypes:"All types",marketplace:"Marketplace",directory:"Directory",searchPlaceholder:"Search sources",name:"Source",type:"Type",scope:"Scope",link:"Link",open:"Open ↗",empty:"No matching sources",br:"Brazil",world:"International"},
 es:{
  navCaption:"PLATAFORMA / VISTA PREVIA",overview:"Resumen",sources:"Fuentes monitoreadas",taxa:"Especies",listings:"Anuncios",observations:"Observaciones",method:"Metodología",sidebarPrivacy:"Datos reservados excluidos",sidebarHint:"Los registros restringidos permanecen en el repositorio privado.",previewPill:"VISTA PÚBLICA",eyebrow:"DEMOSTRACIÓN DE INTERFAZ · EN DESARROLLO",titleOverview:"Panel de inteligencia",descriptionOverview:"Exploración de mercados y fuentes abiertas sobre fauna silvestre.",descriptionOther:"Vista pública sin acceso a registros restringidos.",metricSources:"Fuentes registradas",metricSourcesDesc:"Solo metadatos públicos",metricTaxa:"Especies",metricListings:"Anuncios",metricObs:"Observaciones",metricPending:"No visibles en esta vista",progressTag:"01 / ESTRUCTURA",progressTitle:"Inteligencia de mercado",progressCopy:"Entorno preparado para fuentes, especies, anuncios y observaciones. Los registros reservados se excluyen de esta demostración.",progressFoot:"Interfaz en desarrollo",mapTitle:"Inteligencia geoespacial",mapCopy:"Módulo futuro. Ninguna ubicación, ruta o evento se infiere en esta vista.",sourceTitle:"Fuentes piloto",sourceSubtitle:"Solo metadatos institucionales públicos y verificables.",noTaxaTitle:"Catálogo de especies",noTaxaCopy:"La taxonomía permanece en el repositorio privado y no se carga en este sitio.",noListingsTitle:"Registros comerciales",noListingsCopy:"No se exponen anuncios individuales ni información sobre negociaciones.",noObsTitle:"Observaciones de mercado",noObsCopy:"La consulta de observaciones verificadas seguirá restringida a GitHub privado.",methodTag:"CONTEXTO Y CRITERIOS",methodTitle:"Evidencia antes de inferencia",methodCopy:"NIMF diferencia plataformas, especies, anuncios, observaciones y eventos criminales documentados. La presencia de un producto en una plataforma no prueba ilegalidad.",methodPrivacy:"Esta es una demostración pública sin datos reservados. Los registros canónicos siguen en GitHub privado y no se cargan en el navegador.",refO:"Oficiales",refS:"Científicas",refN:"Noticias",refI:"Institucionales",refM:"Mercado",footerDemo:"VISTA · SIN DATOS RESTRINGIDOS",allTypes:"Todos los tipos",marketplace:"Marketplace",directory:"Directorio",searchPlaceholder:"Buscar fuentes",name:"Fuente",type:"Tipo",scope:"Cobertura",link:"Enlace",open:"Abrir ↗",empty:"No hay fuentes coincidentes",br:"Brasil",world:"Internacional"}
};
const PUBLIC_PILOTS=[
 {id:"abelhas-org",name:"Abelhas.org",type:"marketplace",scope:"br",url:"https://abelhas.org/"},
 {id:"iakp",name:"International Association of Kambo Practitioners",type:"directory",scope:"world",url:"https://iakp.org/search/"}
];
const state={locale:"pt",page:"overview",theme:"dark",search:"",filter:"all"};
const t=k=>I18N[state.locale][k]||k;
const $=id=>document.getElementById(id);
function make(tag,value,className){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(value!==undefined)el.textContent=value;
 return el;
}
function drawTable(target,rows){
 target.replaceChildren();
 const container=make("div",undefined,"source-grid");
 const head=make("div",undefined,"source-row header");
 [t("name"),t("type"),t("scope"),t("link")].forEach(label=>head.append(make("span",label)));
 container.append(head);
 if(rows.length===0){container.append(make("div",t("empty"),"table-empty"));}
 rows.forEach(s=>{
   const row=make("div",undefined,"source-row");
   row.append(make("strong",s.name));
   row.append(make("span",t(s.type)));
   row.append(make("span",t(s.scope)));
   const link=make("a",t("open"));link.href=s.url;link.target="_blank";link.rel="noopener noreferrer";
   row.append(link);container.append(row);
 });
 target.append(container);
}
function updateTables(){
 const q=state.search.trim().toLocaleLowerCase(state.locale);
 const filtered=PUBLIC_PILOTS.filter(s=>(state.filter==="all"||s.type===state.filter)&&[s.name,t(s.type),t(s.scope)].some(v=>v.toLocaleLowerCase(state.locale).includes(q)));
 drawTable($("full-source-table"),filtered);
 drawTable($("overview-source-table"),PUBLIC_PILOTS);
}
function setPage(page){
 if(!["overview","sources","taxa","listings","observations","method"].includes(page))return;
 state.page=page;
 document.querySelectorAll(".view").forEach(el=>{el.hidden=el.id!=="view-"+page;});
 document.querySelectorAll(".menu-item").forEach(btn=>{
  const active=btn.dataset.page===page;btn.classList.toggle("active",active);
  if(active)btn.setAttribute("aria-current","page");else btn.removeAttribute("aria-current");
 });
 $("current-section").textContent=t(page);
 $("page-title").textContent=page==="overview"?t("titleOverview"):t(page);
 $("page-description").textContent=page==="overview"?t("descriptionOverview"):t("descriptionOther");
 closeMenu();
}
function translate(){
 document.documentElement.lang=state.locale==="pt"?"pt-BR":state.locale;
 document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n);});
 $("source-search").placeholder=t("searchPlaceholder");
 updateTables();setPage(state.page);
}
function closeMenu(){
 $("sidebar").classList.remove("open");$("overlay").hidden=true;
 $("mobile-menu").setAttribute("aria-expanded","false");
}
document.querySelectorAll(".menu-item").forEach(el=>el.addEventListener("click",()=>setPage(el.dataset.page)));
$("language").addEventListener("change",e=>{state.locale=e.target.value;translate();});
$("theme-toggle").addEventListener("click",()=>{
 state.theme=state.theme==="dark"?"light":"dark";
 document.body.dataset.theme=state.theme;
 $("theme-toggle").textContent=state.theme==="dark"?"☼":"◐";
});
$("source-search").addEventListener("input",e=>{state.search=e.target.value;updateTables();});
$("source-filter").addEventListener("change",e=>{state.filter=e.target.value;updateTables();});
$("mobile-menu").addEventListener("click",()=>{
 const open=$("sidebar").classList.toggle("open");$("overlay").hidden=!open;
 $("mobile-menu").setAttribute("aria-expanded",String(open));
});
$("overlay").addEventListener("click",closeMenu);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});
translate();


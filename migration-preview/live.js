let events=window.NEWS_DATA;
const terms=window.NEWS_TERMS||{};
const messages={
pt:{title:'Tráfico de fauna no mundo',subtitle:'Explore apreensões por local, espécie e período',dashboard:'Dashboard',events:'Eventos',species:'Espécies',sources:'Fontes',country:'País',group:'Grupo / espécie',year:'Ano',route:'Modal',clear:'Limpar filtros',seizures:'Notícias exibidas',specimens:'Animais / itens citados',countries:'Países',threatened:'Fontes distintas',map:'Mapa de apreensões',recent:'Eventos filtrados',clickHint:'Clique para localizar',all:'Todos',results:'eventos no mapa',empty:'Nenhum evento corresponde aos filtros.',newsOnly:'Somente notícias',note:'Cada registro contém a publicação original. A inclusão no painel não substitui validação investigativa.',external:'Links abrem as fontes no idioma original. Nomes próprios e científicos são preservados.',published:'Publicação',event:'Evento',updated:'Notícias atualizadas em',news:'notícias',open:'Abrir notícia',unknown:'Quantidade não informada',items:'itens/animais',language:'Idioma',zoomIn:'Ampliar',zoomOut:'Reduzir',close:'Fechar',brand:'INTELIGÊNCIA DE FAUNA',monitor:'Monitor global',program:'Programa de Inteligência para Conservação',contactTitle:'Envie informações sobre apreensões',contactCopy:'Órgãos públicos e parceiros podem compartilhar notícias e informações verificáveis sobre apreensões de fauna.',contactAction:'inteligencia@wcs.org',contactSubject:'Informação sobre apreensão de fauna',navLabel:'Seções do painel',eventsTitle:'Todos os eventos',eventsIntro:'Consulte as notícias cadastradas e abra a publicação original.',speciesTitle:'Eventos por grupo de fauna',speciesIntro:'Veja quantas notícias e itens foram registrados para cada grupo.',sourcesTitle:'Fontes das notícias',sourcesIntro:'Acesse as publicações originais usadas em cada registro.',reportOne:'notícia',reportMany:'notícias',latest:'Mais recente',researchRepository:'Repositório de artigos científicos',reportageRepository:'Reportagens sobre tráfico de fauna'},
en:{title:'Wildlife trafficking worldwide',subtitle:'Explore seizures by location, species and period',dashboard:'Dashboard',events:'Events',species:'Species',sources:'Sources',country:'Country',group:'Group / species',year:'Year',route:'Transport mode',clear:'Clear filters',seizures:'News reports shown',specimens:'Animals / items reported',countries:'Countries',threatened:'Distinct sources',map:'Seizure map',recent:'Filtered events',clickHint:'Click to locate',all:'All',results:'events on map',empty:'No events match these filters.',newsOnly:'News only',note:'Each record links to the original publication. Inclusion in this dashboard does not replace investigative validation.',external:'Links open sources in their original language. Proper names and scientific names are preserved.',published:'Published',event:'Event',updated:'News updated on',news:'news reports',open:'Open news article',unknown:'Quantity not reported',items:'items/animals',language:'Language',zoomIn:'Zoom in',zoomOut:'Zoom out',close:'Close',brand:'WILDLIFE INTELLIGENCE',monitor:'Global monitor',program:'Conservation Intelligence Program',contactTitle:'Submit wildlife seizure information',contactCopy:'Public agencies and partners can share verifiable news and information about wildlife seizures.',contactAction:'inteligencia@wcs.org',contactSubject:'Wildlife seizure information',navLabel:'Dashboard sections',eventsTitle:'All events',eventsIntro:'Browse the registered news reports and open the original publication.',speciesTitle:'Events by wildlife group',speciesIntro:'See how many reports and items were recorded for each group.',sourcesTitle:'News sources',sourcesIntro:'Open the original publications used for each record.',reportOne:'report',reportMany:'reports',latest:'Latest',researchRepository:'Scientific article repository',reportageRepository:'Wildlife trafficking feature stories'},
es:{title:'Tráfico de fauna en el mundo',subtitle:'Explore decomisos por lugar, especie y período',dashboard:'Panel',events:'Eventos',species:'Especies',sources:'Fuentes',country:'País',group:'Grupo / especie',year:'Año',route:'Modalidad',clear:'Limpiar filtros',seizures:'Noticias mostradas',specimens:'Animales / artículos citados',countries:'Países',threatened:'Fuentes distintas',map:'Mapa de decomisos',recent:'Eventos filtrados',clickHint:'Clic para localizar',all:'Todos',results:'eventos en el mapa',empty:'Ningún evento coincide con los filtros.',newsOnly:'Solo noticias',note:'Cada registro enlaza a la publicación original. Su inclusión en el panel no sustituye la validación investigativa.',external:'Los enlaces abren las fuentes en su idioma original. Se conservan los nombres propios y científicos.',published:'Publicación',event:'Evento',updated:'Noticias actualizadas el',news:'noticias',open:'Abrir noticia',unknown:'Cantidad no informada',items:'artículos/animales',language:'Idioma',zoomIn:'Acercar',zoomOut:'Alejar',close:'Cerrar',brand:'INTELIGENCIA DE FAUNA',monitor:'Monitor global',program:'Programa de Inteligencia para la Conservación',contactTitle:'Envíe información sobre decomisos',contactCopy:'Las instituciones públicas y entidades asociadas pueden compartir noticias e información verificable sobre decomisos de fauna.',contactAction:'inteligencia@wcs.org',contactSubject:'Información sobre decomiso de fauna',navLabel:'Secciones del panel',eventsTitle:'Todos los eventos',eventsIntro:'Consulte las noticias registradas y abra la publicación original.',speciesTitle:'Eventos por grupo de fauna',speciesIntro:'Vea cuántas noticias y artículos se registraron para cada grupo.',sourcesTitle:'Fuentes de las noticias',sourcesIntro:'Acceda a las publicaciones originales utilizadas en cada registro.',reportOne:'noticia',reportMany:'noticias',latest:'Más reciente',researchRepository:'Repositorio de artículos científicos',reportageRepository:'Reportajes sobre tráfico de fauna'}
};
Object.assign(messages.pt,{title:'Observatório Global de Tráfico de Animais',subtitle:'Explore apreensões por país, grupo de fauna, modal e período',group:'Grupo de fauna',species:'Grupos',speciesTitle:'Eventos por grupo de fauna',speciesIntro:'Veja quantas notícias e itens foram registrados em cada grande grupo.',groupPanel:'Grupos de fauna',modePanel:'Modais',itemsPanel:'Animais e itens citados',visualHint:'Selecione uma categoria para filtrar o mapa',itemComposition:'Composição por grupo no recorte selecionado',itemsShort:'animais/itens',eventsShort:'eventos',noItems:'Sem quantidade numérica no recorte',unallocated:'Distribuição por grupo não informada'});
Object.assign(messages.en,{title:'Illegal Wildlife Trafficking Global Observatory',subtitle:'Explore seizures by country, wildlife group, transport mode and period',group:'Wildlife group',species:'Groups',speciesTitle:'Events by wildlife group',speciesIntro:'See how many reports and items were recorded in each broad group.',groupPanel:'Wildlife groups',modePanel:'Transport modes',itemsPanel:'Animals and items reported',visualHint:'Select a category to filter the map',itemComposition:'Composition by group in the selected view',itemsShort:'animals/items',eventsShort:'events',noItems:'No numeric quantity in this view',unallocated:'Group distribution not reported'});
Object.assign(messages.es,{title:'Observatorio Global del Tráfico Ilegal de Fauna Silvestre',subtitle:'Explore decomisos por país, grupo de fauna, modalidad y período',group:'Grupo de fauna',species:'Grupos',speciesTitle:'Eventos por grupo de fauna',speciesIntro:'Vea cuántas noticias y artículos se registraron en cada gran grupo.',groupPanel:'Grupos de fauna',modePanel:'Modalidades',itemsPanel:'Animales y artículos citados',visualHint:'Seleccione una categoría para filtrar el mapa',itemComposition:'Composición por grupo en la selección actual',itemsShort:'animales/artículos',eventsShort:'eventos',noItems:'Sin cantidad numérica en la selección',unallocated:'Distribución por grupo no informada'});
messages.pt.weeklyReports='RELATÓRIOS';
messages.en.weeklyReports='REPORTS';
messages.es.weeklyReports='INFORMES';
messages.pt.creatorDisclaimer='Criado e gerenciado pelo Programa de Inteligência para Conservação da WCS Brasil.';
messages.en.creatorDisclaimer='Created and managed by the Conservation Intelligence Program at WCS Brazil.';
messages.es.creatorDisclaimer='Creado y gestionado por el Programa de Inteligencia para la Conservación de WCS Brasil.';
let lang='pt',markers=[],activeId=null,currentView='dashboard';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const caseText=window.ScientificText.html;
const locale=()=>({pt:'pt-BR',en:'en-US',es:'es-ES'})[lang];
const term=s=>lang==='pt'?s:(terms[s]?.[lang==='en'?0:1]??s);
const number=n=>Number(n).toLocaleString(locale());
const date=s=>!s?'—':new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
function record(e){
  return {...e,title:e['title_'+lang],summary:e['card_text_'+lang],country:term(e.country),city:term(e.city),species:term(e.species),taxon:term(e.taxon),mode:term(e.mode),source:e.source_label,geoNote:e['geographic_note_'+lang]||e.geographic_note_pt||'',url:e.source_url};
}
function dates(e){const t=messages[lang];return t.event+': '+date(e.event_date)+' · '+t.published+': '+date(e.publication_date);}

function quantity(e){return e.quantityDisplay||(e.items?number(e.items)+' '+messages[lang].items:messages[lang].unknown);}
function updatedDate(){
  const m=(window.NEWS_UPDATED||'').match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) UTC$/);
  if(!m){const at=Date.parse(window.NEWS_UPDATED);return Number.isFinite(at)?new Intl.DateTimeFormat(locale(),{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(at)+' UTC':'—';}
  return new Intl.DateTimeFormat(locale(),{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(m[3]+'-'+m[2]+'-'+m[1]+'T'+m[4]+':'+m[5]+':00Z'))+' UTC';
}
const map=L.map('map',{worldCopyJump:true,minZoom:2,zoomControl:false}).setView([14,5],2);
window.ObservatoryBasemap?.init(map);
const zoom=L.control.zoom().addTo(map);
const bar=document.createElement('div');bar.className='livebar';document.querySelector('.sub').after(bar);
const style=document.createElement('style');style.textContent='.livebar{color:var(--muted);font-size:14px;margin-top:7px}.source-link{color:var(--blue);text-decoration:none}.source-tag{color:var(--blue);font-size:12px;background:#112a34;border-radius:8px;padding:2px 7px;overflow-wrap:anywhere}.eventtop{flex-wrap:wrap}.event p{font-size:14px}.popup-meta{margin-top:6px}.data-note{font-size:14px}.filter label{font-size:14px}';document.head.appendChild(style);
function filterValue(e,key){return key==='species'?e.groups:key==='mode'?e.modeGroup:e[key];}
function matchesFilter(e,key,value){return !value||(key==='species'?e.groups.includes(value):String(filterValue(e,key)??'')===value);}
function filtered(period='visible'){return events.filter(e=>window.RecordSearch.matches(e)&&['country','species','year','mode'].every(k=>matchesFilter(e,k,$(k).value))&&(!window.ObservatoryTime||window.ObservatoryTime.matches(e,period)));}
// Use the same live selection as every map/view; never keep an export data cache.
function exportRows(){return filtered().map(raw=>{const e=record(raw);return {
 case_id:e.case_id,date:e.eventDate||e.event_month||'',publication_date:e.publication_date||'',event_date_precision:e.event_date_precision||(e.eventDate?'day':'unknown'),
 country:e.country,location:e.city,latitude:e.lat,longitude:e.lng,geographic_note:e.geoNote||'',species:e.taxon||e.species,taxonomic_group:e.groups.map(term).join(' | '),quantity:quantity(e),
 transport_mode:e.mode,case_description:e.summary,case_context:e['context_'+lang]||'',source:e.source,source_url:e.url,status:e.status||e.context_status||'',added_at:e.added_at||'',context_updated_at:e.context_updated_at||'',
 record_type:e.record_type||'',aggregate_operation:e.aggregate_operation===true,context_references:e['references_text_'+lang]||e.references_text_pt||''
};});}
const exportColumns=['case_id','date','publication_date','event_date_precision','country','location','latitude','longitude','geographic_note','species','taxonomic_group','quantity','transport_mode','case_description','case_context','source','source_url','status','added_at','context_updated_at','record_type','aggregate_operation','context_references'];
function exportXlsx(){
 const headers=exportColumns,rows=exportRows().map(record=>headers.map(key=>record[key]));
 window.ObservatoryXlsx.downloadWorkbook(headers,rows,'wildlife-trafficking-observatory_'+new Date().toISOString().slice(0,10)+'.xlsx','Eventos');
}
function popup(e){
  const t=messages[lang];
  return '<div class="popup-title">'+caseText(e.title||e.city+', '+e.country)+'</div>'+(e.title?'<div class="popup-meta">'+caseText(e.city+', '+e.country)+'</div>':'')+'<div>'+esc(dates(e))+'</div><div>'+caseText(e.species+' · '+e.taxon)+'</div><div>'+caseText(quantity(e))+'</div><div>'+caseText(e.mode)+'</div><p>'+caseText(e.summary)+'</p><div class="popup-meta">'+caseText(e.source)+(e.geoNote?'<br>'+caseText(e.geoNote):'')+'</div><a class="popup-news" href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+esc(t.open)+' ↗</a>'+(window.CaseMedia?.html(e,lang)||'')+window.CaseContext.added(e,lang)+window.CaseContext.aggregateLabel(e,lang)+window.CaseContext.html(e,lang);
}
function card(e){
 const t=messages[lang];
 return '<div class="event" data-id="'+esc(e.id)+'" tabindex="0" role="button" aria-label="'+esc(window.ScientificText.plain(t.clickHint+': '+e.city))+'"><div class="eventtop"><b>'+caseText(e.title||e.city+', '+e.country)+'</b><span class="source-tag">'+caseText(e.source)+'</span></div><p>'+(e.title?caseText(e.city+', '+e.country)+'<br>':'')+esc(dates(e))+'<br>'+caseText(e.species+' · '+e.taxon+' · '+e.mode)+'<br>'+caseText(quantity(e))+'<br>'+caseText(e.summary)+(e.geoNote?'<br>'+caseText(e.geoNote):'')+'<br><a class="source-link" href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+esc(t.open)+' ↗</a>'+(e.additionalSources||[]).map(s=>'<br><a class="source-link" href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+caseText(term(s.source))+' ↗</a>').join('')+'</p>'+(window.CaseMedia?.html(e,lang)||'')+window.CaseContext.added(e,lang)+window.CaseContext.aggregateLabel(e,lang)+window.CaseContext.html(e,lang)+'</div>';
}
function reportCount(n){const t=messages[lang];return number(n)+' '+(n===1?t.reportOne:t.reportMany);}
function directoryEvent(e){
 const t=messages[lang];
 return '<article class="directory-event"><div class="eventtop"><b>'+caseText(e.title||e.city+', '+e.country)+'</b><span class="source-tag">'+caseText(e.source)+'</span></div><p>'+(e.title?caseText(e.city+', '+e.country)+'<br>':'')+esc(dates(e))+'<br>'+caseText(e.species+' · '+e.taxon+' · '+e.mode)+'<br>'+caseText(quantity(e))+'<br>'+caseText(e.summary)+(e.geoNote?'<br>'+caseText(e.geoNote):'')+'<br><a class="source-link" href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+esc(t.open)+' ↗</a>'+(e.additionalSources||[]).map(s=>'<br><a class="source-link" href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+caseText(term(s.source))+' ↗</a>').join('')+'</p>'+(window.CaseMedia?.html(e,lang)||'')+window.CaseContext.added(e,lang)+window.CaseContext.aggregateLabel(e,lang)+window.CaseContext.html(e,lang)+'</article>';
}
function renderDirectories(){
 const t=messages[lang],ordered=[...events].sort((a,b)=>b.date.localeCompare(a.date));
 $('eventsDirectory').innerHTML=ordered.map(e=>directoryEvent(record(e))).join('');
 $('eventsTotal').textContent=reportCount(events.length);
 const speciesGroups=new Map();
 for(const e of events.filter(window.CaseContext.countable))for(const name of e.groups){const g=speciesGroups.get(name)||{count:0,items:0,unknown:0,latest:e.date};g.count++;g.items+=Number.isFinite(e.breakdown.items[name])?e.breakdown.items[name]:0;if(!Number.isFinite(e.breakdown.items[name]))g.unknown++;if(e.date>g.latest)g.latest=e.date;speciesGroups.set(name,g);}
 $('speciesDirectory').innerHTML=[...speciesGroups].sort((a,b)=>term(a[0]).localeCompare(term(b[0]),locale())).map(([name,g])=>'<article class="summary-card"><strong>'+esc(term(name))+'</strong><span>'+esc(reportCount(g.count))+' · '+esc((g.unknown&&!g.items?'—':number(g.items)+(g.unknown?' + ?':''))+' '+t.items)+'</span><span>'+esc(t.latest+': '+date(g.latest))+'</span></article>').join('');
 $('speciesTotal').textContent=number(speciesGroups.size)+' '+t.species.toLocaleLowerCase(locale());
 const sourceGroups=new Map();
 for(const e of ordered){const g=sourceGroups.get(e.source)||[];g.push(e);sourceGroups.set(e.source,g);}
 $('sourcesDirectory').innerHTML=[...sourceGroups].sort((a,b)=>term(a[0]).localeCompare(term(b[0]),locale())).map(([name,reports])=>'<article class="summary-card"><strong>'+esc(term(name))+'</strong><span>'+esc(reportCount(reports.length))+'</span><div class="source-news">'+reports.map(raw=>{const e=record(raw);return '<a href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+caseText(e.city+', '+e.country+' · '+date(e.date))+' ↗</a>';}).join('')+'</div></article>').join('');
 $('sourcesTotal').textContent=number(sourceGroups.size)+' '+t.sources.toLocaleLowerCase(locale());
}
const groupIcons={'Mamíferos':'ph-paw-print','Aves':'ph-bird','Insetos':'ph-bug','Aracnídeos':'ph-spider','Peixes':'ph-fish','Anfíbios':'ph-drop'};
const modeIcons={'Aéreo':'ph-airplane-tilt','Marítimo':'ph-boat','Terrestre':'ph-truck','Múltiplos':'ph-arrows-left-right','Não informado':'ph-question'};
const pieColors=['#d3ff55','#65c4ff','#ff9d52','#ff6b5f','#b995ff','#67e8c5','#f5d06f'];
// Quantitative schema 1.2 is shared by the lower panels and upper quantity total.
// Never read narrative quantities or mutate shared records / map adapters here.
function lowerQuantityStats(){return {count:0,items:0,known:0,unknown:0,approximate:0,minimum:0,kinds:{animals:0,wildlife_items:0,animals_and_items:0}};}
function addLowerQuantity(stats,value,e){
 stats.count++;
 if(!Number.isFinite(value)||value<0||!['exact','approximate','minimum'].includes(e.quantity_qualifier)||!Object.hasOwn(stats.kinds,e.quantity_kind)){stats.unknown++;return;}
 stats.items+=value;stats.known++;stats.kinds[e.quantity_kind]++;
 if(e.quantity_qualifier==='approximate')stats.approximate++;
 if(e.quantity_qualifier==='minimum')stats.minimum++;
}
function lowerQuantityText(stats){
 if(!stats.known)return '—';
 return (stats.approximate?'≈ ':stats.minimum?'≥ ':'')+number(stats.items);
}
function lowerQuantityNote(stats){
 const labels={pt:['Animais','Itens de fauna','Animais e itens de fauna','Valores aproximados','Valores mínimos','Quantidade não informada'],en:['Animals','Wildlife items','Animals and wildlife items','Approximate values','Minimum values','Quantity not reported'],es:['Animales','Artículos de fauna','Animales y artículos de fauna','Valores aproximados','Valores mínimos','Cantidad no informada']}[lang];
 return [stats.kinds.animals,stats.kinds.wildlife_items,stats.kinds.animals_and_items,stats.approximate,stats.minimum,stats.unknown].map((n,i)=>n?labels[i]+': '+number(n)+' '+messages[lang].eventsShort:'').filter(Boolean).join(' · ');
}
function lowerQuantities(data){
 const groups=new Map(),modes=new Map(),total=lowerQuantityStats(),unallocated=lowerQuantityStats();
 for(const e of data){
  if(e.exclude_from_totals===true)continue;
  addLowerQuantity(total,e.quantity_count,e);
  for(const name of new Set(e.fauna_groups_aggregated)){
   const v=groups.get(name)||lowerQuantityStats();
   addLowerQuantity(v,e.quantity_by_group?.[name],e);groups.set(name,v);
  }
  if(Number.isFinite(e.quantity_unassigned)&&e.quantity_unassigned>0)addLowerQuantity(unallocated,e.quantity_unassigned,e);
  const mode=modes.get(e.modal_primary)||lowerQuantityStats();
  addLowerQuantity(mode,e.quantity_count,e);modes.set(e.modal_primary,mode);
 }
 return {groups,modes,total,unallocated};
}
function metricButton(kind,name,v){
 const selected=$(kind==='group'?'species':'mode').value===name,icon=(kind==='group'?groupIcons:modeIcons)[name]||'ph-dots-three-circle';
 const customImage=kind==='group'&&({'Répteis':'reptile-silhouette.png','Anfíbios':'amphibian-silhouette.png'})[name],visual=customImage?'<img src="'+customImage+'" alt="">':'<i class="ph-fill '+icon+'" aria-hidden="true"></i>';
 return '<button class="metric-button'+(selected?' active':'')+'" data-metric="'+kind+'" data-value="'+esc(name)+'" aria-pressed="'+selected+'" title="'+esc(lowerQuantityNote(v))+'">'+visual+'<strong>'+esc(term(name))+'</strong><span>'+esc(number(v.count)+' '+messages[lang].eventsShort+' · '+lowerQuantityText(v)+' '+messages[lang].itemsShort)+'</span></button>';
}
function renderVisual(data){
 const {groups,modes,total,unallocated}=lowerQuantities(data);
 $('groupMetrics').innerHTML=[...groups].sort((a,b)=>b[1].items-a[1].items||term(a[0]).localeCompare(term(b[0]),locale())).map(([name,v])=>metricButton('group',name,v)).join('')||'<div class="pie-empty">'+esc(messages[lang].empty)+'</div>';
 $('modeMetrics').innerHTML=[...modes].sort((a,b)=>b[1].count-a[1].count||term(a[0]).localeCompare(term(b[0]),locale())).map(([name,v])=>metricButton('mode',name,v)).join('')||'<div class="pie-empty">'+esc(messages[lang].empty)+'</div>';
 document.querySelectorAll('[data-metric]').forEach(button=>button.onclick=()=>{const select=$(button.dataset.metric==='group'?'species':'mode'),same=select.value===button.dataset.value;select.value=same?'':button.dataset.value;activeId=null;render();});
 const colors={'Invertebrados':'#d3ff55','Aves':'#65c4ff','Peixes':'#ff9d52','Insetos':'#ff6b5f','Répteis':'#b995ff','Anfíbios':'#67e8c5','Mamíferos':'#f5d06f','Fauna não especificada':'#d3ff55','Aracnídeos':'#65c4ff'};
 const slices=[...groups].filter(([,v])=>v.items>0).sort((a,b)=>b[1].items-a[1].items).map(([name,v])=>({name:term(name),v,color:colors[name]||'#a7b7b0'}));
 if(unallocated.items)slices.push({name:messages[lang].unallocated,v:unallocated,color:'#ff9d52'});
 const compositionTotal=slices.reduce((sum,s)=>sum+s.v.items,0);
 for(const id of ['donutTotal','nItems']){ $(id).textContent=lowerQuantityText(total);$(id).title=lowerQuantityNote(total); }
 $('itemsDonut').style.background='var(--line)';
 $('itemsDonut').innerHTML=slices.map(s=>'<span class="composition-segment" style="width:'+s.v.items/compositionTotal*100+'%;background:'+s.color+'" title="'+esc(s.name+': '+lowerQuantityText(s.v))+'"></span>').join('');
 $('pieLegend').innerHTML=slices.map(s=>'<div title="'+esc(lowerQuantityNote(s.v))+'"><i style="background:'+s.color+'"></i><span>'+esc(s.name)+'</span><strong>'+esc(lowerQuantityText(s.v))+'</strong></div>').join('')||'<div class="pie-empty">'+esc(messages[lang].noItems)+'</div>';

}
function switchView(next){
 if(!['dashboard','events','species','sources','reports'].includes(next))return;
 currentView=next;
 document.querySelectorAll('.view-panel').forEach(el=>{el.hidden=el.id!==next+'View';});
 document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===next;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
 if(next==='dashboard')requestAnimationFrame(()=>map.invalidateSize());
 window.ObservatoryGlobe?.sync();
}
function localizePopupClose(){
 document.querySelectorAll('.leaflet-popup-close-button').forEach(el=>{el.title=messages[lang].close;el.setAttribute('aria-label',messages[lang].close);});
}
map.on('popupopen',localizePopupClose);
function render(){
 const data=filtered(),t=messages[lang],selected=activeId;
 window.RecordSearch.localize(lang,data.length);
 const counted=data.filter(window.CaseContext.countable),covered=events.filter(window.CaseContext.complete).length;
 $('contextCoverage').textContent=({pt:'Cobertura de contexto',en:'Case context coverage',es:'Cobertura de contexto'})[lang]+': '+covered+'/'+events.length+' — '+number(events.length?Math.round(covered/events.length*100):0)+'%';
 const ct=window.CaseContext.labels[lang];$('caseLegend').innerHTML='<span><i class="legend-new"></i>'+esc(ct.recent)+'</span><span><i class="legend-history"></i>'+esc(ct.historical)+'</span>';
 markers.forEach(m=>map.removeLayer(m));markers=[];
 [...data].sort((a,b)=>Number(window.CaseContext.isRecent(a))-Number(window.CaseContext.isRecent(b))).forEach(raw=>{
  const e=record(raw),m=L.circleMarker([e.lat,e.lng],{radius:3.75,stroke:true,weight:1.5,color:'#245b40',className:'seizure-circle',fillColor:window.CaseContext.color(raw),fillOpacity:window.CaseContext.opacity(raw)}).addTo(map).bindPopup(popup(e),{maxWidth:340,maxHeight:400});
  m.on('click',()=>window.ObservatoryGlobe?.mapClick(raw));m.eventId=e.id;m.on('popupopen',()=>activeId=e.id);m.on('popupclose',()=>{if(activeId===e.id)activeId=null;});markers.push(m);
 });
 window.RecentPulse.sync(map,data,markers);
 $('nEvents').textContent=number(counted.length);$('nCountries').textContent=number(new Set(counted.map(e=>e.country)).size);$('nThreat').textContent=number(new Set(counted.map(e=>e.source)).size);
 $('mapCount').textContent=number(data.length)+' '+t.results;
 $('list').innerHTML=data.length?[...data].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>card(record(e))).join(''):'<div class="empty">'+esc(t.empty)+'</div>';
 renderVisual(data);
 window.ObservatoryTime?.render();
 document.querySelectorAll('.event').forEach(el=>{
  const locate=()=>{const e=events.find(e=>String(e.id)===el.dataset.id);if(window.ObservatoryGlobe?.locate(e))return;try{window.ObservatoryAnalytics?.track('case_open',{case_id:e.id,case_country:e.country,view:'map'});}catch{}map.flyTo([e.lat,e.lng],6);markers.find(m=>m.eventId===e.id)?.openPopup();};
  el.onclick=ev=>{if(!ev.target.closest('a'))locate();};
  el.onkeydown=ev=>{if(ev.target===el&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();locate();}};
 });
 const previous=markers.find(m=>m.eventId===selected);if(previous)previous.openPopup();else activeId=null;
 window.ObservatoryGlobe?.sync();
}
function setup(){
 const t=messages[lang];document.documentElement.lang=locale();document.title=t.title;
 $('exportCsv').textContent=lang==='en'?'Export .xlsx':'Exportar .xlsx';
 document.querySelector('meta[name="description"]').content=t.subtitle;
 document.querySelectorAll('[data-t]').forEach(el=>{if(t[el.dataset.t])el.textContent=t[el.dataset.t];});
 for(const key of ['country','species','year','mode']){
  const s=$(key),value=s.value;
  const values=key==='species'?events.flatMap(e=>e.groups):events.map(e=>String(filterValue(e,key)??''));
  s.innerHTML='<option value="">'+esc(t.all)+'</option>'+[...new Set(values.filter(Boolean))].sort((a,b)=>term(a).localeCompare(term(b),locale())).map(v=>'<option value="'+esc(v)+'">'+esc(term(v))+'</option>').join('');
  s.value=value;s.setAttribute('aria-label',t[{country:'country',species:'group',year:'year',mode:'route'}[key]]);
 }
 $('language').setAttribute('aria-label',t.language);
 document.querySelector('.nav').setAttribute('aria-label',t.navLabel);$('mobileNav').setAttribute('aria-label',t.navLabel);
 $('contactEmail').href='mailto:inteligencia@wcs.org?subject='+encodeURIComponent(t.contactSubject);
 $('contactEmail').setAttribute('aria-label',t.contactTitle+': inteligencia@wcs.org');
 document.querySelector('.brand strong').textContent=t.brand;document.querySelector('.brand span').textContent=t.monitor;
 document.querySelector('.data-note').innerHTML='<b>'+esc(t.newsOnly)+'</b><br>'+esc(t.note)+'<br><br>'+esc(t.external);
 renderDataStatus();
 zoom.options.zoomInTitle=t.zoomIn;zoom.options.zoomOutTitle=t.zoomOut;
 document.querySelectorAll('.leaflet-control-zoom-in,.leaflet-control-zoom-out').forEach(el=>{const label=el.classList.contains('leaflet-control-zoom-in')?t.zoomIn:t.zoomOut;el.title=label;el.setAttribute('aria-label',label);});
 render();window.WeeklyReports?.render(lang);renderDirectories();switchView(currentView);
}
window.RecordSearch.init(render);
window.RecordSearch.setCases(events);
['country','species','year','mode'].forEach(id=>$(id).addEventListener('change',render));
$('exportCsv').onclick=exportXlsx;
$('clear').onclick=()=>{['country','species','year','mode'].forEach(k=>$(k).value='');activeId=null;if(window.ObservatoryTime)window.ObservatoryTime.reset();else render();map.setView([14,5],2);};
$('language').onchange=e=>{lang=messages[e.target.value]?e.target.value:'pt';setup();};
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.view)));
window.ObservatoryTime?.init({render,lang:()=>lang,filtered,all:()=>events});
setup();

// Recolor existing Leaflet layers at the expiry boundary; never recreate records.
let caseClock;
function refreshCaseClock() {
 clearTimeout(caseClock);
 const now=Date.now();
 markers.forEach(m=>{const e=events.find(e=>e.id===m.eventId);m.setStyle({fillColor:window.CaseContext.color(e,now),fillOpacity:window.CaseContext.opacity(e,now)});m.setPopupContent(popup(record(e)));});
 window.RecentPulse.sync(map,filtered(),markers,now);
 document.querySelectorAll('.case-added').forEach(el=>{const e=events.find(e=>e.case_id===el.dataset.caseId);if(e)el.outerHTML=window.CaseContext.added(e,lang,now);});
 window.ObservatoryGlobe?.sync();
 const expiries=events.flatMap(e=>{const at=window.CaseContext.eventTimestamp(e.occurred_at);return [at-now,at+window.CaseContext.RECENT_WINDOW+1-now];}).filter(ms=>ms>0);
 caseClock=setTimeout(refreshCaseClock,Math.max(1,Math.min(60000-now%60000,...expiries)));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCaseClock();});
window.addEventListener('focus',refreshCaseClock);
refreshCaseClock();

window.ObservatoryGlobe?.init({map,filtered,record,popup,escape:esc,visible:()=>currentView==='dashboard',lang:()=>lang,select:id=>{activeId=id;}});

function renderDataStatus(){
 const state=window.CaseSource.state(),t=messages[lang];
 const labels={pt:{loading:'Carregando registros…',error:'Não foi possível carregar os registros. Recarregue a página para tentar novamente.',stale:'Não foi possível atualizar. Exibindo a última coleção validada; nova tentativa automática.'},en:{loading:'Loading records…',error:'Records could not be loaded. Reload the page to try again.',stale:'Unable to update. Showing the last validated collection; retrying automatically.'},es:{loading:'Cargando registros…',error:'No se pudieron cargar los registros. Recargue la página para reintentar.',stale:'No se pudo actualizar. Se muestra la última colección validada; se reintentará automáticamente.'}};
 bar.textContent=state.status==='error'?(state.stale?labels[lang].stale:labels[lang].error):!events.length?labels[lang].loading:t.updated+' '+updatedDate()+' · '+number(events.length)+' '+t.news;
}
window.CaseSource.subscribe(state=>{
 if(state.cases.length&&events!==state.cases){events=state.cases;window.RecordSearch.setCases(events);setup();refreshCaseClock();}
 else renderDataStatus();
});
window.CaseSource.start();

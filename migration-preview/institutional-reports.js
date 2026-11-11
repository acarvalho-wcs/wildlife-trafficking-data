/* Independent, live institutional catalog. Existing report files stay untouched. */
(() => {
 'use strict';
 const url='https://acarvalho-wcs.github.io/wildlife-trafficking-reports/reports-institutional.json';
 const refreshMs=5*60*1000;
 const labels={
  pt:{title:'Relatórios institucionais',intro:'Estudos, diagnósticos, análises e documentos institucionais sobre tráfico de fauna e temas associados.',search:'Pesquisar títulos',category:'Categoria',all:'Todas as categorias',language:'Idioma do documento',format:'Formato',open:'Abrir documento',empty:'Nenhum documento encontrado.',loading:'Carregando documentos…',error:'Não foi possível atualizar o catálogo. Tentaremos novamente em breve.',count:(n,total)=>`${n} de ${total} documentos`,languages:{pt:'Português',en:'Inglês',es:'Espanhol'}},
  en:{title:'Institutional reports',intro:'Institutional studies, assessments, analyses and documents on wildlife trafficking and related subjects.',search:'Search titles',category:'Category',all:'All categories',language:'Document language',format:'Format',open:'Open document',empty:'No documents found.',loading:'Loading documents…',error:'The catalog could not be refreshed. We will try again shortly.',count:(n,total)=>`${n} of ${total} documents`,languages:{pt:'Portuguese',en:'English',es:'Spanish'}},
  es:{title:'Informes institucionales',intro:'Estudios, diagnósticos, análisis y documentos institucionales sobre tráfico de fauna y temas relacionados.',search:'Buscar títulos',category:'Categoría',all:'Todas las categorías',language:'Idioma del documento',format:'Formato',open:'Abrir documento',empty:'No se encontraron documentos.',loading:'Cargando documentos…',error:'No se pudo actualizar el catálogo. Lo intentaremos de nuevo en breve.',count:(n,total)=>`${n} de ${total} documentos`,languages:{pt:'Portugués',en:'Inglés',es:'Español'}}
 };
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
 const lang=()=>Object.hasOwn(labels,document.getElementById('language')?.value)?document.getElementById('language').value:'pt';
 const localized=(row,field,code)=>row[field+'_'+code]||row[field+'_pt']||row[field+'_en']||row[field+'_es']||'';
 let reports=[],introduction={},status='idle',pending=null,active=false,query='',category='',host,originalIntro='';
 function validate(data) {
  if(!data||!Array.isArray(data.reports))throw Error('Invalid catalog');
  const ids=new Set();
  return data.reports.map(row=>{
   if(!row||typeof row.id!=='string'||!row.id.trim()||ids.has(row.id))throw Error('Invalid report ID');
   if(!['pt','en','es'].every(code=>typeof row['title_'+code]==='string'&&row['title_'+code].trim()))throw Error('Missing title');
   if(typeof row.category!=='string'||!row.category.trim()||typeof row.document_language!=='string'||!row.document_language.trim()||String(row.format).toUpperCase()!=='PDF')throw Error('Invalid metadata');
   const link=new URL(row.source_url);
   if(link.protocol!=='https:'||link.hostname!=='drive.google.com'||link.port||link.username||link.password||!/^\/file\/d\/[\w-]+\/view\/?$/.test(link.pathname))throw Error('Invalid Drive link');
   ids.add(row.id);return {...row,source_url:link.href};
  });
 }
 function list() {
  const code=lang(),needle=normalize(query);
  return reports.filter(row=>(!category||row.category===category)&&(!needle||['pt','en','es'].some(c=>normalize(row['title_'+c]).includes(needle))))
   .sort((a,b)=>localized(a,'title',code).localeCompare(localized(b,'title',code),code,{sensitivity:'base'})||a.id.localeCompare(b.id));
 }
 function renderResults() {
  const results=document.getElementById('institutionalResults');if(!results)return;
  const code=lang(),t=labels[code],rows=list();
  results.innerHTML=rows.map(row=>'<article class="reports-report" data-institutional-id="'+escape(row.id)+'"><h4>'+escape(localized(row,'title',code))+'</h4><dl class="reports-meta"><div><dt>'+t.category+'</dt><dd>'+escape(localized(row,'category',code)||row.category)+'</dd></div><div><dt>'+t.language+'</dt><dd>'+escape(t.languages[row.document_language]||row.document_language)+'</dd></div><div><dt>'+t.format+'</dt><dd>PDF</dd></div></dl><a class="reports-access" href="'+escape(row.source_url)+'" target="_blank" rel="noopener noreferrer">'+t.open+' <span aria-hidden="true">↗</span></a></article>').join('')||((status==='ready'||reports.length)?'<p class="reports-empty">'+t.empty+'</p>':'');
  document.getElementById('institutionalCount').textContent=t.count(rows.length,reports.length);
  const notice=document.getElementById('institutionalStatus');
  notice.textContent=status==='error'?t.error:!reports.length&&status!=='ready'?t.loading:'';
  notice.hidden=!notice.textContent;
  results.setAttribute('aria-busy',String(status==='loading'));
 }
 function renderPanel() {
  const panel=document.getElementById('institutionalPanel');if(!panel)return;
  const code=lang(),t=labels[code];
  const categories=[...new Map(reports.map(row=>[row.category,localized(row,'category',code)||row.category])).entries()].sort((a,b)=>a[1].localeCompare(b[1],code));
  if(category&&!categories.some(([key])=>key===category))category='';
  const focus=document.activeElement?.id,selection=document.activeElement?.selectionStart;
  panel.setAttribute('lang',code);
  panel.innerHTML='<h3 id="institutionalTitle">'+t.title+'</h3><p class="institutional-intro">'+escape(introduction[code]||t.intro)+'</p><div class="institutional-controls"><label for="institutionalSearch">'+t.search+'<input type="search" id="institutionalSearch" autocomplete="off" value="'+escape(query)+'" placeholder="'+t.search+'" aria-controls="institutionalResults"></label><label for="institutionalCategory">'+t.category+'<select id="institutionalCategory" aria-controls="institutionalResults"><option value="">'+t.all+'</option>'+categories.map(([key,title])=>'<option value="'+escape(key)+'"'+(category===key?' selected':'')+'>'+escape(title)+'</option>').join('')+'</select></label></div><p id="institutionalCount" role="status" aria-live="polite" aria-atomic="true"></p><p class="reports-status" id="institutionalStatus" role="status" hidden></p><div id="institutionalResults" class="institutional-results"></div>';
  document.getElementById('institutionalSearch').addEventListener('input',e=>{query=e.target.value;renderResults();});
  document.getElementById('institutionalCategory').addEventListener('change',e=>{category=e.target.value;renderResults();});
  renderResults();
  if(active&&['institutionalSearch','institutionalCategory'].includes(focus)){
   const control=document.getElementById(focus);control.focus({preventScroll:true});
   if(focus==='institutionalSearch'&&typeof selection==='number')control.setSelectionRange?.(selection,selection);
  }
 }
 function syncTheme() {
  if(host)host.dataset.institutionalTheme=document.getElementById('mapTheme')?.value==='light'?'light':'dark';
 }
 function enhance() {
  const tabs=host.querySelector('.reports-categories');if(!tabs)return;
  let button=tabs.querySelector('[data-institutional-tab]');
  if(!button){
   originalIntro=host.querySelector('.reports-heading p')?.textContent||'';
   button=document.createElement('button');button.type='button';button.className='reports-category';button.setAttribute('data-institutional-tab','');button.setAttribute('aria-controls','institutionalPanel');
   button.addEventListener('click',()=>{active=true;enhance();});tabs.appendChild(button);
  }
  button.innerHTML='<span>'+labels[lang()].title+'</span><span class="reports-category-mark" aria-hidden="true">›</span>';
  button.setAttribute('aria-pressed',String(active));
  if(active)tabs.querySelectorAll('[data-report-category]').forEach(tab=>tab.setAttribute('aria-pressed','false'));
  let panel=document.getElementById('institutionalPanel');
  if(!panel){panel=document.createElement('section');panel.id='institutionalPanel';panel.className='reports-list';panel.setAttribute('aria-labelledby','institutionalTitle');host.appendChild(panel);}
  panel.hidden=!active;host.querySelector('#reportsList').hidden=active;
  host.classList.toggle('institutional-active',active);
  const intro=host.querySelector('.reports-heading p');if(intro){intro.hidden=active;if(!active)intro.textContent=originalIntro;}
  syncTheme();renderPanel();
 }
 function refresh() {
  if(pending)return pending;
  status='loading';renderResults();
  pending=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});
    if(!response.ok)throw Error('Unavailable catalog');
    const data=await response.json(),next=validate(data);
    reports=next;introduction=data.introduction||{};status='ready';
   }catch{status='error';}finally{clearTimeout(timer);pending=null;renderPanel();}
  })();return pending;
 }
 function init() {
  host=document.getElementById('reportsView');if(!host)return;
  // Only observe replacement of the existing report view, never its internal controls.
  new MutationObserver(records=>{if(records.some(record=>record.type==='childList'&&record.target===host))enhance();}).observe(host,{childList:true});
  host.addEventListener('click',e=>{if(e.target.closest('[data-report-category]'))active=false;},true);
  document.getElementById('mapTheme')?.addEventListener('change',syncTheme);
  const map=document.getElementById('mapViewCard');
  if(map)new MutationObserver(syncTheme).observe(map,{attributes:true,attributeFilter:['data-map-theme','data-globe-theme']});
  enhance();refresh();
  setInterval(()=>{if(!document.hidden)refresh();},refreshMs);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('focus',()=>{if(!document.hidden)refresh();});
 }
 window.InstitutionalReports={refresh,state:()=>({reports:[...reports],status}),url};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

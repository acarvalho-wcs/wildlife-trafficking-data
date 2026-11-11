/* Report page and publication notice: independent of cases and map controls. */
(function () {
 'use strict';
 const labels={
  pt:{title:'RELATÓRIOS',intro:'Relatórios produzidos pelo Programa de Inteligência para Conservação da WCS Brasil a partir do monitoramento do Observatório Global de Tráfico de Animais.',weekly:'Relatórios semanais',semiannual:'Relatórios semestrais',annual:'Relatórios anuais',period:'Período',year:'Ano',languages:'Idiomas disponíveis',view:'Ver relatório',empty:'Nenhum relatório publicado nesta categoria até o momento.',loading:'Carregando relatórios…',error:'Não foi possível atualizar esta categoria agora. Tentaremos novamente em breve.',latest:'Último relatório publicado',notice:'Confira o relatório mais recente do Observatório Global de Tráfico de Animais.',close:'Fechar',changeLanguage:'Alterar idioma',unavailable:'Não informado'},
  en:{title:'REPORTS',intro:'Reports produced by the WCS Brazil Conservation Intelligence Program based on monitoring conducted through the Illegal Wildlife Trafficking Global Observatory.',weekly:'Weekly Reports',semiannual:'Semiannual Reports',annual:'Annual Reports',period:'Period',year:'Year',languages:'Available languages',view:'View report',empty:'No reports have been published in this category yet.',loading:'Loading reports…',error:'This category could not be refreshed right now. We will try again shortly.',latest:'Latest report',notice:'View the latest report from the Illegal Wildlife Trafficking Global Observatory.',close:'Close',changeLanguage:'Change language',unavailable:'Not reported'},
  es:{title:'INFORMES',intro:'Informes producidos por el Programa de Inteligencia para la Conservación de WCS Brasil a partir del monitoreo del Observatorio Global del Tráfico de Animales.',weekly:'Informes semanales',semiannual:'Informes semestrales',annual:'Informes anuales',period:'Período',year:'Año',languages:'Idiomas disponibles',view:'Ver informe',empty:'Aún no se han publicado informes en esta categoría.',loading:'Cargando informes…',error:'No se pudo actualizar esta categoría ahora. Lo intentaremos de nuevo en breve.',latest:'Último informe publicado',notice:'Consulte el informe más reciente del Observatorio Global del Tráfico de Animales.',close:'Cerrar',changeLanguage:'Cambiar idioma',unavailable:'No informado'}
 };
 const languageNames={pt:'Português',en:'English',es:'Español'},locales={pt:'pt-BR',en:'en-GB',es:'es-ES'};
 const source=window.WeeklyReportSource,categories=Object.keys(source.feeds);
 const languageKey='observatory-report-modal-language',sessionKey='observatory-report-modal-shown';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeGet=(storage,key)=>{try{return window[storage].getItem(key);}catch{return null;}};
 const safeSet=(storage,key,value)=>{try{window[storage].setItem(key,value);}catch{/* In-memory guards also prevent reopening. */}};
 let currentLanguage='pt',selectedCategory='weekly',initialized=false;
 let modalLanguage=safeGet('localStorage',languageKey),shown=safeGet('sessionStorage',sessionKey)==='1',dialog=null,featured=null,previousFocus=null;
 if(!labels[modalLanguage])modalLanguage=null;
 function localized(report,field,lang) {
  return report[field+'_'+lang]||['pt','en','es'].map(code=>report[field+'_'+code]).find(Boolean)||'';
 }
 function period(report,lang) {
  const format=new Intl.DateTimeFormat(locales[lang],{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const start=new Date(report.period_start+'T12:00:00Z'),end=new Date(report.period_end+'T12:00:00Z');
  return format.formatRange?format.formatRange(start,end):format.format(start)+' – '+format.format(end);
 }
 function metadata(report,lang) {
  const t=labels[lang];
  return '<dl class="reports-meta"><div><dt>'+t.period+'</dt><dd>'+escape(period(report,lang))+'</dd></div><div><dt>'+t.year+'</dt><dd>'+escape(report.year)+'</dd></div><div><dt>'+t.languages+'</dt><dd>'+escape(report.languages.map(code=>languageNames[code]).join(' · ')||t.unavailable)+'</dd></div><div><dt>DOI</dt><dd>'+(report.doi?'<a href="https://doi.org/'+escape(report.doi)+'" target="_blank" rel="noopener noreferrer">'+escape(report.doi)+'</a>':t.unavailable)+'</dd></div></dl>';
 }
 function access(report,lang,useDoi=false) {
  return '<a class="reports-access" href="'+escape(useDoi&&report.doi?'https://doi.org/'+report.doi:report.zenodo_url)+'" target="_blank" rel="noopener noreferrer">'+labels[lang].view+' <span aria-hidden="true">↗</span></a>';
 }
 function render(lang='pt') {
  const nextLanguage=labels[lang]?lang:'pt',changed=nextLanguage!==currentLanguage;
  currentLanguage=nextLanguage;
  window.ObservatoryCitation?.render(currentLanguage);
  if(changed&&dialog?.open&&modalLanguage){modalLanguage=currentLanguage;safeSet('localStorage',languageKey,modalLanguage);renderModal();}
  const host=document.getElementById('reportsView');if(!host)return;
  const t=labels[currentLanguage],state=source.state();
  const records=state.reports.filter(r=>r.type===selectedCategory).sort((a,b)=>b.period_end.localeCompare(a.period_end)||a.id.localeCompare(b.id));
  const status=state.statuses[selectedCategory];
  const notice=status==='error'?t.error:!records.length&&(status==='loading'||status==='idle')?t.loading:'';
  const focusCategory=host.contains(document.activeElement)?document.activeElement?.dataset.reportCategory:null;
  host.innerHTML='<header class="reports-heading"><h2 id="weeklyReportsTitle">'+t.title+'</h2><p>'+t.intro+'</p></header>'+
   '<div class="reports-categories" role="group" aria-label="'+t.title+'">'+categories.map(type=>'<button type="button" class="reports-category" data-report-category="'+type+'" aria-controls="reportsList" aria-pressed="'+(type===selectedCategory)+'"><span>'+t[type]+'</span><span class="reports-category-mark" aria-hidden="true">›</span></button>').join('')+'</div>'+
   '<section class="reports-list" id="reportsList" aria-labelledby="reportsCategoryTitle" aria-live="polite" aria-busy="'+(status==='loading')+'"><h3 id="reportsCategoryTitle">'+t[selectedCategory]+'</h3>'+
   (notice?'<p class="reports-status" role="status">'+notice+'</p>':'')+
   (records.length?records.map(report=>'<article class="reports-report" data-report-id="'+escape(report.id)+'"><h4>'+escape(localized(report,'title',currentLanguage))+'</h4><p class="reports-summary">'+escape(localized(report,'summary',currentLanguage))+'</p>'+metadata(report,currentLanguage)+access(report,currentLanguage)+'</article>').join(''):notice?'':'<p class="reports-empty">'+t.empty+'</p>')+'</section>';
  host.querySelectorAll('[data-report-category]').forEach(button=>button.addEventListener('click',()=>{selectedCategory=button.dataset.reportCategory;render(currentLanguage);}));
  if(focusCategory)host.querySelector('[data-report-category="'+focusCategory+'"]')?.focus({preventScroll:true});
 }
 function renderModal(chooseLanguage=false) {
  const lang=modalLanguage,t=labels[lang];
  if(!lang||chooseLanguage){
   dialog.setAttribute('lang','pt');
   dialog.setAttribute('aria-labelledby','reportModalLanguageTitle');
   dialog.removeAttribute('aria-describedby');
   dialog.innerHTML='<button class="reports-modal-close" type="button" data-report-close aria-label="Fechar / Close / Cerrar">×</button><div class="reports-modal-content"><h2 class="reports-language-title" id="reportModalLanguageTitle"><span lang="pt">Selecione o idioma</span> / <span lang="en">Select language</span> / <span lang="es">Seleccione el idioma</span></h2><div class="reports-language-options">'+Object.entries(languageNames).map(([code,name])=>'<button type="button" lang="'+code+'" data-report-language="'+code+'">'+name+'</button>').join('')+'</div></div>';
  } else {
   dialog.setAttribute('lang',lang);dialog.setAttribute('aria-labelledby','reportModalTitle');dialog.setAttribute('aria-describedby','reportModalIntro');
   dialog.innerHTML='<button class="reports-modal-close" type="button" data-report-close aria-label="'+t.close+'">×</button><div class="reports-modal-content">'+window.ObservatoryCitation.markup(lang,true)+'<h2 id="reportModalTitle">'+t.latest+'</h2><p class="reports-modal-intro" id="reportModalIntro">'+t.notice+'</p><article data-report-id="'+escape(featured.id)+'"><span class="reports-category-label">'+t[featured.type]+'</span><h3>'+escape(localized(featured,'title',lang))+'</h3><p class="reports-summary">'+escape(localized(featured,'summary',lang))+'</p>'+metadata(featured,lang)+access(featured,lang,true)+'</article><button type="button" class="reports-change-language" data-report-choose>'+t.changeLanguage+'</button></div>';
  }
  window.ObservatoryCitation.bind(dialog,lang||'pt');
  dialog.querySelector('[data-report-close]').addEventListener('click',()=>dialog.close());
  dialog.querySelectorAll('[data-report-language]').forEach(button=>button.addEventListener('click',()=>{
   modalLanguage=button.dataset.reportLanguage;safeSet('localStorage',languageKey,modalLanguage);renderModal();dialog.scrollTop=0;dialog.querySelector('[data-report-close]').focus({preventScroll:true});
  }));
  dialog.querySelector('[data-report-choose]')?.addEventListener('click',()=>{renderModal(true);dialog.querySelector('[data-report-language]').focus();});
 }
 function showLatest() {
  if(shown||!source.state().loaded)return;
  const report=source.latest();if(!report)return;
  const element=document.createElement('dialog');
  if(typeof element.showModal!=='function')return;
  featured=report;dialog=element;dialog.className='reports-modal';
  document.body.appendChild(dialog);renderModal();previousFocus=document.activeElement;
  dialog.addEventListener('close',()=>{dialog.remove();previousFocus?.focus({preventScroll:true});});
  dialog.showModal();shown=true;safeSet('sessionStorage',sessionKey,'1');
  dialog.querySelector(modalLanguage?'[data-report-close]':'[data-report-language]').focus();
 }
 function init() {
  if(initialized)return;initialized=true;
  render(document.getElementById('language')?.value||'pt');
  source.start();
 }
 source.subscribe(()=>{
  const latest=source.latest();
  if(dialog?.open&&latest&&JSON.stringify(latest)!==JSON.stringify(featured)){
   featured=latest;renderModal();
  }
  render(currentLanguage);showLatest();
 });
 window.WeeklyReports={render};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

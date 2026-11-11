/* Delegated user-action listeners; survives rerenders without duplicate listeners. */
(() => {
 'use strict';
 const A=window.ObservatoryAnalytics;if(!A||window.__observatoryAnalyticsEvents)return;
 window.__observatoryAnalyticsEvents=true;
 const send=(name,data)=>A.track(name,data),get=id=>document.getElementById(id);
 let searchTimer,lastSearch='',area=A.page;
 function searchUsed(){clearTimeout(searchTimer);const term=get('recordSearch')?.value.trim()||'';if(!term){lastSearch='';return;}if(term===lastSearch)return;lastSearch=term;send('search_use');send('filter_apply',{filter_type:'text'});}
 document.addEventListener('input',e=>{try{if(!e.isTrusted||e.target.id!=='recordSearch')return;clearTimeout(searchTimer);searchTimer=setTimeout(searchUsed,700);}catch{}},true);
 document.addEventListener('keydown',e=>{try{if(!e.isTrusted||e.target.id!=='recordSearch')return;if(e.key==='Enter')searchUsed();if(e.key==='Escape'){clearTimeout(searchTimer);lastSearch='';}}catch{}},true);
 document.addEventListener('change',e=>{try{
  if(!e.isTrusted)return;const id=e.target.id;
  if(['language','publicationLanguage','methodologyLanguage'].includes(id)){A.changeLanguage(e.target.value);return;}
  const type={country:'country',species:'fauna',year:'date',mode:'modal'}[id];if(type)send('filter_apply',{filter_type:type});
 }catch{}},true);
 function click(e){try{
  if(!e.isTrusted||(e.type==='auxclick'&&e.button!==1))return;
  const node=e.target.closest?.('a,button');if(!node)return;
  if(node.id==='clearRecordSearch'){clearTimeout(searchTimer);lastSearch='';}
  if(node.id==='clear')send('filter_apply',{filter_type:'other'});
  if(node.dataset.metric)send('filter_apply',{filter_type:node.dataset.metric==='group'?'fauna':'modal'});
  if(node.dataset.view&&node.dataset.view!==area){area=node.dataset.view;send('section_view',{page:area});}
  if(node.matches('[data-publications-link]')){send('section_view',{page:'publications'});return;}
  if(!node.href)return;
  const url=new URL(node.href,location.href),pub=node.closest('[data-publication-id]'),report=node.closest('[data-report-id]');
  if(pub){
   const publication_id=pub.dataset.publicationId;
   if(node.matches('.publication-primary,.publication-secondary'))send('publication_open',{publication_id,publication_type:pub.dataset.publicationType});
   if(url.hostname==='zenodo.org')send('zenodo_click',{publication_id});
  }
  if(report){
   const report_id=report.dataset.reportId,r=window.WeeklyReportSource?.state().reports.find(r=>r.id===report_id);
   if(node.matches('.reports-access'))send('report_open',{report_id,report_type:r?.type});
   if(/\.pdf$/i.test(url.pathname)||node.hasAttribute('data-report-pdf'))send('report_pdf',{report_id,report_type:r?.type});
  }
  if(url.hostname==='doi.org'||url.hostname==='dx.doi.org')send('doi_click',{paper_id:node.dataset.paperId});
  if(url.origin===location.origin&&/\/research\//.test(url.pathname))send('research_open',{paper_id:node.dataset.paperId});
  else if((url.origin===location.origin&&/\/reportage\//.test(url.pathname))||(!pub&&!report&&node.matches('.popup-news,.source-link')))send('news_open',{news_id:node.dataset.newsId});
  if(url.origin===location.origin&&url.pathname.endsWith('/how-it-works.html'))send('section_view',{page:'how-it-works'});
 }catch{/* Broken analytics or an unexpected link never blocks the user's action. */}}
 document.addEventListener('click',click,true);document.addEventListener('auxclick',click,true);
})();

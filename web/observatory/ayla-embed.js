/* AYLA wall GLOBE: runs only when ?ayla-wall=1.
 * Reuses the Observatory's own globe engine, markers, verified routes, case
 * details and temporal filters; never exposes privileged Firestore documents.
 */
(function(){
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('ayla-wall')!=='1')return;
 document.documentElement.classList.add('ayla-embed');
 const $=id=>document.getElementById(id);
 const available=['pt','en','es'];
 const titles={pt:'OBSERVATÓRIO GLOBAL · GLOBE DARK',en:'GLOBAL OBSERVATORY · DARK GLOBE',es:'OBSERVATORIO GLOBAL · GLOBE DARK'};
 const filters={pt:'Filtros',en:'Filters',es:'Filtros'};
 let currentLanguage=available.includes(params.get('lang'))?params.get('lang'):'en';
 let requestedFiltersOpen=false;
 function sendReady(){
  if(window.parent===window)return;
  try{window.parent.postMessage({type:'ayla:observatory-ready',version:1},location.origin)}catch(e){}
 }
 function translate(){
  const lang=window.ObservatoryLanguage?.get()||currentLanguage;
  $('aylaEmbedTitle').textContent=titles[lang]||titles.en;
  $('aylaEmbedFilters').textContent=filters[lang]||filters.en;
 }
 function setLanguage(lang){
  if(!available.includes(lang))return;
  currentLanguage=lang;
  window.ObservatoryLanguage?.set(lang);
  const el=$('language');if(el&&el.value!==lang)el.value=lang;
  translate();
 }
 function setDark(){
  // Select the Observatory's real dark GLOBE theme, not a mock imitation.
  try{localStorage.setItem('observatory-globe-theme','dark')}catch(e){}
  const el=$('mapTheme');
  if(el&&el.value!=='dark'){el.value='dark';el.dispatchEvent(new Event('change',{bubbles:true}))}
  // The Observatory already starts in globe mode; enforce if user saved MAP.
  const globe=$('globeMode');if(globe&&globe.getAttribute('aria-pressed')!=='true')globe.click();
  const routes=$('routeLayer');if(routes&&!routes.checked){routes.checked=true;routes.dispatchEvent(new Event('change',{bubbles:true}))}
 }
 function setLast7(){
  if(!window.ObservatoryTime?.apply)return;
  try{window.ObservatoryTime.apply({basis:'occurrence_or_publication',preset:'last7',compare:false})}
  catch(e){console.warn('[AYLA] Observatory temporal filter',e)}
 }
 function setFilters(open){
  requestedFiltersOpen=!!open;
  document.documentElement.classList.toggle('filters-open',requestedFiltersOpen);
  const host=$('mapFiltersHost');
  if(host)host.hidden=!requestedFiltersOpen;
  const b=$('aylaEmbedFilters');
  if(b)b.setAttribute('aria-expanded',String(requestedFiltersOpen));
  window.ObservatoryGlobe?.resize?.();
 }
 function init(){
  if(!$('mapViewCard')||!window.ObservatoryGlobe||!window.ObservatoryTime)return;
  // Move the Observatory's actual filter form, not a copy, so all selections
  // affect the original rendering and can change freely.
  const host=$('mapFiltersHost'),form=document.querySelector('#dashboardView > .filters');
  if(host&&form&&form.parentElement!==host)host.append(form);
  if(host)host.hidden=true;
  const controls=document.createElement('div');controls.className='ayla-embed-controls';
  controls.innerHTML='<span class="ayla-embed-title" id="aylaEmbedTitle"></span><button type="button" id="aylaEmbedFilters" aria-expanded="false"></button>';
  $('mapViewCard').append(controls);
  $('aylaEmbedFilters').onclick=()=>setFilters(!requestedFiltersOpen);
  setLanguage(currentLanguage);
  setDark();setLast7();setFilters(false);
  // The Observatory's own code remains responsible for map resizing.
  window.ObservatoryGlobe.resize();
  window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==window.parent)return;
   const msg=event.data;
   if(!msg||msg.type!=='ayla:observatory-config')return;
   if(available.includes(msg.lang))setLanguage(msg.lang);
   if(msg.dark===true)setDark();
   if(typeof msg.filtersOpen==='boolean')setFilters(msg.filtersOpen);
   if(msg.resetSevenDays===true)setLast7();
  });
  window.ObservatoryLanguage?.subscribe(translate);
  window.addEventListener('resize',()=>window.ObservatoryGlobe?.resize?.());
  sendReady();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();

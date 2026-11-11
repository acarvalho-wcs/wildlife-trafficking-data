/* Navigation only; independent of Reports, cases and maps. */
(() => {
 const select=document.getElementById('language');
 const labels={pt:'Publicações',en:'Publications',es:'Publicaciones'};
 const nodes=[...document.querySelectorAll('[data-publications-link]')];
 function language(){return Object.hasOwn(labels,select?.value)?select.value:'pt';}
 function sync(){for(const node of nodes)node.querySelector('span').textContent=labels[language()];}
 for(const node of nodes)node.addEventListener('click',()=>{
  const lang=language();try{localStorage.setItem('observatory-language',lang);}catch{}
  location.assign('publications.html?lang='+lang);
 });
 select?.addEventListener('change',sync);window.addEventListener('pageshow',sync);sync();
 // Return links from the independent page use the existing navigation buttons.
 const view=new URLSearchParams(location.search).get('view');
 if(['dashboard','events','species','sources','reports'].includes(view))document.querySelector('.nav [data-view="'+view+'"]')?.click();
})();

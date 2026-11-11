/* Direct login navigation, following the dashboard's global language. */
(() => {
 const select=document.getElementById('language');
 const labels={pt:'Área Restrita',en:'Restricted Area',es:'Área Restringida'};
 const names={pt:'Observatório Global de Tráfico de Animais',en:'Illegal Wildlife Trafficking Global Observatory',es:'Observatorio Global de Tráfico de Animales'};
 function sync(){
  const lang=Object.hasOwn(labels,select?.value)?select.value:'pt';
  document.querySelectorAll('[data-restricted-area-link]').forEach(link=>{link.querySelector('span').textContent=labels[lang];});
  document.querySelectorAll('[data-observatory-logo]').forEach(img=>{img.alt=names[lang];});
 }
 select?.addEventListener('change',sync);window.addEventListener('pageshow',sync);sync();
})();

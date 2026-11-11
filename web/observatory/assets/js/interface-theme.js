/* Interface appearance is independent of MAP/GLOBE basemap colors. */
(() => {
 const key='observatory-interface-theme',root=document.documentElement;
 const valid=value=>value==='dark'||value==='light';
 const read=()=>{try{return localStorage.getItem(key);}catch{return null;}};
 root.dataset.interfaceTheme=valid(read())?read():'dark';
 function init(){
  const group=document.getElementById('interfaceTheme'),language=document.getElementById('language');
  if(!group||!language)return;
  const buttons=group.querySelectorAll('[data-interface-theme]');
  const labels={pt:['Idioma','Tema da interface'],en:['Language','Interface theme'],es:['Idioma','Tema de la interfaz']};
  function sync(){
   const text=labels[language.value]||labels.pt;
   language.setAttribute('aria-label',text[0]);group.setAttribute('aria-label',text[1]);
   buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.interfaceTheme===root.dataset.interfaceTheme)));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
   root.dataset.interfaceTheme=button.dataset.interfaceTheme;
   try{localStorage.setItem(key,root.dataset.interfaceTheme);}catch{}
   sync();
  }));
  language.addEventListener('change',sync);
  window.addEventListener('storage',event=>{if(event.key===key){root.dataset.interfaceTheme=valid(event.newValue)?event.newValue:'dark';sync();}});
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

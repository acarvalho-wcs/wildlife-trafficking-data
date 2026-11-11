/* Small navigation bridge; preserves the dashboard's existing language handler. */
(() => {
 const language=document.getElementById('language'),link=document.getElementById('howItWorksLink');
 if(!language||!link)return;
 const key='observatory-language',labels={pt:'Como funciona',en:'How it works',es:'Cómo funciona'};
 const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
 const save=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
 function sync(){
  const lang=Object.hasOwn(labels,language.value)?language.value:'pt';
  const theme=document.getElementById('mapTheme')?.value;
  link.textContent=labels[lang];link.href='how-it-works.html?lang='+lang+(['dark','light'].includes(theme)?'&theme='+theme:'');save(key,lang);
 }
 function restore(preferURL){
  const requested=preferURL?new URLSearchParams(location.search).get('lang'):null;
  const value=Object.hasOwn(labels,requested)?requested:read(key);
  if(Object.hasOwn(labels,value)&&language.value!==value){language.value=value;language.dispatchEvent(new Event('change',{bubbles:true}));}
  sync();
 }
 language.addEventListener('change',sync);
 link.addEventListener('click',sync);
 window.addEventListener('pageshow',e=>{if(e.persisted)restore(false);});
 restore(true);
})();

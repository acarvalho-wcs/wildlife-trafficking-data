/* Shared Observatory language preference across all GitHub Pages sections. */
(function(){
 'use strict';
 const key='observatory-language',valid=x=>['pt','en','es'].includes(x);
 const param=()=>{try{return new URLSearchParams(location.search).get('lang')}catch{return null}};
 const read=()=>{try{return localStorage.getItem(key)}catch{return null}};
 const initial=param(), saved=read();
 let language=valid(saved)?saved:valid(initial)?initial:'en';
 const subscribers=new Set();
 function notify(value){for(const fn of subscribers){try{fn(value)}catch(error){console.error(error)}}}
 function set(value){
  if(!valid(value))return language;
  const changed=language!==value;language=value;
  try{localStorage.setItem(key,value)}catch{}
  if(changed)notify(value);
  return value;
 }
 window.addEventListener('storage',event=>{
  if(event.key!==key)return;
  const next=valid(event.newValue)?event.newValue:'en';
  if(next!==language){language=next;notify(next)}
 });
 document.addEventListener('click',event=>{
  const a=event.target.closest?.('a[href]');
  if(!a||a.hasAttribute('download')||a.target==='_blank')return;
  try{
   const u=new URL(a.href,location.href);
   if(u.origin!==location.origin||!u.pathname.startsWith('/wildlife-trafficking-data/'))return;
   if(u.searchParams.has('lang')){u.searchParams.set('lang',language);a.href=u.href}
  }catch{}
 },true);
 window.ObservatoryLanguage={get:()=>language,set,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn)},valid};
 if(!valid(saved)&&valid(initial))set(initial);
})();

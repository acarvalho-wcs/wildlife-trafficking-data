/* In-memory search only. Case and route sources remain authoritative and untouched. */
(() => {
 'use strict';
 const labels={
  pt:{label:'Buscar registros',placeholder:'Buscar espécie, local, rota, país, termo...',clear:'Limpar busca',zero:'Nenhum registro encontrado',one:'registro encontrado',many:'registros encontrados'},
  en:{label:'Search records',placeholder:'Search species, location, route, country, term...',clear:'Clear search',zero:'No records found',one:'record found',many:'records found'},
  es:{label:'Buscar registros',placeholder:'Buscar especie, lugar, ruta, país, término...',clear:'Limpiar búsqueda',zero:'Ningún registro encontrado',one:'registro encontrado',many:'registros encontrados'}
 };
 const normalize=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
 let cases=[],base=new Map(),index=new Map(),query='',timer,onChange=()=>{},input,clear;
 // Traverse values (not schema keys), including nested taxon/items/route objects.
 function strings(value,out,seen=new WeakSet()){
  if(typeof value==='string'||typeof value==='number'){
   out.push(String(value));
   const translated=window.NEWS_TERMS?.[value];
   if(translated)out.push(...translated);
  }else if(value&&typeof value==='object'&&!seen.has(value)){
   seen.add(value);Object.values(value).forEach(v=>strings(v,out,seen));
  }
  return out;
 }
 function routeIndex(){
  const routes=new Map();
  for(const item of window.DocumentedRoutes?.segments(cases,cases)||[]){
   const perCase=routes.get(item.event.id)||new Map();
   if(!perCase.has(item.route.id))perCase.set(item.route.id,normalize(strings(item.route,[]).join(' ')));
   routes.set(item.event.id,perCase);
  }
  index=new Map(cases.map(e=>[e.id,base.get(e.id)+' '+[...(routes.get(e.id)?.values()||[])].join(' ')]));
 }
 function setCases(next){
  if(next===cases)return;
  cases=next;base=new Map(cases.map(e=>[e.id,normalize(strings(e,[]).join(' '))]));routeIndex();
 }
 function apply(){clearTimeout(timer);query=normalize(input.value);onChange();}
 function reset(){clearTimeout(timer);input.value='';clear.hidden=true;apply();input.focus();}
 function init(callback){
  onChange=callback;input=document.getElementById('recordSearch');clear=document.getElementById('clearRecordSearch');
  input.addEventListener('input',()=>{clear.hidden=!input.value;clearTimeout(timer);timer=setTimeout(apply,125);});
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();reset();}});
  clear.addEventListener('click',reset);
  window.DocumentedRoutes?.subscribe(()=>{if(window.DocumentedRoutes.state().status==='ready'){routeIndex();if(query)onChange();}});
 }
 function localize(lang,count){
  const t=labels[lang]||labels.pt;
  document.getElementById('recordSearchLabel').textContent=t.label;
  input.placeholder=t.placeholder;clear.title=t.clear;clear.setAttribute('aria-label',t.clear);
  document.getElementById('recordSearchCount').textContent=count?count.toLocaleString({pt:'pt-BR',en:'en-US',es:'es-ES'}[lang])+' '+(count===1?t.one:t.many):t.zero;
 }
 window.RecordSearch={init,setCases,localize,normalize,matches:e=>!query||(index.get(e.id)||'').includes(query)};
})();

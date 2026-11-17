/* Transparent, filter-driven country ranking in the MAP/GLOBE presentation view.
   Consume the same filtered event records as the main dashboard; never cache or change filters. */
window.CleanMapCountryChart=(()=>{
 'use strict';
 const strings={
  pt:{title:'Eventos por país',events:'eventos',countries:'países',other:'Outros países',unknown:'País não informado',empty:'Nenhum evento no recorte selecionado',showing:(shown,total)=>shown===total?'Todos os países':'Principais países + demais agrupados'},
  en:{title:'Events by country',events:'events',countries:'countries',other:'Other countries',unknown:'Country not reported',empty:'No events in the selected period',showing:(shown,total)=>shown===total?'All countries':'Leading countries + remaining grouped'},
  es:{title:'Eventos por país',events:'eventos',countries:'países',other:'Otros países',unknown:'País no informado',empty:'No hay eventos en la selección',showing:(shown,total)=>shown===total?'Todos los países':'Países principales + restantes agrupados'}
 };
 const locale={pt:'pt-BR',en:'en-US',es:'es-ES'};
 const number=(n,lang)=>new Intl.NumberFormat(locale[lang]||locale.en).format(n);

 function summarize(records,{countable=()=>true,countryLabel=e=>e.country,limit=8}={}){
  const countries=new Map();
  let total=0;
  for(const event of records||[]){
   if(!countable(event))continue;
   const key=String(event.country||'').trim();
   const found=countries.get(key);
   if(found)found.count+=1;
   else countries.set(key,{key,label:String(countryLabel(event)||'').trim(),count:1});
   total+=1;
  }
  const sorted=[...countries.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
  const limitCount=Math.max(1,Math.floor(Number(limit)||8));
  const displayed=sorted.slice(0,limitCount);
  const remaining=sorted.slice(limitCount);
  return {
   total,countries:sorted.length,
   rows:displayed,
   remainingEvents:remaining.reduce((n,c)=>n+c.count,0),
   remainingCountries:remaining.length,
   max:Math.max(1,...displayed.map(c=>c.count)),
   showing:displayed.length
  };
 }

 function render({root,records,lang='en',countable,countryLabel,limit=8}){
  if(!root)return;
  const t=strings[lang]||strings.en;
  const summary=summarize(records,{countable,countryLabel,limit});
  root.querySelector('#cleanCountryTitle').textContent=t.title;
  root.querySelector('#cleanCountrySummary').textContent=number(summary.total,lang)+' '+t.events+'  ·  '+number(summary.countries,lang)+' '+t.countries;
  const list=root.querySelector('#cleanCountryRows');
  list.replaceChildren();
  if(!summary.total){
   const empty=document.createElement('p');
   empty.className='clean-country-empty';
   empty.textContent=t.empty;
   list.append(empty);
   root.querySelector('#cleanCountryNote').textContent='';
   return summary;
  }
  const rows=[...summary.rows];
  if(summary.remainingCountries){
   rows.push({key:'__remaining__',label:t.other+' ('+number(summary.remainingCountries,lang)+')',count:summary.remainingEvents,other:true});
  }
  for(const country of rows){
   const item=document.createElement('div');
   item.className='clean-country-row'+(country.other?' other':'');
   item.setAttribute('role','listitem');
   const label=document.createElement('div');
   label.className='clean-country-row-head';
   const countryName=document.createElement('span');
   countryName.className='clean-country-name';
   countryName.textContent=country.label||t.unknown;
   const value=document.createElement('span');
   value.className='clean-country-value';
   value.textContent=number(country.count,lang);
   label.append(countryName,value);
   const rail=document.createElement('div');
   rail.className='clean-country-bar-rail';
   const fill=document.createElement('span');
   fill.className='clean-country-bar';
   fill.style.width=(Math.min(100,100*country.count/summary.max)).toFixed(1)+'%';
   rail.append(fill);
   item.setAttribute('aria-label',(country.label||t.unknown)+': '+number(country.count,lang)+' '+t.events);
   item.append(label,rail);
   list.append(item);
  }
  root.querySelector('#cleanCountryNote').textContent=t.showing(summary.showing,summary.countries);
  return summary;
 }
 return Object.freeze({summarize,render});
})();
/* Single connected mini-card for clean GLOBE only. Never alters event feeds or map layers. */
window.CleanMapStoryCards=(()=>{
 'use strict';
 const duration=12000;
 const words={
  pt:{kicker:'APREENSÃO DOCUMENTADA',event:'Evento',published:'Publicação',units:'itens',open:'Abrir ficha do evento'},
  en:{kicker:'DOCUMENTED SEIZURE',event:'Event',published:'Publication',units:'items',open:'Open event details'},
  es:{kicker:'DECOMISO DOCUMENTADO',event:'Evento',published:'Publicación',units:'elementos',open:'Abrir ficha del evento'}
 };
 const locales={pt:'pt-BR',en:'en-US',es:'es-ES'};
 const isGeo=e=>e&&Number.isFinite(e.lat)&&Number.isFinite(e.lng)&&Math.abs(e.lat)<=90&&Math.abs(e.lng)<=180;
 function candidates(records,countable=()=>true){
  return (records||[]).filter(e=>isGeo(e)&&countable(e)&&e.id!=null);
 }
 function dateValue(value,lang){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '—';
  const time=Date.parse(value+'T12:00:00Z');
  if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)return '—';
  return new Intl.DateTimeFormat(locales[lang]||locales.en,{
   timeZone:'UTC',day:'numeric',month:'short',year:'numeric'
  }).format(new Date(time));
 }
 function format(e,r={},lang='en'){
  const t=words[lang]||words.en;
  if(e.sourceType==='ibama')return formatIbama(e,lang);
  return {
   kicker:t.kicker+' · OSINT',
   title:String(r.title||r.city||e.city||r.country||e.country||''),
   place:[r.city||e.city,r.country||e.country].filter(Boolean).join(' · '),
   eventDate:t.event+': '+dateValue(e.event_date,lang),
   publicationDate:t.published+': '+dateValue(e.publication_date,lang),
   description:String(r.summary||e['card_text_'+lang]||e.summary||''),
   fauna:String(r.species||e.species||''),
   quantity:Number.isFinite(e.items)&&e.items>0?
    new Intl.NumberFormat(locales[lang]||locales.en).format(e.items)+' '+t.units:'',
   aria:t.open
  };
 }
 function formatIbama(e,lang){
  const p=e.p||{},o=p.official||{},t=({pt:{k:'DADOS OFICIAIS · IBAMA',notice:'Autuação',fact:'Fato',title:'Infração ambiental contra a fauna',open:'Abrir auto de infração',seized:'Apreendidos (termo vinculado)',original:'Texto oficial em português'},en:{k:'OFFICIAL DATA · IBAMA',notice:'Notice',fact:'Reported event',title:'Wildlife administrative infraction',open:'Open infraction notice',seized:'Seized (linked term)',original:'Official text in Portuguese'},es:{k:'DATOS OFICIALES · IBAMA',notice:'Acta',fact:'Hecho declarado',title:'Infracción administrativa contra la fauna',open:'Abrir acta de infracción',seized:'Incautados (acta vinculada)',original:'Texto oficial en portugués'}})[lang]||{k:'IBAMA',notice:'Notice',fact:'Event',title:'Wildlife infraction',open:'Open notice',seized:'Seized',original:'Portuguese'};
  const raw=String(o.fact_date||''),match=/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/.exec(raw),fact=match?match[3]+'-'+match[2]+'-'+match[1]:raw.slice(0,10),reported=dateValue(fact,lang);
  const items=(p.seized_specimens||[]).filter(x=>x.scientific_name||x.common_name||Number.isFinite(x.quantity));
  const names=[...new Set((p.species_referenced||[]).concat(items).map(x=>x.scientific_name||x.common_name).filter(Boolean))];
  const quantities=items.filter(x=>Number.isFinite(x.quantity)&&x.quantity>0&&x.unit).slice(0,3).map(x=>[x.common_name||x.scientific_name,new Intl.NumberFormat(locales[lang]||locales.en).format(x.quantity),x.unit].filter(Boolean).join(' '));
  const title=String(o.infraction_description||p.description||t.title),body=String(o.narrative_detail||p.description||'').replace(/\s+/g,' ').trim();
  const description=body.length>240?body.slice(0,240).replace(/\s+\S*$/,'')+'…':body;
  return {kicker:t.k,title,place:[p.municipality,p.uf,({pt:'Brasil',en:'Brazil',es:'Brasil'})[lang]].filter(Boolean).join(' · '),eventDate:t.notice+': '+dateValue(e.day||p.date,lang),publicationDate:reported==='—'?'':t.fact+': '+reported,description:description+(description&&lang!=='pt'?' · '+t.original:''),fauna:names.slice(0,3).join(' · '),quantity:quantities.length?t.seized+': '+quantities.join(' · '):'',aria:t.open};
 }
 function point(e,map,isVisible){
  if(!isGeo(e)||!map||typeof map.project!=='function')return null;
  try{
   if(!isVisible(e))return null; // Existing MapLibre globe occlusion check.
   const p=map.project([e.lng,e.lat]);
   const w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;
   if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||w<=0||h<=0||
      p.x<12||p.y<12||p.x>w-12||p.y>h-12)return null;
   return {x:p.x,y:p.y,width:w,height:h};
  }catch{return null;}
 }
 function create({root,getMap,getRecords,getLang,getRecord,countable,isVisible,isEnabled,onOpen}){
  if(!root)return Object.freeze({sync(){},refresh(){},hasVisibleCard:()=>false,stop(){}});
  const card=root.querySelector('#cleanMapStoryCard');
  const svg=root.querySelector('#cleanMapStoryLines');
  const path=root.querySelector('#cleanMapStoryPath');
  const pin=root.querySelector('#cleanMapStoryPin');
  const nodes={
   kicker:root.querySelector('#cleanMapStoryKicker'),
   title:root.querySelector('#cleanMapStoryTitle'),
   place:root.querySelector('#cleanMapStoryPlace'),
   eventDate:root.querySelector('#cleanMapStoryEventDate'),
   publicationDate:root.querySelector('#cleanMapStoryPublicationDate'),
   description:root.querySelector('#cleanMapStoryDescription'),
   fauna:root.querySelector('#cleanMapStoryFauna'),
   quantity:root.querySelector('#cleanMapStoryQuantity')
  };
  let map=null,active=null,lastId=null,cursor=0,timer=0,delay=0,running=false;
  let visible=false,lastSource=null;
  function hide(){
   visible=false;
   card.classList.remove('is-visible');
   svg.classList.remove('is-visible');
   card.tabIndex=-1;
  }
  function updateGeometry(){
   if(!running||!active||!map){hide();return false;}
   const p=point(active,map,isVisible);
   if(!p){hide();return false;}
   // The content determines the card height. Long descriptions remain
   // readable with internal scrolling only when the viewport is too short.
   const width=Math.min(p.width-24,p.width<650?290:360,
    Math.max(210,p.width*(p.width<650?.54:.37)));
   const controls=document.getElementById('cleanMapControls'),cr=controls?.getBoundingClientRect(),mr=map.getContainer().getBoundingClientRect();
   const reserve=cr&&cr.width>0&&cr.height>0?cr.width+22:16;
   const left=Math.max(12,p.width-width-(p.width>650?reserve:16));
   card.style.width=width+'px';
   card.style.left=left+'px';
   card.style.maxHeight=Math.max(150,p.height-90)+'px';
   const height=card.getBoundingClientRect().height;
   const upper=p.width<=650&&cr&&mr?Math.min(Math.max(12,p.height-height-12),Math.max(12,cr.bottom-mr.top+8)):p.height<350?12:56;
   const lower=Math.max(upper,p.height-height-12);
   const top=Math.min(lower,Math.max(upper,p.y-height*.40));
   const joinX=p.x<left?left:left+width;
   const joinY=top+Math.min(70,Math.max(24,height*.28));
   card.style.top=top+'px';
   svg.setAttribute('viewBox','0 0 '+p.width+' '+p.height);
   const bend=(p.x+joinX)/2;
   path.setAttribute('d','M '+p.x.toFixed(1)+' '+p.y.toFixed(1)+
    ' C '+bend.toFixed(1)+' '+p.y.toFixed(1)+
    ' '+bend.toFixed(1)+' '+joinY.toFixed(1)+
    ' '+joinX.toFixed(1)+' '+joinY.toFixed(1));
   pin.setAttribute('cx',p.x.toFixed(1));
   pin.setAttribute('cy',p.y.toFixed(1));
   if(!visible){
    visible=true;card.tabIndex=0;
    card.classList.add('is-visible');
    svg.classList.add('is-visible');
   }
   return true;
  }
  function fill(e){
   const r=getRecord(e),d=format(e,r,getLang());
   root.dataset.source=e.sourceType==='ibama'?'ibama':'osint';
   nodes.kicker.textContent=d.kicker;
   const names=e.sourceType==='ibama'?(e.taxonEntries||[]).map(x=>x.name):[...String(e.taxon_text||r.taxon||'').matchAll(/\*([A-Z][a-z]+(?: [a-z][a-z-]+){0,2})\*/g)].map(x=>x[1]);
   const sci=value=>window.ScientificText.html(value,names);
   nodes.title.innerHTML=sci(d.title);
   nodes.place.textContent=d.place;
   nodes.eventDate.textContent=d.eventDate;
   nodes.publicationDate.textContent=d.publicationDate;
   nodes.description.innerHTML=sci(d.description);
   nodes.fauna.innerHTML=sci(d.fauna);
   nodes.quantity.innerHTML=sci(d.quantity);
   for(const key of ['publicationDate','description','fauna','quantity'])nodes[key].hidden=!d[key];
   card.setAttribute('aria-label',d.aria+': '+d.title);
  }
  function choose(){
   if(!running||!map)return;
   const eligible=candidates(getRecords(),countable).filter(e=>point(e,map,isVisible));
   if(!eligible.length){active=null;hide();return;}
   const source=e=>e.sourceType==='ibama'?'ibama':'osint';
   const alternating=eligible.filter(e=>source(e)!==lastSource);const pool=alternating.length?alternating:eligible;
   pool.sort((a,b)=>String(b.event_date||b.day||b.publication_date||'').localeCompare(String(a.event_date||a.day||a.publication_date||''))||String(a.id).localeCompare(String(b.id)));
   let next=null;
   for(let i=0;i<pool.length;i++){
    const candidate=pool[(cursor+i)%pool.length];
    if(candidate.id!==lastId||pool.length===1){
     next=candidate;cursor=(cursor+i+1);break;
    }
   }
   if(!next)next=pool[0];
   active=next;lastId=next.id;lastSource=source(next);
   fill(next);
   updateGeometry();
  }
  function cycle(){
   if(!running||card.matches(':hover')||document.activeElement===card)return;
   hide();
   if(delay)clearTimeout(delay);
   delay=setTimeout(()=>{delay=0;choose();},320);
  }
  function onMove(){updateGeometry();}
  card.addEventListener('click',e=>{
   e.stopPropagation();
   if(running&&active&&visible)onOpen(active.id,active);
  });
  function stop(){
   running=false;
   if(timer)clearInterval(timer);timer=0;
   if(delay)clearTimeout(delay);delay=0;
   if(map){try{map.off('move',onMove);map.off('resize',onMove);}catch{}}
   map=null;active=null;hide();root.hidden=true;
  }
  function sync(){
   const nextMap=isEnabled()?getMap():null;
   if(!nextMap){if(running)stop();return;}
   if(running&&map===nextMap){refresh();return;}
   stop();map=nextMap;running=true;root.hidden=false;
   map.on('move',onMove);map.on('resize',onMove);
   choose();
   timer=setInterval(cycle,duration);
  }
  function refresh(){
   if(!running)return;
   if(!isEnabled()){stop();return;}
   const records=candidates(getRecords(),countable);
   const matching=active&&records.find(e=>e.id===active.id);
   if(active&&!matching){choose();return;}
   if(matching){active=matching;fill(active);updateGeometry();}
   else if(!active)choose();
  }
  return Object.freeze({sync,refresh,stop,hasVisibleCard:()=>running&&visible});
 }
 return Object.freeze({create,candidates,format,point});
})();
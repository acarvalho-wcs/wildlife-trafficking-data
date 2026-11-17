/* Single connected mini-card for clean GLOBE only. Never alters event feeds or map layers. */
window.CleanMapStoryCards=(()=>{
 'use strict';
 const duration=7600;
 const words={
  pt:{kicker:'APREENSÃO DOCUMENTADA',event:'Ocorrência',published:'Publicado',units:'itens',open:'Abrir ficha do evento'},
  en:{kicker:'DOCUMENTED SEIZURE',event:'Occurred',published:'Published',units:'items',open:'Open event details'},
  es:{kicker:'DECOMISO DOCUMENTADO',event:'Ocurrencia',published:'Publicado',units:'elementos',open:'Abrir ficha del evento'}
 };
 const locales={pt:'pt-BR',en:'en-US',es:'es-ES'};
 const isGeo=e=>e&&Number.isFinite(e.lat)&&Number.isFinite(e.lng)&&Math.abs(e.lat)<=90&&Math.abs(e.lng)<=180;
 function candidates(records,countable=()=>true){
  return (records||[]).filter(e=>isGeo(e)&&countable(e)&&e.id!=null);
 }
 function format(e,r={},lang='en'){
  const t=words[lang]||words.en;
  const date=e.event_date||e.publication_date;
  let dateText='';
  if(typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)){
   const v=new Date(date+'T12:00:00Z');
   if(!Number.isNaN(v.getTime())){
    const d=new Intl.DateTimeFormat(locales[lang]||locales.en,{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(v);
    dateText=(e.event_date?t.event:t.published)+': '+d;
   }
  }
  return {
   kicker:t.kicker,
   title:String(r.title||r.city||e.city||r.country||e.country||''),
   place:[r.city||e.city,r.country||e.country].filter(Boolean).join(' · '),
   date:dateText,
   fauna:String(r.species||e.species||''),
   quantity:Number.isFinite(e.items)&&e.items>0?
    new Intl.NumberFormat(locales[lang]||locales.en).format(e.items)+' '+t.units:'',
   aria:t.open
  };
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
   meta:root.querySelector('#cleanMapStoryMeta'),
   fauna:root.querySelector('#cleanMapStoryFauna'),
   quantity:root.querySelector('#cleanMapStoryQuantity')
  };
  let map=null,active=null,lastId=null,cursor=0,timer=0,delay=0,running=false;
  let visible=false;
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
   const width=Math.min(p.width<650?166:222,Math.max(120,p.width*.43));
   const left=Math.max(12,p.width-width-(p.width<650?12:28));
   const upper=Math.min(100,Math.max(72,p.height*.13));
   const lower=Math.max(upper,p.height-132);
   const top=Math.max(upper,Math.min(p.y-36,lower));
   const joinX=p.x<left?left:left+width;
   const joinY=top+43;
   card.style.width=width+'px';
   card.style.left=left+'px';
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
   nodes.kicker.textContent=d.kicker;
   nodes.title.textContent=d.title;
   nodes.meta.textContent=[d.place,d.date].filter(Boolean).join('  |  ');
   nodes.fauna.textContent=d.fauna;
   nodes.quantity.textContent=d.quantity;
   card.setAttribute('aria-label',d.aria+': '+d.title);
  }
  function choose(){
   if(!running||!map)return;
   const eligible=candidates(getRecords(),countable).filter(e=>point(e,map,isVisible));
   if(!eligible.length){active=null;hide();return;}
   eligible.sort((a,b)=>String(b.event_date||b.publication_date||'').localeCompare(String(a.event_date||a.publication_date||''))||String(a.id).localeCompare(String(b.id)));
   let next=null;
   for(let i=0;i<eligible.length;i++){
    const candidate=eligible[(cursor+i)%eligible.length];
    if(candidate.id!==lastId||eligible.length===1){
     next=candidate;cursor=(cursor+i+1)%eligible.length;break;
    }
   }
   if(!next)next=eligible[0];
   active=next;lastId=next.id;
   fill(next);
   updateGeometry();
  }
  function cycle(){
   if(!running)return;
   hide();
   if(delay)clearTimeout(delay);
   delay=setTimeout(()=>{delay=0;choose();},320);
  }
  function onMove(){updateGeometry();}
  card.addEventListener('click',e=>{
   e.stopPropagation();
   if(running&&active&&visible)onOpen(active.id);
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
/* Filter-driven seizure-event KDE for both MapLibre surfaces. No second event source. */
window.SeizureHotspots=(()=>{
 'use strict';
 const SOURCE='seizure-hotspots-events',LAYER='seizure-hotspots-kde';
 const words={
  pt:{button:'Hotspots de apreensões',summary:n=>n+' eventos',sites:n=>n+' locais georreferenciados',scale:'Densidade relativa: menor → maior',method:'KDE: cada evento contabilizável tem peso 1; registros agregados excluídos dos totais não são duplicados. O raio do kernel acompanha o zoom. Coordenadas aproximadas podem influenciar a localização; não representa risco ou incidência real.',empty:'Nenhum evento contabilizável com coordenadas no recorte.'},
  en:{button:'Seizure hotspots',summary:n=>n+' events',sites:n=>n+' georeferenced locations',scale:'Relative density: lower → higher',method:'KDE: each countable event has weight 1; aggregates excluded from totals are not double-counted. Kernel radius responds to zoom. Approximate coordinates may affect locations; this is not a risk or true-incidence map.',empty:'No countable georeferenced events in this selection.'},
  es:{button:'Hotspots de decomisos',summary:n=>n+' eventos',sites:n=>n+' ubicaciones georreferenciadas',scale:'Densidad relativa: menor → mayor',method:'KDE: cada evento contabilizable tiene peso 1; los agregados excluidos de los totales no se duplican. El radio del kernel depende del zoom. Las coordenadas aproximadas pueden afectar la ubicación; no refleja riesgo ni incidencia real.',empty:'No hay eventos contabilizables georreferenciados en este filtro.'}
 };
 let enabled=false,total=0,locations=0,initialized=false,language=()=>document.documentElement.lang||'en';
 let geojson={type:'FeatureCollection',features:[]};
 const maps=new Set(),bound=new WeakSet();
 const get=id=>document.getElementById(id);
 const strings=()=>words[language()]||words.en;

 // Identical coordinates are collapsed with their COUNTABLE event count as weight,
 // not the number of animals, items, or duplicate aggregate-operation records.
 function build(records){
  const coordinateCounts=new Map();
  let n=0;
  for(const e of records||[]){
   if(!window.CaseContext.countable(e)||!window.GlobeData.valid(e))continue;
   const key=e.lng.toFixed(6)+','+e.lat.toFixed(6);
   const site=coordinateCounts.get(key);
   if(site)site.events+=1;
   else coordinateCounts.set(key,{lon:e.lng,lat:e.lat,events:1});
   n+=1;
  }
  return {total:n,locations:coordinateCounts.size,collection:{
   type:'FeatureCollection',
   features:[...coordinateCounts.values()].map(s=>({
    type:'Feature',properties:{event_count:s.events},
    geometry:{type:'Point',coordinates:[s.lon,s.lat]}
   }))
  }};
 }
 function layer(){
  return {id:LAYER,type:'heatmap',source:SOURCE,
   layout:{visibility:enabled?'visible':'none'},
   paint:{
    'heatmap-weight':['get','event_count'],
    'heatmap-intensity':['interpolate',['linear'],['zoom'],0,0.85,8,1.35],
    'heatmap-radius':['interpolate',['linear'],['zoom'],0,12,3,22,7,38,12,62],
    'heatmap-opacity':0.83,
    'heatmap-color':['interpolate',['linear'],['heatmap-density'],
     0,'rgba(29,185,220,0)',0.12,'rgba(33,166,217,0.45)',
     0.3,'#1684c5',0.5,'#ffe65b',0.72,'#ff8f39',1,'#e63832']
   }};
 }
 function paint(map){
  if(!map?.isStyleLoaded?.())return;
  try{
   const source=map.getSource(SOURCE);
   if(source)source.setData(geojson);
   else map.addSource(SOURCE,{type:'geojson',data:geojson});
   if(!map.getLayer(LAYER)){
    const before=map.getStyle()?.layers?.find(l=>l.type==='symbol')?.id;
    map.addLayer(layer(),before);
   }
   map.setLayoutProperty(LAYER,'visibility',enabled?'visible':'none');
  }catch(error){console.warn('Seizure KDE layer was not rendered.',error);}
 }
 function bindMap(map){
  if(!map||bound.has(map))return;
  bound.add(map);
  maps.add(map);
  map.on('style.load',()=>paint(map));
  map.on('idle',()=>{if(enabled&&!map.getLayer(LAYER))paint(map);});
  map.on('remove',()=>maps.delete(map));
  paint(map);
 }
 function localize(){
  if(!initialized)return;
  const t=strings(),b=get('toggleHotspots'),legend=get('hotspotLegend');
  b.textContent=t.button;
  b.title=t.method;
  b.setAttribute('aria-label',t.button);
  b.setAttribute('aria-pressed',String(enabled));
  legend.hidden=!enabled;
  get('hotspotSummary').textContent=total?t.summary(total)+' · '+t.sites(locations):t.empty;
  get('hotspotScale').textContent=t.scale;
  get('hotspotMethod').textContent=t.method;
 }
 function update(records){
  const result=build(records);
  geojson=result.collection;total=result.total;locations=result.locations;
  for(const map of maps)paint(map);
  localize();
 }
 function init(config){
  if(initialized)return;
  language=config.lang;
  const button=get('toggleHotspots');
  if(!button)return;
  initialized=true;
  button.addEventListener('click',()=>{
   enabled=!enabled;
   for(const map of maps)paint(map);
   localize();
  });
  localize();
 }
 return Object.freeze({init,bindMap,update,localize,build,isEnabled:()=>enabled});
})();
/* Filter-driven seizure-event KDE for both MapLibre surfaces. No second event source. */
window.SeizureHotspots=(()=>{
 'use strict';
 const SOURCE='seizure-hotspots-events',LAYER='seizure-hotspots-kde',IBSOURCE='ibama-hotspots-notices',IBLAYER='ibama-hotspots-kde';
 const words={
  pt:{button:'Hotspots de apreensões',summary:n=>n+' eventos',sites:n=>n+' locais georreferenciados',scale:'Densidade relativa: menor → maior',method:'KDE: cada evento contabilizável tem peso 1; registros agregados excluídos dos totais não são duplicados. O raio do kernel acompanha o zoom. Coordenadas aproximadas podem influenciar a localização; não representa risco ou incidência real.',empty:'Nenhum evento contabilizável com coordenadas no recorte.'},
  en:{button:'Seizure hotspots',summary:n=>n+' events',sites:n=>n+' georeferenced locations',scale:'Relative density: lower → higher',method:'KDE: each countable event has weight 1; aggregates excluded from totals are not double-counted. Kernel radius responds to zoom. Approximate coordinates may affect locations; this is not a risk or true-incidence map.',empty:'No countable georeferenced events in this selection.'},
  es:{button:'Hotspots de decomisos',summary:n=>n+' eventos',sites:n=>n+' ubicaciones georreferenciadas',scale:'Densidad relativa: menor → mayor',method:'KDE: cada evento contabilizable tiene peso 1; los agregados excluidos de los totales no se duplican. El radio del kernel depende del zoom. Las coordenadas aproximadas pueden afectar la ubicación; no refleja riesgo ni incidencia real.',empty:'No hay eventos contabilizables georreferenciados en este filtro.'}
 };
 let enabled=false,total=0,locations=0,initialized=false,language=()=>document.documentElement.lang||'en';
 let geojson={type:'FeatureCollection',features:[]},ibResult={total:0,locations:0,collection:{type:'FeatureCollection',features:[]}},active={osint:true,ibama:false};
 const maps=new Set(),bound=new WeakSet();
 const get=id=>document.getElementById(id);
 const strings=()=>words[language()]||words.en;

 // Identical coordinates are collapsed with their COUNTABLE event count as weight,
 // not the number of animals, items, or duplicate aggregate-operation records.
 function build(records,countable=e=>window.CaseContext.countable(e)){
  const coordinateCounts=new Map();
  let n=0;const ids=new Set();
  for(const e of records||[]){
   if(!countable(e)||!window.GlobeData.valid(e))continue;
   const id=e.id;if(id!=null){if(ids.has(id))continue;ids.add(id);}
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
 function layer(ib=false){
  return {id:ib?IBLAYER:LAYER,type:'heatmap',source:ib?IBSOURCE:SOURCE,
   layout:{visibility:enabled&&active[ib?'ibama':'osint']?'visible':'none'},
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
   for(const ib of [false,true]){
    const sourceId=ib?IBSOURCE:SOURCE,layerId=ib?IBLAYER:LAYER,collection=ib?ibResult.collection:geojson;
    const source=map.getSource(sourceId);if(source)source.setData(collection);else map.addSource(sourceId,{type:'geojson',data:collection});
    if(!map.getLayer(layerId)){const before=map.getStyle()?.layers?.find(l=>l.type==='symbol'||l.type==='circle')?.id;map.addLayer(layer(ib),before);}
    map.setLayoutProperty(layerId,'visibility',enabled&&active[ib?'ibama':'osint']?'visible':'none');
   }
  }catch(error){console.warn('Seizure KDE layer was not rendered.',error);}
 }
 function bindMap(map){
  if(!map||bound.has(map))return;
  bound.add(map);
  maps.add(map);
  map.on('style.load',()=>paint(map));
  map.on('idle',()=>{if(enabled&&(!map.getLayer(LAYER)||!map.getLayer(IBLAYER)))paint(map);});
  map.on('remove',()=>maps.delete(map));
  paint(map);
 }
 const sourceWords={
 pt:{button:'Hotspots',osint:'OSINT',ibama:'IBAMA',events:'eventos',notices:'autos de infração',sites:'locais',scale:'Densidade relativa: menor → maior',method:'KDE calculado separadamente por fonte (peso 1 por registro válido). OSINT e IBAMA podem documentar a mesma ocorrência; não há soma ou deduplicação entre fontes. As duas camadas usam a mesma escala de cores; para distinguir visualmente a origem, selecione uma fonte por vez. Sobreposição visual não representa densidade combinada. O raio acompanha o zoom; não representa risco ou incidência real.',compact:'Mesma escala de cores; KDE independente por fonte. Possíveis duplicações OSINT/IBAMA; sem soma entre bases.'},
 en:{button:'Hotspots',osint:'OSINT',ibama:'IBAMA',events:'events',notices:'notices',sites:'sites',scale:'Relative density: lower → higher',method:'KDE calculated separately for each source (weight 1 per valid record). OSINT and IBAMA may document the same occurrence; no cross-source sum or deduplication. Both layers use the same color scale; select one source at a time to distinguish them visually. Visual overlap is not combined density. Radius responds to zoom; this is not risk or true incidence.',compact:'Same color scale; independent KDE by source. Possible OSINT/IBAMA duplicates; no cross-source sum.'},
 es:{button:'Hotspots',osint:'OSINT',ibama:'IBAMA',events:'eventos',notices:'actas de infracción',sites:'lugares',scale:'Densidad relativa: menor → mayor',method:'KDE calculado por separado para cada fuente (peso 1 por registro válido). OSINT e IBAMA pueden documentar el mismo hecho; no se suman ni deduplican entre fuentes. Ambas capas usan la misma escala de colores; seleccione una fuente a la vez para distinguirlas visualmente. La superposición visual no es densidad combinada. El radio depende del zoom; no representa riesgo ni incidencia real.',compact:'Misma escala de colores; KDE independiente por fuente. Posibles duplicados OSINT/IBAMA; sin suma entre fuentes.'}
 };
 function legendRows(root,t,compact=false){
  if(!root)return;root.hidden=!enabled;root.replaceChildren();
  const fmt=n=>new Intl.NumberFormat(language()).format(n);
  for(const key of ['osint','ibama']){if(!active[key])continue;const ib=key==='ibama',r=ib?ibResult:{total,locations},row=document.createElement('div');row.className='hotspot-source-row';
   const label=document.createElement('strong');label.textContent=t[key]+' · '+fmt(r.total)+' '+(ib?t.notices:t.events)+' · '+fmt(r.locations)+' '+t.sites;
   const ramp=document.createElement('span');ramp.className='hotspot-ramp';ramp.setAttribute('aria-hidden','true');row.append(label,ramp);root.append(row);
  }
  const scale=document.createElement('small');scale.textContent=t.scale;root.append(scale);const note=document.createElement('small');note.className='hotspot-method-note';note.textContent=compact?t.compact:t.method;root.append(note);root.title=t.method;
 }
 function localize(){
  if(!initialized)return;const t=sourceWords[language()]||sourceWords.en;
  for(const id of ['toggleHotspots','cleanHotspots']){const b=get(id);if(!b)continue;b.textContent=t.button;b.title=t.method;b.setAttribute('aria-label',t.button);b.setAttribute('aria-pressed',String(enabled));}
  legendRows(get('hotspotLegend'),t);legendRows(get('cleanHotspotLegend'),t,true);
 }
 function update(records,officialRecords=[],selectedSources={osint:true,ibama:false}){
  active={...selectedSources};const result=build(records),official=build(officialRecords,e=>e.sourceType==='ibama');
  geojson=result.collection;total=result.total;locations=result.locations;ibResult=official;
  for(const map of maps)paint(map);localize();
 }
 function init(config){
  if(initialized)return;
  language=config.lang;
  const button=get('toggleHotspots');
  if(!button)return;
  initialized=true;
  const toggle=()=>{enabled=!enabled;for(const map of maps)paint(map);localize();};
  button.addEventListener('click',toggle);
  get('cleanHotspots')?.addEventListener('click',toggle);
  localize();
 }
 return Object.freeze({init,bindMap,update,localize,build,isEnabled:()=>enabled});
})();
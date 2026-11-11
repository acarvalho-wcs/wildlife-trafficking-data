/* Public MAP/GLOBE use the exact MapLibre/CARTO styles used by NIMF. */
window.ObservatoryBasemap=(()=>{
 const style=theme=>'https://basemaps.cartocdn.com/gl/'+(theme==='light'?'positron':'dark-matter')+'-gl-style/style.json';
 let layer,theme='dark';
 let notice;
 const credit='<a href="https://maplibre.org/" target="_blank" rel="noopener">MapLibre</a> | © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>';
 function localizeNotice(){if(notice)notice.textContent=({pt:'MapLibre requer WebGL. Ative a aceleração gráfica do navegador para visualizar o mapa CARTO. Os registros continuam disponíveis na lista.',en:'MapLibre requires WebGL. Enable browser graphics acceleration to view the CARTO map. Records remain available in the list.',es:'MapLibre requiere WebGL. Active la aceleración gráfica del navegador para ver el mapa CARTO. Los registros siguen disponibles en la lista.'})[document.getElementById('language').value]||'';}
 function init(map){
  try {layer=L.maplibreGL({style:style(theme),interactive:false,attribution:credit});layer.addTo(map);}
  catch(error){if(layer){try{map.removeLayer(layer);}catch{}}layer=null;notice=document.createElement('div');notice.className='map-engine-notice';notice.setAttribute('role','status');map.getContainer().append(notice);localizeNotice();console.warn('MapLibre could not initialize WebGL.',error);}
  map.attributionControl.setPrefix(false);
 }
 function setTheme(next){localizeNotice();if(next===theme)return;theme=next;if(layer)layer.getMaplibreMap().setStyle(style(theme));}
 return {init,setTheme,style};
})();
/* Adapt the existing dashboard view contract to MapLibre, without another case store. */
window.Globe=function(host){
 const M=window.maplibregl,props={},markers=[],decorations=[];
 let theme='dark',routes=[],queued=false;
 const map=new M.Map({container:host,style:window.ObservatoryBasemap.style(theme),center:[5,14],zoom:1,projection:{type:'globe'},attributionControl:false});
 map.addControl(new M.AttributionControl());
 const clear=list=>{for(const marker of list)marker.remove();list.length=0;};
 const updateRoutes=()=>{
  if(!map.isStyleLoaded()){if(!queued){queued=true;map.once('idle',()=>{queued=false;updateRoutes();});}return;}
  map.setProjection({type:'globe'});
  const data={type:'FeatureCollection',features:routes.map(d=>({type:'Feature',properties:{id:d.id},geometry:{type:'MultiLineString',coordinates:window.DocumentedRoutes.paths(d).map(path=>path.map(p=>[p[1],p[0]]))}}))};
  if(map.getSource('documented-routes'))map.getSource('documented-routes').setData(data);
  else {map.addSource('documented-routes',{type:'geojson',data});map.addLayer({id:'documented-routes',type:'line',source:'documented-routes',paint:{'line-color':window.DocumentedRoutes.visual(theme).color,'line-width':2.5}});}
  map.setPaintProperty('documented-routes','line-color',window.DocumentedRoutes.visual(theme).color);
 };
 map.on('style.load',updateRoutes);
 map.on('click','documented-routes',e=>{const d=routes.find(r=>r.id===e.features?.[0]?.properties.id);if(d)props.onPathClick?.(d);});
 map.on('mouseenter','documented-routes',()=>map.getCanvas().style.cursor='pointer');
 map.on('mouseleave','documented-routes',()=>map.getCanvas().style.cursor='');
 map.on('move',()=>props.onZoom?.(api.pointOfView()));
 const methods={
  isMapLibre:true,map,
  isVisible(d){return !map.transform.isLocationOccluded(M.LngLat.convert([d.lng,d.lat]));},
  pointOfView(next,ms=0){if(!next){const c=map.getCenter();return {lat:c.lat,lng:c.lng,altitude:2.4/Math.pow(2,map.getZoom()-1)};}map.easeTo({center:[next.lng,next.lat],zoom:Math.max(0,Math.min(19,1+Math.log2(2.4/next.altitude))),duration:ms});return api;},
  htmlElementsData(data){props.htmlElementsData=data;clear(markers);clear(decorations);for(const d of data){const element=props.htmlElement(d);const marker=new M.Marker({element,anchor:'center',opacityWhenCovered:'0'}).setLngLat([d.lng,d.lat]).addTo(map);(d.routeAdornment?decorations:markers).push(marker);}orient();return api;},
  pathsData(data){routes=data;props.pathsData=data;updateRoutes();return api;},
  setTheme(next){if(next!==theme){theme=next;map.setStyle(window.ObservatoryBasemap.style(theme));}return api;},
  getScreenCoords(lat,lng){return map.project([lng,lat]);},
  width(){map.resize();return api;},height(){map.resize();return api;},
  pauseAnimation(){return api;},resumeAnimation(){map.resize();return api;},
  renderer(){return {setPixelRatio(){}};},globeMaterial(){return {color:{set(){}}};},controls(){return {addEventListener(){}};},
  _destructor(){clear(markers);clear(decorations);map.remove();}
 };
 function orient(){for(const marker of decorations){
  const el=marker.getElement(),d=el.routeDecoration;if(!d)continue;
  // Projection/style transitions and resize can change occlusion without a move event.
  const visible=methods.isVisible(d);
  el.style.setProperty('visibility',visible?'visible':'hidden','important');
  el.style.setProperty('pointer-events',visible&&d.kind!=='approx'?'auto':'none','important');
  el.setAttribute('aria-hidden',String(!visible));el.tabIndex=visible?0:-1;
  if(!visible||d.kind!=='arrow')continue;
  const a=window.DocumentedRoutes.point(d.segment,d.fraction-.005*d.sign),b=window.DocumentedRoutes.point(d.segment,d.fraction+.005*d.sign);
  // Keep both tangent samples in the symbol's world copy at the antimeridian.
  const near=lng=>lng+360*Math.round((marker.getLngLat().lng-lng)/360);
  const p=map.project([near(a.lng),a.lat]),q=map.project([near(b.lng),b.lat]);
  if(Math.hypot(q.x-p.x,q.y-p.y)>1e-8)el.querySelector('span').style.transform='rotate('+Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI+'deg)';
 }}
 map.on('render',orient);
 const api=new Proxy(methods,{get(target,key){if(key==='then')return undefined;if(key in target)return target[key];return value=>{props[key]=value;return api;};}});
 return api;
};

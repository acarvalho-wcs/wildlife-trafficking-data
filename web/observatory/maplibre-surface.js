/* MAP/GLOBE share Maptoolkit Community Dark; CARTO Positron remains LIGHT. */
window.ObservatoryBasemap=(()=>{
 const carto=theme=>'https://basemaps.cartocdn.com/gl/'+(theme==='light'?'positron':'dark-matter')+'-gl-style/style.json';
 const dark='https://styles.maptoolkit.org/dark.json';
 const style=theme=>theme==='dark'?dark:carto(theme);
 function protect(map,getTheme,onFallback=()=>{}){let fallback=false;map.on('error',e=>{if(fallback||getTheme()!=='dark')return;const err=e?.error||e||{},status=Number(err.status||err.statusCode||0),url=String(err.url||''),message=String(err.message||'');if(!/maptoolkit\.(?:org|com|net)|mapterhorn\.com/i.test(url+' '+message)||(!status&&!/failed|network|fetch|load|error/i.test(message)))return;fallback=true;map.setStyle(carto('dark'));onFallback();console.warn('Maptoolkit unavailable; CARTO Dark Matter fallback active.');});return ()=>{fallback=false;};}

 let layer,theme='dark',leafMap,resetFallback=()=>{};
 let notice;
 const credit=provider=>'<a href="https://maplibre.org/" target="_blank" rel="noopener">MapLibre</a> | © '+(provider==='maptoolkit'?'<a href="https://www.maptoolkit.com/copyright/" target="_blank" rel="noopener">Maptoolkit</a>':'<a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>')+', © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>';
 function showProvider(mode,provider){const shell=document.getElementById('mapViewCard');if(shell)shell.dataset[mode==='map'?'mapProvider':'globeProvider']=provider;}
 let shownCredit='';function updateCredit(provider){showProvider('map',provider);if(!leafMap)return;if(shownCredit)leafMap.attributionControl.removeAttribution(shownCredit);shownCredit=credit(provider);leafMap.attributionControl.addAttribution(shownCredit);}
 function localizeNotice(){if(notice)notice.textContent=({pt:'MapLibre requer WebGL. Ative a aceleração gráfica do navegador para visualizar o mapa. Os registros continuam disponíveis na lista.',en:'MapLibre requires WebGL. Enable browser graphics acceleration to view the map. Records remain available in the list.',es:'MapLibre requiere WebGL. Active la aceleración gráfica del navegador para ver el mapa. Los registros siguen disponibles en la lista.'})[document.getElementById('language').value]||'';}
 function init(map){
  leafMap=map;
  try {layer=L.maplibreGL({style:style(theme),interactive:false});layer.addTo(map);const surface=layer.getMaplibreMap();updateCredit(theme==='dark'?'maptoolkit':'carto');resetFallback=protect(surface,()=>theme,()=>updateCredit('carto'));window.SeizureHotspots?.bindMap(surface);}
  catch(error){if(layer){try{map.removeLayer(layer);}catch{}}layer=null;notice=document.createElement('div');notice.className='map-engine-notice';notice.setAttribute('role','status');map.getContainer().append(notice);localizeNotice();console.warn('MapLibre could not initialize WebGL.',error);}
  map.attributionControl.setPrefix(false);
 }
 function setTheme(next){localizeNotice();if(next===theme)return;theme=next;if(layer){resetFallback();updateCredit(theme==='dark'?'maptoolkit':'carto');layer.getMaplibreMap().setStyle(style(theme));}}
 return {init,setTheme,style,protect,showProvider};
})();
/* A stable 3D star sphere projected into a decorative background; no map data. */
function createObservatoryGlobeSpace(host,map){
 const STAR_COUNT=20000,stars=[];
 let seed=20261125;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<STAR_COUNT;i++){
  const z=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-z*z);
  stars.push({x:r*Math.cos(a),y:r*Math.sin(a),z,brightness:.12+Math.pow(random(),2)*.68,size:.32+Math.pow(random(),5)*1.05});
 }
 let theme='dark',cached='',key='';
 const draw=()=>{
  host.style.backgroundColor=theme==='dark'?'#05070d':'#e8e8e8';
  // Keep the actual MapLibre canvas transparent outside the planet in both themes.
  map.getCanvas().style.backgroundColor='transparent';
  map.getCanvasContainer().style.backgroundColor='transparent';
  if(theme!=='dark'){host.style.backgroundImage='none';return;}
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  if(w<2||h<2)return;
  const next=w+'x'+h;
  if(next!==key){
   const dpr=Math.min(window.devicePixelRatio||1,2,2048/Math.max(w,h));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
   const ctx=canvas.getContext('2d');
   if(!ctx)return;
   ctx.scale(dpr,dpr);
   const focal=h*.66;
   for(const star of stars){
    if(star.z<=0)continue;
    const x=w/2+star.x/star.z*focal,y=h/2+star.y/star.z*focal;
    if(x<0||x>w||y<0||y>h)continue;
    ctx.fillStyle='rgba(224,235,255,'+star.brightness+')';
    ctx.beginPath();ctx.arc(x,y,star.size,0,Math.PI*2);ctx.fill();
   }
   cached=canvas.toDataURL('image/png');key=next;
  }
  host.style.backgroundImage='url("'+cached+'")';
  host.style.backgroundSize='100% 100%';
  host.style.backgroundRepeat='no-repeat';
 };
 map.on('resize',draw);
 draw();
 return {setTheme(next){theme=next;draw();}};
}
/* Adapt the existing dashboard view contract to MapLibre, without another case store. */
window.Globe=function(host){
 const M=window.maplibregl,props={},markers=[],decorations=[];
 let theme='dark',routes=[],queued=false;
 const map=new M.Map({container:host,style:window.ObservatoryBasemap.style(theme),center:[5,14],zoom:1,projection:{type:'globe'},attributionControl:false});
 map.addControl(new M.AttributionControl({compact:false}));
 window.ObservatoryBasemap.showProvider('globe','maptoolkit');
 const resetFallback=window.ObservatoryBasemap.protect(map,()=>theme,()=>window.ObservatoryBasemap.showProvider('globe','carto'));
 const space=createObservatoryGlobeSpace(host,map);
 window.SeizureHotspots?.bindMap(map);
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
  setTheme(next){space.setTheme(next);if(next!==theme){theme=next;resetFallback();window.ObservatoryBasemap.showProvider('globe',theme==='dark'?'maptoolkit':'carto');map.setStyle(window.ObservatoryBasemap.style(theme));}return api;},
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

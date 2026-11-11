/* A MapLibre basemap and one lazy MapLibre globe; fullscreen only moves existing DOM controls. */
window.ObservatoryGlobe=(()=>{
 const text={
  pt:{expand:'Expandir',exit:'Sair da tela cheia',filters:'Filtros',routes:'Rotas documentadas',noRoutes:'Nenhuma rota com origem e destino georreferenciados e documentados neste recorte.',routeHint:'Arcos ligam locais documentados; não representam o trajeto exato.',loading:'Carregando globo…',failed:'Não foi possível abrir o globo 3D. Você pode continuar no MAP.',retry:'Tentar novamente',help:'Arraste para girar e inclinar · Role ou use dois dedos para zoom',cases:'Casos nesta região',details:'Detalhes do caso',close:'Fechar',back:'Voltar aos casos',home:'Visão global',zin:'Ampliar',zout:'Reduzir',rotate:'Girar',tilt:'Inclinar',map:'Mapa 2D',globe:'Globo 3D',empty:'Nenhum caso corresponde aos filtros.'},
  en:{expand:'Fullscreen',exit:'Exit fullscreen',filters:'Filters',routes:'Documented routes',noRoutes:'No routes with documented, georeferenced origins and destinations in this selection.',routeHint:'Arcs connect documented places; they do not represent the exact journey.',loading:'Loading globe…',failed:'The 3D globe could not be opened. You can continue in MAP.',retry:'Try again',help:'Drag to rotate and tilt · Scroll or pinch to zoom',cases:'Cases in this area',details:'Case details',close:'Close',back:'Back to cases',home:'Global view',zin:'Zoom in',zout:'Zoom out',rotate:'Rotate',tilt:'Tilt',map:'2D map',globe:'3D globe',empty:'No cases match these filters.'},
  es:{expand:'Ampliar',exit:'Salir de pantalla completa',filters:'Filtros',routes:'Rutas documentadas',noRoutes:'No hay rutas con origen y destino georreferenciados y documentados en esta selección.',routeHint:'Los arcos conectan lugares documentados; no representan el trayecto exacto.',loading:'Cargando globo…',failed:'No se pudo abrir el globo 3D. Puede continuar en MAP.',retry:'Reintentar',help:'Arrastre para girar e inclinar · Desplace o use dos dedos para acercar',cases:'Casos en esta zona',details:'Detalles del caso',close:'Cerrar',back:'Volver a los casos',home:'Vista global',zin:'Acercar',zout:'Alejar',rotate:'Girar',tilt:'Inclinar',map:'Mapa 2D',globe:'Globo 3D',empty:'Ningún caso coincide con los filtros.'}
 };
 let api,globe,mode='map',expanded=false,loading=null,failed=false,detailId=null,clusterIds=[],snapshot=null,filterSlot,languageSlot,filterNode,languageNode;
 let routeDetail=null;
 const markerElements=new Set(),themes={map:'dark',globe:'dark'};
 try{for(const key of ['map','globe']){const saved=window.localStorage?.getItem('observatory-'+key+'-theme');if(['dark','light'].includes(saved))themes[key]=saved;}}catch{}
 Object.assign(text.pt,{dark:'Escuro',light:'Claro',theme:'Cor do mapa'});Object.assign(text.en,{dark:'Dark',light:'Light',theme:'Map color'});Object.assign(text.es,{dark:'Oscuro',light:'Claro',theme:'Color del mapa'});
 const get=id=>document.getElementById(id),t=()=>text[api.lang()],safe=s=>api.escape(s),duration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
 function button(id,label,fn){get(id).textContent=label;get(id).onclick=fn;}
 function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');const timer=setTimeout(()=>{s.remove();reject(Error('timeout'));},15000);s.src=url;s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('script'));};document.head.append(s);});}
 async function ensureGlobe(){
  if(globe)return;
  if(loading)return loading;
  failed=false;localize();
  loading=(async()=>{
   const g=new window.Globe(get('globe'),{animateIn:false,waitForGlobeReady:false,rendererConfig:{antialias:true,alpha:true}});
   globe=g;
   g.backgroundColor('#e8e8e8').showAtmosphere(true).atmosphereColor('#aab8c0').atmosphereAltitude(.10)
    .globeTileEngineUrl(null)
    .pointsTransitionDuration(0).pointLat('lat').pointLng('lng').pointResolution(16)
    .pointColor(d=>d.recent?'#ff6b5f':'#d3ff55').pointAltitude(0)
    .pointRadius(d=>Math.min(1.2,.24+Math.log2(d.members.length+1)*.15))
    .pointLabel(d=>window.ScientificText.html(d.members.length>1?d.members.length+' · '+t().cases:api.record(d.members[0]).title||api.record(d.members[0]).city))
    .onPointClick(showCluster).onPointHover(d=>{get('globe').style.cursor=d?'pointer':'grab';})
    .labelLat('lat').labelLng('lng').labelText(d=>d.members.length>1?String(d.members.length):'')
    .labelSize(.75).labelColor(()=> '#ffffff').labelAltitude(0).labelDotRadius(0).onLabelClick(showCluster)
    .htmlLat('lat').htmlLng('lng').htmlAltitude(d=>d.routeAdornment?window.DocumentedRoutes.surfaceAltitude:0).htmlTransitionDuration(0)
    .htmlElement(d=>{if(d.routeAdornment)return routeElement(d);const b=document.createElement('button');b.geoPoint=d;b.className='globe-marker'+(d.recent?' recent':'')+(d.members.length>1?' cluster':'');b.innerHTML='<span>'+ (d.members.length>1?d.members.length:'')+'</span>';b.setAttribute('aria-label',window.ScientificText.plain(d.members.length>1?d.members.length+' '+t().cases:api.record(d.members[0]).title||api.record(d.members[0]).city));b.title=b.getAttribute('aria-label');b.style.setProperty('z-index',d.recent?'3':'2','important');b.onclick=e=>{e.stopPropagation();if(globe.isMapLibre===true?globe.isVisible(d):window.GlobeData.visible(d,globe.pointOfView()))showCluster(d);};markerElements.add(b);setMarkerVisibility(b,globe.pointOfView());return b;})
    .htmlElementVisibilityModifier(el=>setMarkerVisibility(el,globe.pointOfView()))
    .onZoom(pov=>updateVisibility(pov))
    // Surface-following great-circle paths avoid low Bezier arcs cutting through Earth.
    .pathPoints(d=>window.DocumentedRoutes.surfacePoints(d)).pathPointLat('lat').pathPointLng('lng')
    .pathPointAlt(window.DocumentedRoutes.surfaceAltitude).pathResolution(.5)
    .pathColor(()=>window.DocumentedRoutes.visual(themes.globe).globeColor).pathStroke(.22).pathTransitionDuration(0)
    .pathLabel(d=>safe(window.DocumentedRoutes.label(d,api.lang())))
    .pathDashLength(1).pathDashGap(0).pathDashAnimateTime(0)
    .onPathClick(showRoute);
   g.globeMaterial().color.set('#ffffff');
   g.renderer().setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
   const controls=g.controls();controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=115;controls.maxDistance=650;
   // Zoom never rebuilds or regroups case markers.
   g.pointOfView({lat:14,lng:5,altitude:2.4},0);
   get('globe').querySelector('canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;globe.pauseAnimation();localize();});
   applyTheme();resize();updatePoints();if(mode!=='globe')g.pauseAnimation();
  })().catch(()=>{failed=true;if(globe){globe._destructor?.();globe=null;}get('globe').replaceChildren();}).finally(()=>{loading=null;localize();});
  localize();return loading;
 }
 function individual(records){return records.filter(window.GlobeData.valid).map(e=>({lat:e.lat,lng:e.lng,members:[e],recent:window.CaseContext.isRecent(e)})).sort((a,b)=>Number(a.recent)-Number(b.recent));}
 function updatePoints(){
  const routes=get('routeLayer').checked?window.GlobeData.routes(api.filtered()):[];
  window.DocumentedRouteMap?.render(routes);
  if(!globe)return;
  const groups=individual(api.filtered());
  // HTML markers are the only case marker layer. Native duplicate points are disabled.
  markerElements.clear();globe.pointsData([]).htmlElementsData(groups.concat(window.DocumentedRoutes.decorations(routes))).labelsData([]);updateVisibility(globe.pointOfView());
  globe.pathsData(routes);
 }
 function routeElement(d){
  const b=document.createElement('button');b.geoPoint=d;b.routeDecoration=d;
  b.className='globe-route-decoration '+d.kind;b.innerHTML=window.DocumentedRoutes.symbol(d.kind);
  // CSS2DRenderer sorts by depth each frame; preserve the symbol layer above event markers.
  b.style.setProperty('z-index','4','important');
  const label=window.DocumentedRoutes.label(d.segment,api.lang())+(d.kind==='approx'?' — '+window.DocumentedRoutes.text[api.lang()].approx:'');
  b.title=label;b.setAttribute('aria-label',label);b.onclick=e=>{e.stopPropagation();if(globe.isMapLibre===true?globe.isVisible(d):window.GlobeData.visible(d,globe.pointOfView()))showRoute(d.segment);};
  markerElements.add(b);setMarkerVisibility(b,globe.pointOfView());return b;
 }
 function setMarkerVisibility(el,pov){
  const visible=globe.isMapLibre===true?globe.isVisible(el.geoPoint):window.GlobeData.visible(el.geoPoint,pov);
  // CSS2DRenderer rewrites display each frame; visibility is deliberately independent.
  el.style.setProperty('visibility',visible?'visible':'hidden','important');
  el.style.setProperty('pointer-events',visible&&el.routeDecoration?.kind!=='approx'?'auto':'none','important');
  el.setAttribute('aria-hidden',String(!visible));el.tabIndex=visible?0:-1;
  const d=el.routeDecoration;
  if(visible&&d?.kind==='arrow'){
   const a=window.DocumentedRoutes.point(d.segment,d.fraction-.005*d.sign),b=window.DocumentedRoutes.point(d.segment,d.fraction+.005*d.sign);
   const p=globe.getScreenCoords(a.lat,a.lng,window.DocumentedRoutes.surfaceAltitude),q=globe.getScreenCoords(b.lat,b.lng,window.DocumentedRoutes.surfaceAltitude);
   el.querySelector('span').style.transform='rotate('+Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI+'deg)';
  }
 }
 function updateVisibility(pov){for(const el of markerElements)setMarkerVisibility(el,pov);}
 function applyTheme(){
  const card=get('mapViewCard');card.setAttribute('data-map-theme',themes.map);card.setAttribute('data-globe-theme',themes.globe);
  get('mapTheme').value=themes[mode];window.DocumentedRouteMap?.setTheme(themes.map);window.ObservatoryBasemap?.setTheme(themes.map);globe?.setTheme?.(themes.globe);if(globe)globe.pathColor(()=>window.DocumentedRoutes.visual(themes.globe).globeColor);
 }
 function localize(){
  if(!api)return;
  const l=t();
  get('mapTheme').setAttribute('aria-label',l.theme);get('mapThemeLabel').textContent=l.theme;
  get('mapThemeDark').textContent=l.dark;get('mapThemeLight').textContent=l.light;applyTheme();
  button('expandMap',expanded?'↙ '+l.exit:'⛶ '+l.expand,()=>setExpanded(!expanded));
  button('toggleMapFilters',l.filters,()=>{const host=get('mapFiltersHost');host.hidden=!host.hidden;get('toggleMapFilters').setAttribute('aria-expanded',String(!host.hidden));resize();});
  get('routeLabel').textContent=l.routes;get('mapRouteNote').textContent=window.DocumentedRoutes.note(api.lang(),window.GlobeData.routes(api.filtered()).length);
  get('mapRouteNote').hidden=!get('routeLayer').checked;
  get('globeHelp').textContent=l.help;get('globeHelp').hidden=mode!=='globe';
  get('mapMode').setAttribute('aria-label',l.map);get('globeMode').setAttribute('aria-label',l.globe);
  get('globe').setAttribute('aria-label',l.globe+'. '+l.help);
  get('globeTools').hidden=mode!=='globe'||!globe;
  get('routeControl').hidden=false;get('globeCredit').hidden=mode!=='globe';
  get('globeStatus').hidden=mode!=='globe';
  get('globeStatus').innerHTML=failed?safe(l.failed)+' <button id="retryGlobe">'+safe(l.retry)+'</button>':!globe?safe(l.loading):api.filtered().length?'':safe(l.empty);
  if(get('retryGlobe'))get('retryGlobe').onclick=()=>{if(globe){globe._destructor?.();globe=null;get('globe').replaceChildren();}ensureGlobe();};
  for(const [id,label] of [['globeZoomIn',l.zin],['globeZoomOut',l.zout],['globeHome',l.home],['globeRotate',l.rotate],['globeTilt',l.tilt]]){get(id).title=label;get(id).setAttribute('aria-label',label);}
  get('closeMapDetail').textContent=l.close;get('mapDetailTitle').textContent=detailId?l.details:l.cases;
  if(!get('mapDetail').hidden)renderDetail();
 }
 function showCase(id){try{const e=api.filtered().find(e=>e.id===id);window.ObservatoryAnalytics?.track('case_open',{case_id:id,case_country:e?.country,view:mode});}catch{}routeDetail=null;detailId=id;api.select(id);get('mapDetail').hidden=false;renderDetail();get('closeMapDetail').focus({preventScroll:true});}
 function showCluster(group){
  routeDetail=null;
  clusterIds=group.members.map(e=>e.id);detailId=null;
  if(clusterIds.length===1){showCase(clusterIds[0]);return;}
  if(globe&&mode==='globe')globe.pointOfView({lat:group.lat,lng:group.lng,altitude:Math.max(.3,globe.pointOfView().altitude*.7)},duration());
  get('mapDetail').hidden=false;renderDetail();get('closeMapDetail').focus({preventScroll:true});
 }
 function showRoute(d){try{window.ObservatoryAnalytics?.track('route_open',{route_id:d.route.id,view:mode});}catch{}routeDetail=d.id;detailId=null;clusterIds=[];api.select(d.event.id);get('mapDetail').hidden=false;renderDetail();get('closeMapDetail').focus({preventScroll:true});}
 function renderDetail(){
  if(routeDetail){
   const d=get('routeLayer').checked&&window.GlobeData.routes(api.filtered()).find(s=>s.id===routeDetail);
   if(!d){routeDetail=null;get('mapDetail').hidden=true;return;}
   get('mapDetailTitle').textContent=t().routes;get('mapDetailContent').innerHTML=window.DocumentedRoutes.html(d,api.lang());return;
  }
  const data=api.filtered(),l=t(),e=data.find(e=>e.id===detailId);get('mapDetailTitle').textContent=e?l.details:l.cases;
  if(e){get('mapDetailContent').innerHTML=(clusterIds.length>1?'<button id="backMapCases">← '+safe(l.back)+'</button>':'')+api.popup(api.record(e))+(e.additionalSources||[]).map(r=>'<p><a class="source-link" target="_blank" rel="noopener noreferrer" href="'+safe(r.url)+'">'+window.ScientificText.html(r.source)+' ↗</a></p>').join('');if(get('backMapCases'))get('backMapCases').onclick=()=>{detailId=null;renderDetail();};}
  else{detailId=null;const members=clusterIds.map(id=>data.find(e=>e.id===id)).filter(Boolean);if(!members.length){get('mapDetail').hidden=true;return;}get('mapDetailContent').innerHTML=members.map(e=>'<button class="case-choice '+(window.CaseContext.isRecent(e)?'recent':'')+'" data-case="'+safe(e.id)+'">'+window.ScientificText.html(api.record(e).title||api.record(e).city)+'<br><small>'+window.ScientificText.html(api.record(e).country)+' · '+safe(e.date)+'</small></button>').join('');get('mapDetailContent').querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>showCase(data.find(e=>String(e.id)===b.dataset.case)?.id));}
 }
 function closeDetail(){routeDetail=null;get('mapDetail').hidden=true;detailId=null;clusterIds=[];api.select(null);get(mode==='globe'?'globeMode':'mapMode').focus({preventScroll:true});}
 async function setMode(next){
  if(mode!==next){try{window.ObservatoryAnalytics?.track(next+'_view');}catch{}}
  mode=next;get('map').hidden=mode!=='map';get('globe').hidden=mode!=='globe';
  get('mapMode').setAttribute('aria-pressed',String(mode==='map'));get('globeMode').setAttribute('aria-pressed',String(mode==='globe'));
  localize();if(mode==='globe'){await ensureGlobe();if(globe&&mode==='globe')globe.resumeAnimation();}else globe?.pauseAnimation();resize();
 }
 function resize(){requestAnimationFrame(()=>{api.map.invalidateSize({pan:false});if(globe&&mode==='globe'){const r=get('mapStage').getBoundingClientRect();if(r.width&&r.height){globe.width(r.width).height(r.height);updateVisibility(globe.pointOfView());}}});}
 function setExpanded(next){
  if(expanded===next)return;
  expanded=next;if(next){try{window.ObservatoryAnalytics?.track('fullscreen_use',{view:mode});}catch{}}const shell=get('mapViewCard');
  if(next){snapshot={scrollX:window.scrollX,scrollY:window.scrollY,overflow:document.body.style.overflow,focus:document.activeElement};filterNode=document.querySelector('.filters');languageNode=get('appearanceControls')||get('language');filterSlot=document.createComment('filter position');languageSlot=document.createComment('language position');filterNode.before(filterSlot);languageNode.before(languageSlot);get('mapFiltersHost').append(filterNode);shell.querySelector('.cardhead').append(languageNode);get('mapFiltersHost').hidden=false;get('toggleMapFilters').setAttribute('aria-expanded',String(!get('mapFiltersHost').hidden));document.body.style.overflow='hidden';shell.classList.add('map-expanded');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label',messages[api.lang()].title);get('expandMap').focus();}
  else{shell.classList.remove('map-expanded');shell.removeAttribute('role');shell.removeAttribute('aria-modal');shell.removeAttribute('aria-label');filterSlot.replaceWith(filterNode);languageSlot.replaceWith(languageNode);document.body.style.overflow=snapshot.overflow;window.scrollTo(snapshot.scrollX,snapshot.scrollY);snapshot.focus?.focus({preventScroll:true});}
  localize();resize();
 }
 function init(a){
  api=a;get('mapMode').onclick=()=>setMode('map');get('globeMode').onclick=()=>setMode('globe');get('routeLayer').onchange=()=>{updatePoints();localize();resize();};get('closeMapDetail').onclick=closeDetail;
  get('mapTheme').onchange=e=>{if(!['dark','light'].includes(e.target.value))return;themes[mode]=e.target.value;try{window.localStorage?.setItem('observatory-'+mode+'-theme',themes[mode]);}catch{}applyTheme();};
  get('globeZoomIn').onclick=()=>zoomBy(.75);get('globeZoomOut').onclick=()=>zoomBy(1.3);get('globeHome').onclick=()=>{globe?.pointOfView({lat:14,lng:5,altitude:2.4},duration());};
  get('globeRotate').onclick=()=>{if(globe)globe.pointOfView({...globe.pointOfView(),lng:globe.pointOfView().lng+25},duration());};
  get('globeTilt').onclick=()=>{if(globe)globe.pointOfView({...globe.pointOfView(),lat:globe.pointOfView().lat>60?-30:globe.pointOfView().lat+20},duration());};
  get('globe').tabIndex=0;get('globe').onkeydown=e=>{if(!globe)return;const p=globe.pointOfView();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='+')zoomBy(.8);else if(e.key==='-')zoomBy(1.2);else globe.pointOfView({...p,lng:p.lng+(e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0),lat:Math.max(-85,Math.min(85,p.lat+(e.key==='ArrowUp'?10:e.key==='ArrowDown'?-10:0)))},duration());}};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!get('mapDetail').hidden)closeDetail();else if(expanded)setExpanded(false);}if(expanded&&e.key==='Tab'){const nodes=[...get('mapViewCard').querySelectorAll('button,select,input,a[href],[tabindex="0"]')].filter(n=>n.getClientRects().length&&!n.disabled);if(nodes.length){const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}}});
  window.addEventListener('resize',resize);new ResizeObserver(resize).observe(get('mapStage'));
  document.addEventListener('visibilitychange',()=>{if(globe){if(document.hidden||mode!=='globe')globe.pauseAnimation();else globe.resumeAnimation();}});
  window.DocumentedRouteMap?.init(api.map,showRoute,api.lang);
  window.DocumentedRoutes.subscribe(sync);window.DocumentedRoutes.start();
  localize();
 }
 function zoomBy(factor){if(globe){const p=globe.pointOfView();globe.pointOfView({...p,altitude:Math.max(.00001,Math.min(4.8,p.altitude*factor))},duration());}}
 function sync(){if(!api)return;updatePoints();localize();if(globe){if(document.hidden||mode!=='globe'||api.visible?.()===false)globe.pauseAnimation();else globe.resumeAnimation();}}
 function mapClick(e){if(!expanded){try{window.ObservatoryAnalytics?.track('case_open',{case_id:e.id,case_country:e.country,view:'map'});}catch{}return;}api.map.closePopup();const members=api.filtered().filter(window.GlobeData.valid).filter(c=>c.lat===e.lat&&c.lng===e.lng);showCluster({lat:e.lat,lng:e.lng,members});}
 function locate(e){if(mode==='globe'){globe?.pointOfView({lat:e.lat,lng:e.lng,altitude:.04},duration());clusterIds=[];showCase(e.id);return true;}return false;}
 return {init,sync,resize,mapClick,locate,individual};
})();

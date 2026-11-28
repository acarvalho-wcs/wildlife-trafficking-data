/* A MapLibre basemap and one lazy MapLibre globe; fullscreen only moves existing DOM controls. */
window.ObservatoryGlobe=(()=>{
 const text={
  pt:{expand:'Expandir',exit:'Sair da tela cheia',filters:'Filtros',routes:'Rotas documentadas',noRoutes:'Nenhuma rota com origem e destino georreferenciados e documentados neste recorte.',routeHint:'Arcos ligam locais documentados; não representam o trajeto exato.',loading:'Carregando globo…',failed:'Não foi possível abrir o globo 3D. Você pode continuar no MAP.',retry:'Tentar novamente',help:'Arraste para girar e inclinar · Role ou use dois dedos para zoom',cases:'Casos nesta região',details:'Detalhes do caso',close:'Fechar',back:'Voltar aos casos',home:'Visão global',zin:'Ampliar',zout:'Reduzir',rotate:'Girar',tilt:'Inclinar',map:'Mapa 2D',globe:'Globo 3D',empty:'Nenhum caso corresponde aos filtros.'},
  en:{expand:'Fullscreen',exit:'Exit fullscreen',filters:'Filters',routes:'Documented routes',noRoutes:'No routes with documented, georeferenced origins and destinations in this selection.',routeHint:'Arcs connect documented places; they do not represent the exact journey.',loading:'Loading globe…',failed:'The 3D globe could not be opened. You can continue in MAP.',retry:'Try again',help:'Drag to rotate and tilt · Scroll or pinch to zoom',cases:'Cases in this area',details:'Case details',close:'Close',back:'Back to cases',home:'Global view',zin:'Zoom in',zout:'Zoom out',rotate:'Rotate',tilt:'Tilt',map:'2D map',globe:'3D globe',empty:'No cases match these filters.'},
  es:{expand:'Ampliar',exit:'Salir de pantalla completa',filters:'Filtros',routes:'Rutas documentadas',noRoutes:'No hay rutas con origen y destino georreferenciados y documentados en esta selección.',routeHint:'Los arcos conectan lugares documentados; no representan el trayecto exacto.',loading:'Cargando globo…',failed:'No se pudo abrir el globo 3D. Puede continuar en MAP.',retry:'Reintentar',help:'Arrastre para girar e inclinar · Desplace o use dos dedos para acercar',cases:'Casos en esta zona',details:'Detalles del caso',close:'Cerrar',back:'Volver a los casos',home:'Vista global',zin:'Acercar',zout:'Alejar',rotate:'Girar',tilt:'Inclinar',map:'Mapa 2D',globe:'Globo 3D',empty:'Ningún caso coincide con los filtros.'}
 };
 let api,globe,mode='globe',expanded=false,loading=null,failed=false,detailId=null,clusterIds=[],snapshot=null,filterSlot,languageSlot,filterNode,languageNode;
 let routeDetail=null,pointsHidden=false,rotationEnabled=true,minicardsEnabled=true,cleanView=false,story=null,cleanLanguageSlot=null,inlineFilterSlot=null;
 const markerElements=new Set(),themes={map:'dark',globe:'dark'};
 try{const saved=window.localStorage?.getItem('observatory-map-theme');if(['dark','light'].includes(saved))themes.map=saved;}catch{}
 // Always open the globe in dark mode; the current session can still change it.
 Object.assign(text.pt,{dark:'Escuro',light:'Claro',theme:'Cor do mapa'});Object.assign(text.en,{dark:'Dark',light:'Light',theme:'Map color'});Object.assign(text.es,{dark:'Oscuro',light:'Claro',theme:'Color del mapa'});
 Object.assign(text.pt,{hidePoints:'Ocultar pontos',showPoints:'Mostrar pontos',pointsHint:'Oculta somente os marcadores de apreensões; filtros, rotas e hotspots permanecem inalterados.'});
 Object.assign(text.en,{hidePoints:'Hide points',showPoints:'Show points',pointsHint:'Hide seizure markers only; filters, routes and hotspots remain unchanged.'});
 Object.assign(text.es,{hidePoints:'Ocultar puntos',showPoints:'Mostrar puntos',pointsHint:'Oculta solo los marcadores de decomisos; los filtros, rutas y hotspots no cambian.'});
 Object.assign(text.pt,{rotationControl:'Rotação',rotationOn:'Rotação ligada — clique para desligar',rotationOff:'Rotação desligada — clique para ligar'});
 Object.assign(text.en,{rotationControl:'Rotation',rotationOn:'Rotation on — click to stop',rotationOff:'Rotation off — click to resume'});
 Object.assign(text.es,{rotationControl:'Rotación',rotationOn:'Rotación activada — pulse para detener',rotationOff:'Rotación desactivada — pulse para reanudar'});
 Object.assign(text.pt,{cleanEnter:'Apenas o mapa',cleanExit:'Explorar outros recursos',cleanEnterHint:'Ocultar controles para mostrar apenas o mapa',cleanExitHint:'Mostrar os demais recursos do Observatório'});
 Object.assign(text.en,{cleanEnter:'Map only',cleanExit:'Explore other resources',cleanEnterHint:'Hide controls and show only the map',cleanExitHint:'Show the other Observatory resources'});
 Object.assign(text.es,{cleanEnter:'Solo el mapa',cleanExit:'Explorar otros recursos',cleanEnterHint:'Ocultar controles y mostrar solo el mapa',cleanExitHint:'Mostrar los demás recursos del Observatorio'});
 try{minicardsEnabled=localStorage.getItem('observatory-minicards')!=='off';}catch{}
 const get=id=>document.getElementById(id),t=()=>text[api.lang()],safe=s=>api.escape(s),duration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
 function button(id,label,fn){get(id).textContent=label;get(id).onclick=fn;}
 // Move the MapLibre GLOBE camera around Earth's longitude; never modify
 // 2D positions, case coordinates, route data or KDE density.
 const rotation=window.GlobeRotation.create({
  isActive:()=>rotationEnabled&&mode==='globe'&&Boolean(globe?.isMapLibre&&globe.map)&&!failed&&!document.hidden&&api?.visible?.()!==false&&get('mapDetail')?.hidden!==false&&!window.ObservatoryFloatingCards?.count(),
  step:delta=>{
   const m=globe?.map;if(!m)return;
   const c=m.getCenter();
   m.jumpTo({center:[c.lng+delta,c.lat]});
  }
 });
 function suspendRotation(ms=3500){rotation.pause(ms);}
 function syncRotation(){rotation.sync();}
 function toggleRotation(){rotationEnabled=!rotationEnabled;localize();syncRotation();}
  function syncStory(){story?.sync();}

 function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');const timer=setTimeout(()=>{s.remove();reject(Error('timeout'));},15000);s.src=url;s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('script'));};document.head.append(s);});}
 async function ensureGlobe(){
  if(globe)return;
  if(loading)return loading;
  failed=false;localize();
  loading=(async()=>{
   const g=new window.Globe(get('globe'),{animateIn:false,waitForGlobeReady:false,rendererConfig:{antialias:true,alpha:true}});
   globe=g;
   window.IbamaFauna?.bindGlobe(g.map);
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
   get('globe').querySelector('canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;globe.pauseAnimation();syncRotation();localize();});
   applyTheme();resize();updatePoints();if(mode!=='globe')g.pauseAnimation();
  })().catch(()=>{failed=true;if(globe){globe._destructor?.();globe=null;}get('globe').replaceChildren();}).finally(()=>{loading=null;localize();syncRotation();syncStory();});
  localize();return loading;
 }
 function individual(records){return records.filter(window.GlobeData.valid).map(e=>({lat:e.lat,lng:e.lng,members:[e],recent:window.CaseContext.isRecent(e)})).sort((a,b)=>Number(a.recent)-Number(b.recent));}
 function updatePoints(){
  window.IbamaFauna?.sync();
  const routes=get('routeLayer').checked?window.GlobeData.routes(api.filtered()):[];
  window.DocumentedRouteMap?.render(routes);
  if(!globe)return;
  const groups=window.GlobeData.exactGroups(api.filtered());
  // Exact-coordinate groups use one selectable HTML marker; nearby places remain separate.
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
  card.setAttribute('data-clean-chart-theme',themes[mode]);card.setAttribute('data-active-map-mode',mode);get('mapTheme').value=themes[mode];window.DocumentedRouteMap?.setTheme(themes.map);window.ObservatoryBasemap?.setTheme(themes.map);globe?.setTheme?.(themes.globe);if(globe)globe.pathColor(()=>window.DocumentedRoutes.visual(themes.globe).globeColor);
 }
 function localize(){
  if(!api)return;
  const l=t();
  get('mapTheme').setAttribute('aria-label',l.theme);get('mapThemeLabel').textContent=l.theme;
  get('mapThemeDark').textContent=l.dark;get('mapThemeLight').textContent=l.light;applyTheme();
  button('expandMap',expanded?'↙ '+l.exit:'⛶ '+l.expand,()=>setExpanded(!expanded));
   const enterClean=get('enterCleanView'),exitClean=get('exitCleanView');
   enterClean.textContent='◱ '+l.cleanEnter;
   enterClean.title=l.cleanEnterHint;
   enterClean.setAttribute('aria-label',l.cleanEnterHint);
   enterClean.setAttribute('aria-pressed',String(cleanView));
   exitClean.textContent=l.cleanExit;
   exitClean.title=l.cleanExitHint;
   exitClean.setAttribute('aria-label',l.cleanExitHint);
  button('toggleMapFilters',l.filters,toggleFilters);
  button('cleanFilters',l.filters,toggleFilters);
  syncFilterButtons();
   const pointLabels=({pt:['Omitir pontos','Mostrar pontos','Omitir pontos OSINT e IBAMA; manter Hotspots e rotas'],en:['Hide points','Show points','Hide OSINT and IBAMA points; keep hotspots and routes'],es:['Ocultar puntos','Mostrar puntos','Ocultar puntos OSINT e IBAMA; mantener hotspots y rutas']})[api.lang()]||['Hide points','Show points','Hide points'];
   const togglePoints=()=>{pointsHidden=!pointsHidden;get('mapViewCard').classList.toggle('seizure-points-hidden',pointsHidden);window.IbamaFauna?.setPointsHidden(pointsHidden);if(pointsHidden)api.map.closePopup();localize();syncStory();};
   for(const id of ['togglePoints','cleanPoints']){button(id,pointLabels[pointsHidden?1:0],togglePoints);get(id).setAttribute('aria-pressed',String(pointsHidden));get(id).title=pointLabels[2];}
  const routeToggle=get('routeLayer'),routeButton=get('cleanRoutes'),routeWords=({pt:['Exibir rotas documentadas','Ocultar rotas documentadas','Rotas documentadas'],en:['Show documented routes','Hide documented routes','Documented routes'],es:['Mostrar rutas documentadas','Ocultar rutas documentadas','Rutas documentadas']})[api.lang()]||['Show documented routes','Hide documented routes','Documented routes'];
  button('cleanRoutes',routeWords[routeToggle.checked?1:0],()=>{routeToggle.checked=!routeToggle.checked;routeToggle.dispatchEvent(new Event('change',{bubbles:true}));});routeButton.setAttribute('aria-pressed',String(routeToggle.checked));routeButton.title=routeWords[2];
  get('routeLabel').textContent=l.routes;get('mapRouteNote').textContent=window.DocumentedRoutes.note(api.lang(),window.GlobeData.routes(api.filtered()).length);
  get('mapRouteNote').hidden=!get('routeLayer').checked;
  get('globeHelp').textContent=l.help;get('globeHelp').hidden=mode!=='globe';
  get('mapMode').setAttribute('aria-label',l.map);get('globeMode').setAttribute('aria-label',l.globe);
  get('globe').setAttribute('aria-label',l.globe+'. '+l.help);
  get('globeTools').hidden=mode!=='globe'||!globe;
  get('routeControl').hidden=false;get('globeCredit').hidden=mode!=='globe';
  get('globeStatus').hidden=mode!=='globe';
  const ib=window.IbamaFauna,counts=ib?.totals(api.filtered()),hasPoints=counts?counts.mappedOsint+counts.mappedOfficial>0:api.filtered().some(window.GlobeData.valid);
  get('globeStatus').innerHTML=failed?safe(l.failed)+' <button id="retryGlobe">'+safe(l.retry)+'</button>':!globe?safe(l.loading):hasPoints?'':ib?.enabled()&&ib.status()==='loading'?safe(ib.words().loading):ib?.enabled()&&ib.status()==='error'?safe(ib.words().missing):counts&&(counts.osint+counts.official)>0?safe(({pt:'Registros selecionados sem coordenadas válidas.',en:'Selected records have no valid coordinates.',es:'Registros seleccionados sin coordenadas válidas.'})[api.lang()]):safe(l.empty);
  if(get('retryGlobe'))get('retryGlobe').onclick=()=>{if(globe){globe._destructor?.();globe=null;get('globe').replaceChildren();}ensureGlobe();};
  for(const [id,label] of [['globeZoomIn',l.zin],['globeZoomOut',l.zout],['globeHome',l.home],['globeTilt',l.tilt]]){get(id).title=label;get(id).setAttribute('aria-label',label);}
   const rotateButton=get('globeRotate'),rotateLabel=rotationEnabled?l.rotationOn:l.rotationOff;
   rotateButton.textContent='↻ '+l.rotationControl;
   rotateButton.title=rotateLabel;
   rotateButton.setAttribute('aria-label',rotateLabel);
   rotateButton.setAttribute('aria-pressed',String(rotationEnabled));
   const cleanRotate=get('cleanRotate');
   cleanRotate.hidden=!(cleanView&&mode==='globe');
   cleanRotate.textContent=l.rotationControl;
   cleanRotate.title=rotateLabel;
   cleanRotate.setAttribute('aria-label',rotateLabel);
   cleanRotate.setAttribute('aria-pressed',String(rotationEnabled));
   const mini=get('cleanMinicards'),labels=({pt:['Minicards','Mostrar minicards','Ocultar minicards'],en:['Minicards','Show minicards','Hide minicards'],es:['Minifichas','Mostrar minifichas','Ocultar minifichas']})[api.lang()]||['Minicards','Show minicards','Hide minicards'];
   mini.hidden=!(cleanView&&mode==='globe');mini.textContent=labels[0];mini.title=labels[minicardsEnabled?2:1];mini.setAttribute('aria-label',mini.title);mini.setAttribute('aria-pressed',String(minicardsEnabled));
  get('closeMapDetail').textContent=l.close;get('mapDetailTitle').textContent=detailId?l.details:l.cases;
  if(!get('mapDetail').hidden)renderDetail();
 }
 function showCase(id,preserveCluster=false){const e=api.filtered().find(x=>x.id===id);if(e&&window.ObservatoryFloatingCards){window.IbamaFauna?.close();routeDetail=null;detailId=null;clusterIds=[];get('mapDetail').hidden=true;api.map.closePopup();api.select(null);const render=()=>({title:'OSINT · '+t().details,html:api.popup(api.record(e))+(e.additionalSources||[]).map(r=>'<p><a class="source-link" target="_blank" rel="noopener noreferrer" href="'+safe(r.url)+'">'+window.ScientificText.html(r.source)+' ↗</a></p>').join('')});window.ObservatoryFloatingCards.open({key:'osint:'+id,source:'osint',...render(),render});syncRotation();syncStory();return;}window.IbamaFauna?.close();if(!preserveCluster)clusterIds=[];try{const e=api.filtered().find(e=>e.id===id);window.ObservatoryAnalytics?.track('case_open',{case_id:id,case_country:e?.country,view:mode});}catch{}routeDetail=null;detailId=id;api.select(id);get('mapDetail').hidden=false;renderDetail();syncRotation();syncStory();get('closeMapDetail').focus({preventScroll:true});}
 function showCluster(group){window.IbamaFauna?.close();
  routeDetail=null;
  clusterIds=group.members.map(e=>e.id);detailId=null;api.select(null);
  if(clusterIds.length===1){showCase(clusterIds[0]);return;}
  if(globe&&mode==='globe')globe.pointOfView({lat:group.lat,lng:group.lng,altitude:Math.max(.3,globe.pointOfView().altitude*.7)},duration());
  get('mapDetail').hidden=false;renderDetail();syncRotation();syncStory();get('closeMapDetail').focus({preventScroll:true});
 }
 function showRoute(d){window.IbamaFauna?.close();try{window.ObservatoryAnalytics?.track('route_open',{route_id:d.route.id,view:mode});}catch{}routeDetail=d.id;detailId=null;clusterIds=[];api.select(d.event.id);get('mapDetail').hidden=false;renderDetail();syncRotation();syncStory();get('closeMapDetail').focus({preventScroll:true});}
 function renderDetail(){
  if(routeDetail){
   const d=get('routeLayer').checked&&window.GlobeData.routes(api.filtered()).find(s=>s.id===routeDetail);
   if(!d){routeDetail=null;get('mapDetail').hidden=true;return;}
   get('mapDetailTitle').textContent=t().routes;get('mapDetailContent').innerHTML=window.DocumentedRoutes.html(d,api.lang());return;
  }
  const data=api.filtered(),l=t(),e=data.find(e=>e.id===detailId);get('mapDetailTitle').textContent=e?l.details:l.cases;
  if(e){get('mapDetailContent').innerHTML=(clusterIds.length>1?'<button id="backMapCases">← '+safe(l.back)+'</button>':'')+api.popup(api.record(e))+(e.additionalSources||[]).map(r=>'<p><a class="source-link" target="_blank" rel="noopener noreferrer" href="'+safe(r.url)+'">'+window.ScientificText.html(r.source)+' ↗</a></p>').join('');if(get('backMapCases'))get('backMapCases').onclick=()=>{detailId=null;api.select(null);renderDetail();};}
  else{detailId=null;const members=clusterIds.map(id=>data.find(e=>e.id===id)).filter(Boolean);if(!members.length){get('mapDetail').hidden=true;return;}get('mapDetailContent').innerHTML=members.map(e=>'<button class="case-choice '+(window.CaseContext.isRecent(e)?'recent':'')+'" data-case="'+safe(e.id)+'">'+window.ScientificText.html(api.record(e).title||api.record(e).city)+'<br><small>'+window.ScientificText.html(api.record(e).country)+' · '+safe(e.date)+'</small></button>').join('');get('mapDetailContent').querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{const choice=data.find(e=>String(e.id)===b.dataset.case);if(choice)showCase(choice.id,true);});}
 }
 function closeDetail(){routeDetail=null;get('mapDetail').hidden=true;detailId=null;clusterIds=[];api.select(null);syncRotation();syncStory();get(cleanView?'exitCleanView':mode==='globe'?'globeMode':'mapMode').focus({preventScroll:true});}
 async function setMode(next){
  if(mode!==next){try{window.ObservatoryAnalytics?.track(next+'_view');}catch{}}
  mode=next;get('map').hidden=mode!=='map';get('globe').hidden=mode!=='globe';
  get('mapMode').setAttribute('aria-pressed',String(mode==='map'));get('globeMode').setAttribute('aria-pressed',String(mode==='globe'));
  localize();renderCleanCountryChart();syncRotation();syncStory();if(mode==='globe'){await ensureGlobe();if(globe&&mode==='globe')globe.resumeAnimation();}else globe?.pauseAnimation();syncRotation();syncStory();resize();
 }
 function resize(){requestAnimationFrame(()=>{api.map.invalidateSize({pan:false});if(globe&&mode==='globe'){const r=get('mapStage').getBoundingClientRect();if(r.width&&r.height){globe.width(r.width).height(r.height);updateVisibility(globe.pointOfView());story?.refresh();}}});}
 // A display-only second stage of the existing fullscreen experience.
 // Sources, filters, KDE and marker data are never modified here.
 function renderCleanCountryChart(){
   try{window.ProspectiveIntelligence?.sync({active:expanded&&cleanView&&mode==='globe',api,root:get('mapStage')});}catch(error){console.warn('Prospective analytics unavailable',error);}
  if(!cleanView||!api)return;
  const ib=window.IbamaFauna,officialOnly=ib?.enabled()&&!ib.osint();
  window.CleanMapCountryChart?.render({
   root:get('cleanCountryChart'),records:officialOnly?ib.filtered().map(e=>({...e,country:e.uf})):api.filtered(),lang:api.lang(),officialOnly,
   countable:officialOnly?()=>true:window.CaseContext.countable,
   countryLabel:e=>officialOnly?e.country:api.record(e).country,
   limit:!expanded?4:window.matchMedia('(max-width:650px)').matches?5:8
  });
 }
 function syncFilterButtons(){
  const open=!get('mapFiltersHost').hidden;
  for(const id of ['toggleMapFilters','cleanFilters'])get(id).setAttribute('aria-expanded',String(open));
 }
 function setFilterOpen(open){get('mapFiltersHost').hidden=!open;syncFilterButtons();resize();}
 function toggleFilters(){setFilterOpen(get('mapFiltersHost').hidden);}
 function setCleanView(next,{focus=true}={}){
  // The clean presentation is available both inline and in fullscreen.
  if(cleanView===next)return;
  cleanView=next;
  get('mapViewCard').classList.toggle('map-clean-view',cleanView);
  get('cleanMapControls').hidden=!cleanView;
  if(cleanView){
   const label=get('language').closest('.interface-language-switch')||get('language');
   cleanLanguageSlot=document.createComment('clean language position');label.before(cleanLanguageSlot);get('cleanLanguageHost').append(label);
   if(!expanded){const filters=document.querySelector('.filters');inlineFilterSlot=document.createComment('inline filter position');filters.before(inlineFilterSlot);get('mapFiltersHost').append(filters);}
   setFilterOpen(false);
  }else{
   const label=get('cleanLanguageHost').firstElementChild;if(cleanLanguageSlot&&label)cleanLanguageSlot.replaceWith(label);cleanLanguageSlot=null;
   if(inlineFilterSlot){inlineFilterSlot.replaceWith(get('mapFiltersHost').querySelector('.filters'));inlineFilterSlot=null;}
   setFilterOpen(expanded);
  }
  get('exitCleanView').hidden=!cleanView;
  get('cleanMapCharts').hidden=!cleanView;
  renderCleanCountryChart();
  syncStory();
  localize();
  syncRotation();
  resize();
  if(focus)(cleanView?get('exitCleanView'):get('enterCleanView')).focus({preventScroll:true});
 }
 function setExpanded(next,{startup=false}={}){
  if(expanded===next)return;
  if(cleanView)setCleanView(false,{focus:false});
  expanded=next;if(next&&!startup){try{window.ObservatoryAnalytics?.track('fullscreen_use',{view:mode});}catch{}}const shell=get('mapViewCard');
  if(next){snapshot={scrollX:window.scrollX,scrollY:window.scrollY,overflow:document.body.style.overflow,focus:document.activeElement};filterNode=document.querySelector('.filters');languageNode=get('appearanceControls')||get('language');filterSlot=document.createComment('filter position');languageSlot=document.createComment('language position');filterNode.before(filterSlot);languageNode.before(languageSlot);get('mapFiltersHost').append(filterNode);shell.querySelector('.cardhead').append(languageNode);get('mapFiltersHost').hidden=false;syncFilterButtons();document.body.style.overflow='hidden';shell.classList.add('map-expanded');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label',messages[api.lang()].title);if(!startup)get('expandMap').focus();}
  else{shell.classList.remove('map-expanded');shell.removeAttribute('role');shell.removeAttribute('aria-modal');shell.removeAttribute('aria-label');filterSlot.replaceWith(filterNode);languageSlot.replaceWith(languageNode);document.body.style.overflow=snapshot.overflow;window.scrollTo(snapshot.scrollX,snapshot.scrollY);snapshot.focus?.focus({preventScroll:true});}
  localize();renderCleanCountryChart();resize();
 }
 function init(a){
  api=a;
  window.ObservatoryFloatingCards?.init(get('mapStage'),()=>api.lang());
  window.addEventListener('observatory:floating-cards',()=>{syncRotation();syncStory();});
  story=window.CleanMapStoryCards?.create({
   root:get('cleanMapStoryLayer'),getMap:()=>globe?.isMapLibre?globe.map:null,
   getRecords:()=>api.filtered().concat(window.IbamaFauna?.filtered()||[]),getLang:()=>api.lang(),getRecord:e=>e.sourceType==='ibama'?{}:api.record(e),
   countable:e=>e.sourceType==='ibama'||window.CaseContext.countable(e),isVisible:e=>Boolean(globe?.isVisible(e)),
   isEnabled:()=>minicardsEnabled&&!pointsHidden&&cleanView&&mode==='globe'&&!failed&&!document.hidden&&get('mapDetail').hidden&&get('ibamaDetail').hidden&&!window.ObservatoryFloatingCards?.count()&&api.visible?.()!==false,
   onOpen:(id,e)=>{if(e?.sourceType==='ibama')window.IbamaFauna?.openById(id);else showCase(id);}
  });
  get('enterCleanView').onclick=()=>setCleanView(true);
  get('exitCleanView').onclick=()=>setCleanView(false);
  get('mapMode').onclick=()=>setMode('map');get('globeMode').onclick=()=>setMode('globe');get('routeLayer').onchange=()=>{updatePoints();localize();resize();};get('closeMapDetail').onclick=closeDetail;
  get('mapTheme').onchange=e=>{if(!['dark','light'].includes(e.target.value))return;themes[mode]=e.target.value;try{window.localStorage?.setItem('observatory-'+mode+'-theme',themes[mode]);}catch{}applyTheme();};
  get('globeZoomIn').onclick=()=>zoomBy(.75);get('globeZoomOut').onclick=()=>zoomBy(1.3);get('globeHome').onclick=()=>{suspendRotation(4500);globe?.pointOfView({lat:14,lng:5,altitude:2.4},duration());};
  get('globeRotate').onclick=toggleRotation;
  get('cleanRotate').onclick=toggleRotation;
  get('cleanMinicards').onclick=()=>{minicardsEnabled=!minicardsEnabled;try{localStorage.setItem('observatory-minicards',minicardsEnabled?'on':'off');}catch{}localize();syncStory();};
  window.addEventListener('observatory:ibama-detail',syncStory);
  get('globeTilt').onclick=()=>{suspendRotation(3500);if(globe)globe.pointOfView({...globe.pointOfView(),lat:globe.pointOfView().lat>60?-30:globe.pointOfView().lat+20},duration());};
  get('globe').addEventListener('pointerdown',()=>suspendRotation(4500),{passive:true});
   get('globe').addEventListener('wheel',()=>suspendRotation(3000),{passive:true});
   get('globe').tabIndex=0;get('globe').onkeydown=e=>{if(!globe)return;const p=globe.pointOfView();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();suspendRotation(3500);if(e.key==='+')zoomBy(.8);else if(e.key==='-')zoomBy(1.2);else globe.pointOfView({...p,lng:p.lng+(e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0),lat:Math.max(-85,Math.min(85,p.lat+(e.key==='ArrowUp'?10:e.key==='ArrowDown'?-10:0)))},duration());}};
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.key==='Escape'){if(get('ibamaDetail')&&!get('ibamaDetail').hidden){e.preventDefault();window.IbamaFauna?.close();}else if(!get('mapDetail').hidden){e.preventDefault();closeDetail();}else if(cleanView&&!get('mapFiltersHost').hidden){e.preventDefault();setFilterOpen(false);get('cleanFilters').focus({preventScroll:true});}else if(cleanView){e.preventDefault();setCleanView(false);}else if(expanded)setExpanded(false);}if(cleanView&&e.key==='Tab'&&(expanded||get('mapViewCard').contains(document.activeElement))){
   const nodes=[get('exitCleanView'),get('cleanFilters'),get('cleanRotate'),get('cleanHotspots'),get('cleanRoutes'),get('cleanPoints'),get('cleanMultiCards'),get('cleanCloseAllCards'),get('cleanMinicards'),get('language'),...get('mapFiltersHost').querySelectorAll('button,select,input,a[href],[tabindex="0"]'),get('prospectiveToggle'),...document.querySelectorAll('#prospectiveRoot button,#prospectiveRoot input,#prospectiveRoot select')];
   if(get('ibamaDetail')&&!get('ibamaDetail').hidden)nodes.push(...get('ibamaDetail').querySelectorAll('button,a[href],summary'));
   nodes.push(...get('mapStage').querySelectorAll('.floating-event-card button,.floating-event-card a[href],.floating-event-card header'));if(!get('mapDetail').hidden)nodes.push(...get('mapDetail').querySelectorAll('button,a[href],select,input,[tabindex="0"]'));
   else if(story?.hasVisibleCard())nodes.push(get('cleanMapStoryCard'));
   const visible=nodes.filter(el=>el&&!el.disabled&&el.getClientRects().length);
   if(visible.length){
    const current=visible.indexOf(document.activeElement);
    const next=(current+(e.shiftKey?-1:1)+visible.length)%visible.length;
    e.preventDefault();visible[next].focus({preventScroll:true});return;
   }
  }if(expanded&&e.key==='Tab'){const nodes=[...get('mapViewCard').querySelectorAll('button,select,input,a[href],[tabindex="0"]')].filter(n=>n.getClientRects().length&&!n.disabled);if(nodes.length){const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}}});
  window.addEventListener('resize',()=>{resize();renderCleanCountryChart();});new ResizeObserver(resize).observe(get('mapStage'));
  document.addEventListener('visibilitychange',()=>{if(globe){if(document.hidden||mode!=='globe')globe.pauseAnimation();else globe.resumeAnimation();}syncRotation();syncStory();});
  window.DocumentedRouteMap?.init(api.map,showRoute,api.lang);
  window.DocumentedRoutes.subscribe(sync);window.DocumentedRoutes.start();
  localize();
  // Open in the existing viewport-filling map-only experience, without user-action analytics.
  // Keep all active temporal and route filters and the default automatic rotation.
  setExpanded(true,{startup:true});
  setCleanView(true,{focus:false});
  void setMode('globe');
 }
 function zoomBy(factor){suspendRotation(3500);if(globe){const p=globe.pointOfView();globe.pointOfView({...p,altitude:Math.max(.00001,Math.min(4.8,p.altitude*factor))},duration());}}
 function sync(){if(!api)return;updatePoints();localize();renderCleanCountryChart();if(globe){if(document.hidden||mode!=='globe'||api.visible?.()===false)globe.pauseAnimation();else globe.resumeAnimation();}syncRotation();syncStory();}
 function mapClick(e){if(window.ObservatoryFloatingCards){api.map.closePopup();showCase(e.id);return;}if(!expanded&&!cleanView){try{window.ObservatoryAnalytics?.track('case_open',{case_id:e.id,case_country:e.country,view:'map'});}catch{}return;}api.map.closePopup();const members=api.filtered().filter(window.GlobeData.valid).filter(c=>c.lat===e.lat&&c.lng===e.lng);showCluster({lat:e.lat,lng:e.lng,members});}
 function locate(e){if(mode==='map'&&window.ObservatoryFloatingCards){api.map.flyTo([e.lat,e.lng],6);showCase(e.id);return true;}if(mode==='globe'){globe?.pointOfView({lat:e.lat,lng:e.lng,altitude:.04},duration());clusterIds=[];showCase(e.id);return true;}return false;}
 return {init,sync,resize,mapClick,locate,individual,showCluster,showCase};
})();

/* External route evidence only. Case records and their contexts are never modified. */
window.DocumentedRoutes=(()=>{
 const url='https://acarvalho-wcs.github.io/wildlife-trafficking-data/routes.json';
 let data={routes:[],excluded:[],network_context:[]},status='idle',pending=null,started=false;
 const listeners=new Set(),norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—]/g,'-');
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
 const sourceUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
 function matches(e,m){
  if(!m||!Object.keys(m).length)return false;
  const eventDate=e.event_date??e.eventDate??(e.date_role==='event'?e.date:null);
  const published=Object.prototype.hasOwnProperty.call(e,'publication_date')?e.publication_date:e.publicationDate??(e.date_role!=='event'?e.date:null);
  const rules={event_id:v=>String(e.id)===String(v),case_id:v=>String(e.case_id??e.id)===String(v),location_contains:v=>[e.city,e.location].some(x=>norm(x).includes(norm(v))),country:v=>norm(e.country)===norm(v),event_date:v=>!!eventDate&&eventDate===v,publication_date:v=>!!published&&published===v,event_date_range:v=>Array.isArray(v)&&v.length===2&&!!eventDate&&eventDate>=v[0]&&eventDate<=v[1],source_url:v=>[e.url,e.source_url].includes(v)};
  return Object.entries(m).every(([k,v])=>rules[k]&&v!==null&&v!==''&&rules[k](v));
 }
 function segments(filtered,all=window.NEWS_DATA||filtered){
  const result=[],selected=new Map(filtered.map(e=>[String(e.id),e]));
  const blocked=new Set([...data.excluded,...data.network_context].flatMap(r=>[r.id,r.route_id]).filter(Boolean));
  for(const r of data.routes){
   if(blocked.has(r.id)||r.layer==='network_context'||r.route_type==='network_context'||r.context_only||r.render_by_default===false||!/^DOCUMENTED(?:_|$)/.test(r.status||''))continue;
   const found=all.filter(e=>matches(e,r.event_match));
   // Do not guess between multiple cases, even when a filter hides one of them.
   if(found.length!==1||!selected.has(String(found[0].id)))continue;
   const event=selected.get(String(found[0].id));
   if(data.excluded.some(x=>x.event_match&&matches(event,x.event_match)))continue;
   for(const [i,s] of (r.segments||[]).entries()){
    if(!valid(s.from)||!valid(s.to))continue;
    result.push({id:r.id+':'+i,event,route:r,segment:s,source:sourceUrl(r.source_url)||sourceUrl(event.url),sourceFromCase:!sourceUrl(r.source_url),startLat:s.from.lat,startLng:s.from.lon,endLat:s.to.lat,endLng:s.to.lon,line_style:s.line_style||r.line_style||'solid',direction:Object.prototype.hasOwnProperty.call(s,'direction')?(s.direction||'unspecified'):(r.direction||'unspecified')});
   }
  }
  return result;
 }
 const text={
  pt:{route:'Rota',type:'Tipo de rota',evidence:'Nível/status da evidência',source:'Fonte',caseSource:'Fonte do caso associado',unavailable:'Link não informado',original:'Abrir fonte original',segment:'Segmento',precision:'Precisão geográfica',approx:'Referência aproximada; não representa um ponto exato',hint:'Linhas contínuas conectam referências documentadas. Setas azuis indicam direção quando sustentada pela fonte. Círculos vazados indicam locais aproximados.',loading:'Carregando rotas documentadas…',error:'Não foi possível atualizar as rotas agora. Nova tentativa em breve.',none:'Nenhuma rota documentada corresponde aos filtros.',direction:'Sentido',forward:'Direto',backward:'Inverso',bidirectional:'Bidirecional',unspecified:'Não estabelecido',solid:'Contínua',dashed:'Tracejada',dotted:'Pontilhada'},
  en:{route:'Route',type:'Route type',evidence:'Evidence level/status',source:'Source',caseSource:'Source of the associated case',unavailable:'Link not provided',original:'Open original source',segment:'Segment',precision:'Geographic precision',approx:'Approximate reference; not an exact point',hint:'Solid lines connect documented references. Blue arrows indicate direction when supported by the source. Hollow circles indicate approximate locations.',loading:'Loading documented routes…',error:'Routes could not be refreshed. We will try again shortly.',none:'No documented routes match the filters.',direction:'Direction',forward:'Forward',backward:'Reverse',bidirectional:'Bidirectional',unspecified:'Not established',solid:'Solid',dashed:'Dashed',dotted:'Dotted'},
  es:{route:'Ruta',type:'Tipo de ruta',evidence:'Nivel/estado de la evidencia',source:'Fuente',caseSource:'Fuente del caso asociado',unavailable:'Enlace no informado',original:'Abrir fuente original',segment:'Segmento',precision:'Precisión geográfica',approx:'Referencia aproximada; no representa un punto exacto',hint:'Las líneas continuas conectan referencias documentadas. Las flechas azules indican dirección cuando está respaldada por la fuente. Los círculos vacíos indican ubicaciones aproximadas.',loading:'Cargando rutas documentadas…',error:'No se pudieron actualizar las rutas. Lo intentaremos de nuevo en breve.',none:'Ninguna ruta documentada coincide con los filtros.',direction:'Sentido',forward:'Directo',backward:'Inverso',bidirectional:'Bidireccional',unspecified:'No establecido',solid:'Continua',dashed:'Discontinua',dotted:'Punteada'}
 };
 const terms={
  planned_movement:['Deslocamento previsto','Planned movement','Desplazamiento previsto'],completed_movement:['Deslocamento realizado','Completed movement','Desplazamiento realizado'],planned_itinerary:['Itinerário previsto','Planned itinerary','Itinerario previsto'],planned_shipment:['Remessa prevista','Planned shipment','Envío previsto'],completed_shipment:['Remessa realizada','Completed shipment','Envío realizado'],reported_supply_route:['Rota de abastecimento relatada','Reported supply route','Ruta de abastecimiento reportada'],intercepted_itinerary:['Itinerário interceptado','Intercepted itinerary','Itinerario interceptado'],interstate_movement:['Deslocamento interestadual','Interstate movement','Desplazamiento interestatal'],directional_segment:['Trecho com sentido documentado','Directional segment','Tramo con sentido documentado'],interstate_corridor:['Corredor interestadual','Interstate corridor','Corredor interestatal'],named_road_corridor:['Corredor rodoviário identificado','Named road corridor','Corredor vial identificado'],border_crossing:['Travessia de fronteira','Border crossing','Cruce fronterizo'],maritime_shipment:['Remessa marítima','Maritime shipment','Envío marítimo'],
  DOCUMENTED:['Documentada','Documented','Documentada'],DOCUMENTED_ATTRIBUTED:['Documentada com declaração atribuída','Documented with attributed statement','Documentada con declaración atribuida'],DOCUMENTED_BROAD:['Documentada com geografia ampla','Documented with broad geography','Documentada con geografía amplia'],DOCUMENTED_PARTIAL:['Parcialmente documentada','Partially documented','Parcialmente documentada'],DOCUMENTED_CORRIDOR:['Corredor documentado','Documented corridor','Corredor documentado'],
  airport:['Aeroporto','Airport','Aeropuerto'],airport_generalized:['Aeroporto aproximado','Approximate airport','Aeropuerto aproximado'],border_port:['Posto fronteiriço','Border port','Puesto fronterizo'],border_context_generalized:['Referência de fronteira','Generalized border reference','Referencia de frontera'],city:['Cidade de referência','City reference','Ciudad de referencia'],city_generalized:['Cidade aproximada','Approximate city','Ciudad aproximada'],city_port_generalized:['Cidade/porto aproximado','Approximate city/port','Ciudad/puerto aproximado'],port_city:['Cidade portuária','Port city','Ciudad portuaria'],continent_centroid_generalized:['Referência continental','Continental reference','Referencia continental'],country_centroid_generalized:['Referência de país','Country reference','Referencia de país'],state_centroid_generalized:['Referência de estado','State reference','Referencia de estado'],district_reference_generalized:['Referência de distrito','District reference','Referencia de distrito'],locality:['Localidade de referência','Locality reference','Localidad de referencia'],locality_approximate:['Localidade aproximada','Approximate locality','Localidad aproximada'],exact:['Ponto documentado','Documented point','Punto documentado']
 };
 const translated=(key,lang)=>terms[key]?.[['pt','en','es'].indexOf(lang)]||key||'—';
 const direction=d=>['forward','backward','bidirectional'].includes(d)?d:d==='reverse'?'backward':d==='both'?'bidirectional':'unspecified';
 const approximate=p=>typeof p?.precision==='string'&&/(generalized|approximate|centroid|city|country|state|region|district|province|department|island|archipelago|continent|locality|neighborhood|corridor|border_context)/i.test(p.precision);
 const label=(d,lang)=>d.route['label_'+lang]||d.route.label_pt||d.route.id;
 function html(d,lang='pt'){
  const l=text[lang]||text.pt,r=d.route,s=d.segment,dir=direction(d.direction),sep=dir==='forward'?' → ':dir==='backward'?' ← ':dir==='bidirectional'?' ↔ ':' — ';
  const row=(title,value)=>'<dt>'+safe(title)+'</dt><dd>'+safe(value)+'</dd>';
  return '<article class="route-evidence"><h3>'+safe(label(d,lang))+'</h3><dl>'+row(l.segment,s.from.name+sep+s.to.name)+row(l.type,translated(r.route_type,lang))+row(l.evidence,translated(r.status,lang)+' ('+r.status+')')+row(l.direction,l[dir])+row(l.precision,[s.from,s.to].map(p=>p.name+': '+translated(p.precision,lang)+(approximate(p)?' — '+l.approx:'')).join('; '))+'</dl><p>'+safe(s['evidence_'+lang]||r['evidence_'+lang]||'')+'</p><p class="popup-meta">'+safe(l.hint)+'</p><p>'+safe(d.sourceFromCase?l.caseSource:l.source)+': '+safe(d.sourceFromCase?d.event.source:r.source_label||'')+'</p>'+(d.source?'<a class="source-link" href="'+safe(d.source)+'" target="_blank" rel="noopener noreferrer">'+safe(l.original)+' ↗</a>':'<p>'+safe(l.unavailable)+'</p>')+'</article>';
 }
 function note(lang,count){const l=text[lang]||text.pt;return status==='error'?l.error:status==='idle'||status==='loading'?l.loading:count?l.hint:l.none;}
 const radians=x=>x*Math.PI/180,wrap=x=>((x+180)%360+360)%360-180;
 // Rendering-only exceptions for the three reviewed polar distortions. Exact
 // endpoint guards keep future/revised segments on the unchanged default path.
 // The eastward longitude span and gentle latitude bow are schematic geometry,
 // never evidence of transit, stops or an actual itinerary. No feed is modified.
 const schematic=Object.freeze({
  'tgh-global-20261108-09-am-01-r02:0':[-23.5505,-46.6333,-25.2744,133.7751,-4],
  'ornfish-20261013-01:0':[4.7016,-74.1469,21.0278,105.8342,4],
  'tgh-20261028-callao-china-seahorses:0':[-12.05659,-77.11814,35.8617,104.1954,4]
 });
 function point(d,t){
  const s=schematic[d.id];
  if(s&&d.startLat===s[0]&&d.startLng===s[1]&&d.endLat===s[2]&&d.endLng===s[3]){
   if(t===0)return {lat:d.startLat,lng:d.startLng};
   if(t===1)return {lat:d.endLat,lng:d.endLng};
   return {lat:d.startLat+(d.endLat-d.startLat)*t+s[4]*Math.sin(Math.PI*t),lng:d.startLng+(d.endLng-d.startLng)*t};
  }
  const vec=(a,b)=>[Math.cos(radians(a))*Math.cos(radians(b)),Math.sin(radians(a)),Math.cos(radians(a))*Math.sin(radians(b))];
  const a=vec(d.startLat,d.startLng),b=vec(d.endLat,d.endLng),angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((n,x,i)=>n+x*b[i],0))));
  if(angle<1e-8)return {lat:d.startLat,lng:d.startLng};
  if(Math.abs(Math.sin(angle))<1e-8)return {lat:d.startLat+(d.endLat-d.startLat)*t,lng:wrap(d.startLng+wrap(d.endLng-d.startLng)*t)};
  const v=a.map((x,i)=>(x*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/Math.sin(angle));
  return {lat:Math.atan2(v[1],Math.hypot(v[0],v[2]))*180/Math.PI,lng:Math.atan2(v[2],v[0])*180/Math.PI};
 }
 // Shared neutral palette. The existing dark GLOBE canvas filter inverts colors:
 // compensate only the line input, leaving the basemap and HTML blue symbols intact.
 const surfaceAltitude=.001;
 const visual=theme=>({color:'#808080',globeColor:theme==='dark'?'#5b5b5b':'#808080'});
 const surfacePoints=d=>Array.from({length:181},(_,i)=>point(d,i/180));
 function paths(d){
  const parts=[[]];let last;
  for(let i=0;i<=96;i++){
   const p=point(d,i/96);
   if(last&&Math.abs(p.lng-last.lng)>180){const adjusted=p.lng+(p.lng>last.lng?-360:360),edge=last.lng>0?180:-180,f=(edge-last.lng)/(adjusted-last.lng),lat=last.lat+(p.lat-last.lat)*f;parts.at(-1).push([lat,edge]);parts.push([[lat,-edge]]);}
   parts.at(-1).push([p.lat,p.lng]);last=p;
  }
  return parts;
 }
 // Inline vectors avoid font-dependent arrow glyphs; only the circle stroke catches clicks.
 const symbol=kind=>'<span aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" focusable="false">'+(kind==='arrow'?'<path d="M4 7 L21 12 L4 17 L8 12 Z" fill="#2F80ED" stroke="var(--route-symbol-halo)" stroke-width="1" stroke-linejoin="round"/>':'<circle cx="12" cy="12" r="9" fill="none" stroke="#2F80ED" stroke-width="2.5"/>')+'</svg></span>';
 function decorations(arcs){return arcs.flatMap(d=>{
  const endpoints=[d.segment.from,d.segment.to].filter(approximate).map(p=>({routeAdornment:true,kind:'approx',lat:p.lat,lng:p.lon,segment:d,endpoint:p}));
  const dir=direction(d.direction),arrows=dir==='bidirectional'?[[.43,-1],[.57,1]]:dir==='forward'?[[.5,1]]:dir==='backward'?[[.5,-1]]:[];
  return endpoints.concat(arrows.map(([fraction,sign])=>({routeAdornment:true,kind:'arrow',...point(d,fraction),segment:d,fraction,sign})));
 });}
 function refresh(){
  if(pending)return pending;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);status='loading';listeners.forEach(fn=>fn());
  pending=(async()=>{try{const response=await fetch(url+'?refresh='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('routes');const next=await response.json();if(!next||!Array.isArray(next.routes)||next.routes.some(r=>!r||!r.id||!Array.isArray(r.segments)))throw Error('schema');data={routes:next.routes,excluded:Array.isArray(next.excluded)?next.excluded:[],network_context:Array.isArray(next.network_context)?next.network_context:[]};status='ready';}catch{status='error';}finally{clearTimeout(timer);pending=null;listeners.forEach(fn=>fn());}})();return pending;
 }
 function start(){if(started)return;started=true;refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});}
 return {segments,matches,label,html,note,text,point,paths,surfacePoints,surfaceAltitude,visual,symbol,decorations,direction,approximate,refresh,start,subscribe:fn=>listeners.add(fn),state:()=>({status})};
})();

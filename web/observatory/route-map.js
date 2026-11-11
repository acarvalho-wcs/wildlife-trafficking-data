/* Leaflet adapter for the exact same segment objects supplied to Globe.GL. */
window.DocumentedRouteMap=(()=>{
 let map,group,open,lang,arrows=[],current=[],lines=[],theme='dark';
 const R=()=>window.DocumentedRoutes;
 function init(m,show,language){
  map=m;open=show;lang=language;
  if(!map.getPane('documentedRoutes'))map.createPane('documentedRoutes').style.zIndex='390';
  if(!map.getPane('documentedRouteSymbols'))map.createPane('documentedRouteSymbols').style.zIndex='620';
  map.getPane('documentedRouteSymbols').style.pointerEvents='none';
  group=L.layerGroup().addTo(map);
  map.on('zoom move zoomend moveend resize',orient);
 }
 function orient(){
  for(const {marker,decoration:d} of arrows){
   const a=R().point(d.segment,d.fraction-.005*d.sign),b=R().point(d.segment,d.fraction+.005*d.sign);
   while(b.lng-a.lng>180)b.lng-=360;while(b.lng-a.lng< -180)b.lng+=360;
   const p=map.project([a.lat,a.lng]),q=map.project([b.lat,b.lng]),span=marker.getElement()?.querySelector('span');
   if(span)span.style.transform='rotate('+Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI+'deg)';
  }
 }
 function render(segments){
  if(!group)return;current=segments;group.clearLayers();arrows=[];lines=[];
  for(const d of segments){
   const tooltip=document.createElement('span');tooltip.textContent=R().label(d,lang());
   const line=L.polyline(R().paths(d),{pane:'documentedRoutes',color:R().visual(theme).color,weight:2.5,opacity:1,dashArray:null,lineCap:'round'}).addTo(group);
   lines.push(line);line.routeSegmentId=d.id;line.bindTooltip(tooltip);line.on('click',()=>open(d));
   const path=line.getElement();if(path){path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',R().label(d,lang()));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(d);}});}
  }
  for(const d of R().decorations(segments)){
   const title=R().label(d.segment,lang())+(d.kind==='approx'?' — '+R().text[lang()].approx:'');
   const marker=L.marker([d.lat,d.lng],{pane:'documentedRouteSymbols',title,alt:title,keyboard:true,icon:L.divIcon({className:'documented-route-icon '+d.kind,html:R().symbol(d.kind),iconSize:[24,24],iconAnchor:[12,12]})}).addTo(group).on('click',()=>open(d.segment));
   if(d.kind==='arrow')arrows.push({marker,decoration:d});
  }
  orient();
 }
 function setTheme(next){theme=next;for(const line of lines)line.setStyle({color:R().visual(theme).color});}
 return {init,render,setTheme,segmentIds:()=>current.map(d=>d.id)};
})();

/* Decorative rings only; existing case markers keep their position and interactions. */
window.RecentPulse=(()=>{
 const rings=new Map();
 function sync(map,records,markers,now=Date.now()){
  const recent=new Map(records.filter(e=>window.CaseContext.isRecent(e,now)).map(e=>[e.id,e]));
  for(const [id,pair] of rings)if(!recent.has(id)){pair.forEach(r=>map.removeLayer(r));rings.delete(id);}
  for(const [id,e] of recent){
   let pair=rings.get(id);
   if(pair&&(pair[0].getLatLng().lat!==e.lat||pair[0].getLatLng().lng!==e.lng)){pair.forEach(r=>map.removeLayer(r));rings.delete(id);pair=null;}
   if(!pair){
    pair=[0,1].map(i=>{
     const ring=L.circleMarker([e.lat,e.lng],{radius:3,stroke:true,weight:1,color:'#ff6b5f',opacity:.5,fill:false,interactive:false,bubblingMouseEvents:false,className:'recent-wave recent-wave-'+i}).addTo(map);
     ring.getElement()?.setAttribute('aria-hidden','true');return ring;
    });
    rings.set(id,pair);
   }
   pair.forEach(r=>r.bringToFront());
  }
  // Cores stay above both histories and the non-interactive wave decoration.
  markers.filter(m=>recent.has(m.eventId)).forEach(m=>m.bringToFront());
 }
 return {sync};
})();

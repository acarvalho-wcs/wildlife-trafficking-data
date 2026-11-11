/* Pure view transforms. No second case store; all members reference the filtered records. */
window.GlobeData=(()=>{
 const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
 const vector=p=>{const a=p.lat*Math.PI/180,b=p.lng*Math.PI/180;return [Math.cos(a)*Math.cos(b),Math.sin(a),Math.cos(a)*Math.sin(b)];};
 // Surface visibility at a finite camera distance, not merely the front hemisphere.
 // A surface point is visible iff its outward normal faces the camera:
 // n·camera > R, or n·cameraUnit > 1/(1+altitude).
 function visible(point,pov){
  if(!valid(point)||!pov||!Number.isFinite(pov.lat)||!Number.isFinite(pov.lng)||!Number.isFinite(pov.altitude)||pov.altitude<=0)return false;
  const a=vector(point),b=vector(pov);
  return a.reduce((sum,n,i)=>sum+n*b[i],0)>1/(1+pov.altitude)+1e-6;
 }
 function cluster(records,degrees=7){
  const groups=[],threshold=2*Math.sin(degrees*Math.PI/360);
  for(const e of records.filter(valid)){
   const v=vector(e);let g=groups.find(g=>Math.hypot(...v.map((n,i)=>n-g.vector[i]))<threshold);
   if(!g){g={lat:e.lat,lng:e.lng,vector:v,members:[],recent:false};groups.push(g);}
   g.members.push(e);g.recent=g.recent||window.CaseContext.isRecent(e);
  }
  for(const g of groups)g.members.sort((a,b)=>Number(window.CaseContext.isRecent(b))-Number(window.CaseContext.isRecent(a))||b.date.localeCompare(a.date));
  return groups.sort((a,b)=>Number(a.recent)-Number(b.recent));
 }
 function routes(records){return window.DocumentedRoutes?.segments(records)||[];}
 return {valid,visible,cluster,routes};
})();

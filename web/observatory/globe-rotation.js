/* Frame-rate independent continuous GLOBE spin, separate from cases and routes. */
window.GlobeRotation=(()=>{
 'use strict';
 const degreesPerSecond=2; // One revolution in three minutes.
 function create({isActive,step,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,now=()=>performance.now()}){
  let frame=0,last=null,pausedUntil=0;
  function tick(time){
   frame=0;
   if(!isActive()){last=null;return;}
   if(last!==null&&time>=pausedUntil){
    // Avoid skipping across the world after a stalled frame.
    const elapsed=Math.min(80,Math.max(0,time-last));
    if(elapsed)step(elapsed*degreesPerSecond/1000);
   }
   last=time;
   frame=requestFrame(tick);
  }
  function sync(){
   if(!isActive()){
    if(frame)cancelFrame(frame);
    frame=0;last=null;return;
   }
   if(!frame){last=null;frame=requestFrame(tick);}
  }
  function pause(ms=3500){pausedUntil=Math.max(pausedUntil,now()+ms);last=null;}
  function stop(){if(frame)cancelFrame(frame);frame=0;last=null;}
  return Object.freeze({sync,pause,stop});
 }
 return Object.freeze({create,degreesPerSecond});
})();
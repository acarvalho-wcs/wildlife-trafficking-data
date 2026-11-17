/* Run: node --test tests/globe-rotation.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','globe-rotation.js'),'utf8'),context);
const create=context.window.GlobeRotation.create;
function environment(){
 let active=false,time=0,next=1;
 const callbacks=new Map(),steps=[];
 const raf=callback=>{const id=next++;callbacks.set(id,callback);return id;};
 const cancel=id=>callbacks.delete(id);
 const spin=create({isActive:()=>active,step:d=>steps.push(d),requestFrame:raf,cancelFrame:cancel,now:()=>time});
 const advance=t=>{
  time=t;const entry=callbacks.entries().next().value;
  if(!entry)return false;
  callbacks.delete(entry[0]);entry[1](time);
  return true;
 };
 return {spin,steps,callbacks,advance,setActive(value){active=value;}};
}
test('automatically rotates when GLOBE becomes active',()=>{
 const e=environment();e.setActive(true);e.spin.sync();
 assert.equal(e.callbacks.size,1);e.advance(0);e.advance(40);
 assert.equal(e.steps.length,1);assert.ok(e.steps[0]>0);
});
test('switching off cancels frames and switching on resumes without a jump',()=>{
 const e=environment();e.setActive(true);e.spin.sync();e.advance(0);e.advance(40);
 e.setActive(false);e.spin.sync();
 assert.equal(e.callbacks.size,0);
 const previous=e.steps.length;e.advance(10000);assert.equal(e.steps.length,previous);
 e.setActive(true);e.spin.sync();e.advance(10040);e.advance(10080);
 assert.ok(e.steps.length>previous);assert.ok(e.steps.at(-1)<0.1);
});
test('gesture pause keeps the map stationary temporarily and long frames are capped',()=>{
 const e=environment();e.setActive(true);e.spin.sync();e.advance(0);e.advance(25);
 const previous=e.steps.length;e.spin.pause(1000);
 e.advance(100);e.advance(500);assert.equal(e.steps.length,previous);
 e.advance(1100);assert.ok(e.steps.at(-1)<0.2);
});
test('no scheduled spin when inactive and stop cancels outstanding work',()=>{
 const e=environment();e.spin.sync();assert.equal(e.callbacks.size,0);
 e.setActive(true);e.spin.sync();e.spin.stop();assert.equal(e.callbacks.size,0);
});

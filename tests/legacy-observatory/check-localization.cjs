// Keep the full-source audits sequential: each owns a sizable isolated UI VM.
const {spawnSync}=require('node:child_process');
for(const script of ['check-cutover.cjs','check-recency-calendar.cjs','check-event-recency.cjs','check-marker-recency.cjs']){
 const result=spawnSync(process.execPath,['--max-old-space-size=512','scripts/'+script,...process.argv.slice(2)],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}

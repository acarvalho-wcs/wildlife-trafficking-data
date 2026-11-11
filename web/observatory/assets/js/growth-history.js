/* Aggregate history only: no event records or snapshots are persisted. */
(() => {
 const seed=window.ObservatoryGrowthSeed,source=window.CaseSource,host=document.getElementById('growthPanel');
 if(!seed||!source||!host)return;
 const zone='America/Manaus',repo='acarvalho-wcs/wildlife-trafficking-data',cacheKey='observatory-growth-totals-v1';
 const day=value=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;};
 const next=d=>new Date(Date.parse(d+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 const today=()=>day(Date.now()),validDay=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d));
 const validPoint=p=>p&&validDay(p.day)&&Number.isSafeInteger(p.total)&&p.total>=0&&/^[a-f0-9]{40}$/.test(p.sha);
 let temporalRange=null;
 let points=seed.points.filter(validPoint),verified=seed.through,period='day',pending=null,lastRefresh=0,status='',timer;
 try{const saved=JSON.parse(localStorage.getItem(cacheKey));if(saved&&validDay(saved.verified)&&saved.verified>=verified&&saved.verified<=today()&&saved.points.every(validPoint)){points=saved.points;verified=saved.verified;}}catch{}
 const text={
 pt:{title:'Evolução cumulativa dos eventos',days:'Dias',months:'Meses',years:'Anos',total:'eventos na base',note:'Base completa, desde 21/09/2026. Totais líquidos ao fim de cada período; hoje, até o presente. Inclui correções e registros agregados. Horário de Manaus (UTC−4).',source:'Histórico da base',table:'Ver valores por período',date:'Período',count:'Total acumulado',missing:'Histórico ainda não verificado',unavailable:'Não foi possível atualizar o histórico. Os pontos verificados continuam disponíveis.',loading:'Atualizando histórico…',current:'Hoje — parcial'},
 en:{title:'Cumulative event growth',days:'Days',months:'Months',years:'Years',total:'events in the database',note:'Full database, since 21 Sep 2026. Net totals at the end of each period; today, up to now. Includes corrections and aggregate records. Manaus time (UTC−4).',source:'Database history',table:'View values by period',date:'Period',count:'Cumulative total',missing:'History not yet verified',unavailable:'History could not be refreshed. Verified points remain available.',loading:'Updating history…',current:'Today — partial'},
 es:{title:'Evolución acumulativa de eventos',days:'Días',months:'Meses',years:'Años',total:'eventos en la base',note:'Base completa, desde el 21/09/2026. Totales netos al final de cada período; hoy, hasta el presente. Incluye correcciones y registros agregados. Hora de Manaus (UTC−4).',source:'Historial de la base',table:'Ver valores por período',date:'Período',count:'Total acumulado',missing:'Historial aún no verificado',unavailable:'No fue posible actualizar el historial. Los puntos verificados siguen disponibles.',loading:'Actualizando historial…',current:'Hoy — parcial'}
 };
 const language=()=>document.getElementById('language')?.value||'pt';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function series(now=today(),mode=period){
  const history=new Map(points.map(p=>[p.day,p.total])),rows=[];let total=null;
  for(let d=seed.start;d<=now;d=next(d)){
   if(history.has(d))total=history.get(d);
   let value=d<=verified?total:null;
   if(d===now&&window.NEWS_DATA.length)value=window.NEWS_DATA.length;
   rows.push({day:d,total:value});
  }
  const selected=temporalRange?rows.filter(p=>p.day>=temporalRange.start&&p.day<=temporalRange.end):rows;
  if(mode==='day')return selected;
  const buckets=new Map();selected.forEach(p=>buckets.set(p.day.slice(0,mode==='month'?7:4),p));return [...buckets.values()];
 }
 function render(){
  const lang=language(),t=text[lang]||text.pt,locale={pt:'pt-BR',en:'en-US',es:'es-ES'}[lang]||'pt-BR',fmt=n=>new Intl.NumberFormat(locale).format(n),rows=series();
  const label=d=>new Intl.DateTimeFormat(locale,period==='year'?{timeZone:zone,year:'numeric'}:period==='month'?{timeZone:zone,month:'short',year:'numeric'}:{timeZone:zone,day:'2-digit',month:'2-digit'}).format(new Date(d+'T12:00:00Z'));
  const w=Math.max(480,Math.min(1400,rows.length*24)),h=245,left=54,right=20,top=20,bottom=45,plotH=h-top-bottom,max=Math.max(1,...rows.map(p=>p.total||0)),ceil=Math.ceil(max/4/Math.pow(10,Math.max(0,Math.floor(Math.log10(max))-1)))*Math.pow(10,Math.max(0,Math.floor(Math.log10(max))-1))*4;
  const x=i=>left+(w-left-right)*(rows.length===1?.5:i/(rows.length-1)),y=v=>top+plotH*(1-v/ceil);
  let d='',open=false;rows.forEach((p,i)=>{if(p.total===null){open=false;return;}d+=(open?'L':'M')+x(i).toFixed(1)+','+y(p.total).toFixed(1)+' ';open=true;});
  const ticks=Array.from({length:5},(_,i)=>{const v=ceil*i/4;return '<line class="growth-grid" x1="'+left+'" x2="'+(w-right)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="growth-axis" x="'+(left-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+fmt(v)+'</text>';}).join('');
  const step=Math.max(1,Math.ceil(rows.length/7));
  const labels=rows.map((p,i)=>(i%step===0||i===rows.length-1)&&!(i!==rows.length-1&&rows.length-1-i<step/2)?'<text class="growth-axis" x="'+x(i)+'" y="'+(h-18)+'" text-anchor="'+(i===0?'start':i===rows.length-1?'end':'middle')+'">'+esc(label(p.day))+'</text>':'').join('');
  const dots=rows.map((p,i)=>p.total===null?'':'<circle class="growth-point" cx="'+x(i)+'" cy="'+y(p.total)+'" r="3"><title>'+esc(label(p.day)+': '+fmt(p.total))+'</title></circle>').join('');
  const historyText={pt:'Histórico do tamanho total da base',en:'Historical total database size',es:'Historial del tamaño total de la base'}[lang];
  const rangeNote=temporalRange?historyText+' · '+temporalRange.start+' — '+temporalRange.end:historyText;
  const latest=rows.at(-1),summary=latest?.total==null?'—':fmt(latest.total);
  host.innerHTML='<div class="growth-heading"><h3 id="growthTitle">'+historyText+'</h3><span class="growth-summary">'+summary+'</span></div><p class="growth-note">'+t.total+' · '+(temporalRange?rangeNote:t.current)+'</p><div class="growth-controls" role="group" aria-label="'+t.date+'">'+[['day',t.days],['month',t.months],['year',t.years]].map(([value,name])=>'<button type="button" data-growth-period="'+value+'" aria-pressed="'+(period===value)+'">'+name+'</button>').join('')+'</div><div class="growth-scroll"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-labelledby="growthSvgTitle"><title id="growthSvgTitle">'+t.title+' — '+summary+' '+t.total+'</title>'+ticks+'<path class="growth-line" d="'+d+'"/>'+dots+labels+'</svg></div><p class="growth-note">'+t.note+' <a href="'+seed.source+'" target="_blank" rel="noopener noreferrer">'+t.source+'</a></p><p class="growth-status" role="status">'+(status==='loading'?t.loading:status==='error'?t.unavailable:'')+'</p><details><summary>'+t.table+'</summary><div class="growth-table-wrap"><table><thead><tr><th>'+t.date+'</th><th>'+t.count+'</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+esc(period==='day'?p.day:label(p.day))+'</td><td>'+(p.total===null?t.missing:fmt(p.total))+'</td></tr>').join('')+'</tbody></table></div></details>';
  host.querySelectorAll('[data-growth-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.growthPeriod;render();}));
 }
 async function get(url){const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('History unavailable');return response.json();}
 async function refresh(){
  if(pending)return pending;if(Date.now()-lastRefresh<3600000)return;lastRefresh=Date.now();status='loading';render();
  pending=(async()=>{try{
   const since=verified+'T04:00:00Z',commits=[];let complete=false;
   for(let page=1;page<=20;page++){const batch=await get('https://api.github.com/repos/'+repo+'/commits?path=cases.json&since='+encodeURIComponent(since)+'&per_page=100&page='+page);if(!Array.isArray(batch))throw Error('Invalid history');commits.push(...batch);if(batch.length<100){complete=true;break;}}
   if(!complete)throw Error('Incomplete history');
   const byDay=new Map();for(const c of commits){if(!/^[a-f0-9]{40}$/.test(c.sha))throw Error('Invalid commit');const stamp=c.commit?.committer?.date;if(!stamp||!Number.isFinite(Date.parse(stamp)))throw Error('Invalid timestamp');const key=day(stamp);if(key<verified||key>today())continue;const prev=byDay.get(key);if(!prev||stamp>prev.stamp)byDay.set(key,{sha:c.sha,stamp});}
   const merged=new Map(points.map(p=>[p.day,p]));
   for(const [key,c]of byDay){const previous=merged.get(key);if(previous?.sha===c.sha)continue;const payload=await get('https://raw.githubusercontent.com/'+repo+'/'+c.sha+'/cases.json');if(!Array.isArray(payload.cases))throw Error('Invalid historical collection');merged.set(key,{day:key,total:payload.cases.length,sha:c.sha});}
   points=[...merged.values()].sort((a,b)=>a.day.localeCompare(b.day));verified=today();status='';
   try{localStorage.setItem(cacheKey,JSON.stringify({points,verified}));}catch{}
  }catch{status='error';}finally{pending=null;render();}})();return pending;
 }
 function midnight(){clearTimeout(timer);const now=today();timer=setTimeout(()=>{render();lastRefresh=0;refresh();source.refresh();midnight();},Math.max(1000,Date.parse(next(now)+'T04:00:00Z')-Date.now()+100));}
 window.addEventListener('observatory:time-render',event=>{temporalRange=event.detail.active?event.detail.range:null;render();});
 source.subscribe(()=>render());document.getElementById('language')?.addEventListener('change',render);
 window.addEventListener('focus',()=>{render();refresh();midnight();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();refresh();midnight();}});
 setInterval(()=>{if(!document.hidden)refresh();},3600000);
 window.ObservatoryGrowth={series,day,refresh};render();refresh();midnight();
})();

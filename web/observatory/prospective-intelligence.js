/* Prospective intelligence: optional presentation overlays; source adapters are explicit. */
window.ProspectiveIntelligence=(()=>{
'use strict';
const sources=new Map(),C=window.ProspectiveCore;
let root,button,panel,charts,last,enabled=false,optionsOpen=false,history=0,horizon=90,chosen=new Set(['routes','season','forecast']),cache=null,dirty=true,dragging=false,rerender=false,statusNode=null,zCounter=0;
const positionKey='observatory-prospective-chart-positions-v1';
let positions={};try{const saved=JSON.parse(localStorage.getItem(positionKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))positions=saved;}catch{}
const savePositions=()=>{try{localStorage.setItem(positionKey,JSON.stringify(positions));}catch{}};
const ids=['kpi','routes','areas','season','heat','trend','forecast','modes','network','anomaly','index'];
const W={
pt:['Inteligência prospectiva','Escolher gráficos','Histórico analítico','Meses','Todo o histórico','Projeção (meses)','Indicadores','Corredores documentados','Concentração por país','Sazonalidade mensal','Sazonalidade por grupo','Tendência recente','Projeção de registros','Modais de transporte','Rede de conexões','Anomalias','Prioridade descritiva','Sem dados suficientes','Eventos documentados; não mede incidência real.','Histórico independente do período do mapa.','Registros sem data precisa','Casos no histórico','Casos na seleção','Últimos 3 meses','3 meses anteriores','Média mensal','Observado','Projetado','Faixa empírica de erro (90%)','MAE retrospectivo','Conexões distintas','Registros recentes / anteriores','Sinal de aumento','Sem sinal de aumento','Amostra insuficiente para sazonalidade (24 meses completos).','Previsão indisponível: série curta, esparsa ou sem desempenho retrospectivo suficiente.','Apenas países; inclui movimentos pretendidos e realizados, conforme evidência.','Não é probabilidade de crime.','Fechar','Gráficos','Recente / histórico','Meses completos; zeros = ausência de registros, não de crimes.','Sem variação calculável','Desvio padronizado do último mês','Fontes analíticas','Dados públicos; não inclui informação restrita.','Movimentos documentados: países, sem inferir trajeto.','Últimos 3 meses / 3 anteriores / histórico','Média histórica','Sem rotas vinculadas','Pico mensal','Amostra exploratória; cobertura desigual.'],
en:['Prospective intelligence','Choose charts','Analysis history','Months','All history','Forecast (months)','Indicators','Documented corridors','Country concentration','Monthly seasonality','Seasonality by group','Recent trend','Reported-event forecast','Transport modes','Connection network','Anomalies','Descriptive priority','Insufficient data','Documented events; not true incidence.','History independent of map period.','Records without precise date','Historical cases','Selected cases','Last 3 months','Previous 3 months','Monthly mean','Observed','Projected','Empirical error band (90%)','Retrospective MAE','Distinct connections','Recent / previous records','Increase signal','No increase signal','Insufficient seasonality sample (24 complete months).','Forecast unavailable: short or sparse series, or insufficient retrospective performance.','Countries only; includes intended and completed movements as evidenced.','Not a crime probability.','Close','Charts','Recent / historical','Complete months; zero means no records, not no crime.','Change not computable','Standardized deviation of last month','Analytical sources','Public data; excludes restricted information.','Documented movements: countries, no inferred itinerary.','Last 3 months / previous 3 / history','Historical mean','No linked routes','Monthly peak','Exploratory sample; uneven coverage.'],
es:['Inteligencia prospectiva','Elegir gráficos','Historial analítico','Meses','Todo el historial','Proyección (meses)','Indicadores','Corredores documentados','Concentración por país','Estacionalidad mensual','Estacionalidad por grupo','Tendencia reciente','Proyección de registros','Modos de transporte','Red de conexiones','Anomalías','Prioridad descriptiva','Datos insuficientes','Eventos documentados; no mide incidencia real.','Historial independiente del período del mapa.','Registros sin fecha precisa','Casos históricos','Casos seleccionados','Últimos 3 meses','3 meses anteriores','Media mensual','Observado','Proyectado','Banda empírica de error (90%)','MAE retrospectivo','Conexiones distintas','Registros recientes / anteriores','Señal de aumento','Sin señal de aumento','Muestra insuficiente para estacionalidad (24 meses completos).','Proyección no disponible: serie corta, dispersa o rendimiento retrospectivo insuficiente.','Solo países; incluye movimientos previstos y realizados según evidencia.','No es probabilidad de delito.','Cerrar','Gráficos','Reciente / histórico','Meses completos; cero significa ausencia de registros, no de delitos.','Variación no calculable','Desviación estandarizada del último mes','Fuentes analíticas','Datos públicos; excluye información restringida.','Movimientos documentados: países, sin inferir itinerario.','Últimos 3 meses / 3 anteriores / historial','Media histórica','Sin rutas vinculadas','Pico mensual','Muestra exploratoria; cobertura desigual.']
};
const lang=()=>last?.api?.lang()||'en',t=i=>(W[lang()]||W.en)[i],fmt=n=>new Intl.NumberFormat(lang(),{maximumFractionDigits:1}).format(n),country=k=>window.CountryNames?.label(k,lang())||k;
const group=k=>window.NEWS_TERMS?.[k]?.[lang()==='en'?0:1]&&lang()!=='pt'?window.NEWS_TERMS[k][lang()==='en'?0:1]:k;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const svg=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
const add=(s,tag,attrs,txt)=>{const e=svg(tag,attrs);if(txt!==undefined)e.textContent=txt;s.append(e);return e;};
function registerSource(id,adapter){if(typeof adapter?.snapshot!=='function')throw Error('Explicit snapshot adapter required');sources.set(id,adapter);invalidate();return()=>{sources.delete(id);invalidate();};}
function invalidate(){dirty=true;if(last?.active&&enabled)render();}
const normalize=e=>{const core=window.ObservatoryTimeCore,basis=window.ObservatoryTime?.state()?.basis||'occurrence',d=core.indicatorDate(e,basis);return {id:String(e.id),canonicalId:String(e.case_id||e.id),country:e.country,groups:e.groups||[],mode:e.modeGroup,day:core.dateOf(e,'occurrence').day,indicatorMonth:d.month,indicatorDay:d.day,countable:window.CaseContext.countable(e)};};
sources.set('canonical-cases',{snapshot:({api})=>({rows:api.filtered('base').map(normalize),visible:api.filtered().map(normalize),edges:[]})});
sources.set('documented-routes',{snapshot:({api})=>({rows:[],visible:[],edges:window.DocumentedRoutes.segments(api.filtered('base'),window.NEWS_DATA).map(d=>({eventId:String(d.event.id),from:window.CountryNames?.canonical(d.segment.from.country)||d.segment.from.country,to:window.CountryNames?.canonical(d.segment.to.country)||d.segment.to.country,direction:window.DocumentedRoutes.direction(d.direction),kind:d.route.route_type}))})});
function activeSources(){const ib=window.IbamaFauna;return [...(!ib||ib.osint()?['osint']:[]),...(ib?.enabled()?['ibama']:[])];}
function calculate(){
 const ib=window.IbamaFauna,active=activeSources(),results={};
 const year=Number(document.getElementById('year')?.value||0),now=window.ObservatoryTimeCore.day(Date.now()),yearEnd=year?String(year+1)+'-01-01':null;
 let osintData=null,officialData=null;
 if(active.includes('osint')){
  const all={rows:[],visible:[],edges:[]};
  for(const adapter of sources.values()){const data=adapter.snapshot(last);for(const k of Object.keys(all))all[k].push(...(data[k]||[]));}
  osintData=all;const end=yearEnd&&yearEnd<now?yearEnd:now;
  results.osint=C.analyze({...all,history,horizon,now:end,coverageStart:year&&yearEnd<now?String(year)+'-01-01':undefined,disableForecast:Boolean(yearEnd&&yearEnd<now)});
  results.osint.indicators=C.indicators(all.rows,{visible:all.visible,history,now,coverageStart:year?String(year)+'-01-01':undefined,coverageEnd:year&&yearEnd<=now?String(year)+'-12-31':undefined,basis:window.ObservatoryTime?.state()?.basis||'occurrence'});
 }
 if(active.includes('ibama')&&ib.ready()){
  officialData=ib.snapshots();const end=yearEnd&&yearEnd<'2026-01-01'?yearEnd:'2026-01-01',coverage=year>=2020&&year<=2025?String(year)+'-01-01':'2020-01-01';
  results.ibama=C.analyze({...officialData,history,horizon,now:end,coverageStart:coverage,disableForecast:true});
  results.ibama.indicators=C.indicators(officialData.rows.map(r=>({...r,indicatorMonth:r.day?.slice(0,7),indicatorDay:r.day})),{visible:officialData.visible,history,now,coverageStart:coverage,coverageEnd:year>=2020&&year<=2025?String(year)+'-12-31':'2025-12-31',basis:'notice'});
 }
 // Compare only Brazil, on shared complete calendar years. Separate denominators.
 let comparison=null;
 if(osintData&&officialData&&!year){
  const brazil=osintData.rows.filter(r=>r.countable&&window.CountryNames?.canonical(r.country)==='Brasil'&&/^\d{4}-\d{2}-\d{2}$/.test(r.day||'')&&r.day<now);
  const dates=brazil.map(r=>r.day).sort(),first=dates[0],lastDay=dates.at(-1);
  if(first&&lastDay){let from=Math.max(2020,Number(first.slice(0,4))+1),to=Math.min(2025,Number(lastDay.slice(0,4))-1);if(history)from=Math.max(from,to-Math.floor(history/12)+1);
   if(to-from+1>=2){
    const restrict=rows=>rows.filter(r=>r.countable&&r.day>=from+'-01-01'&&r.day<=(to+'-12-31'));
    const a=restrict(brazil),b=restrict(officialData.rows);
    const monthly=rows=>Array.from({length:12},(_,i)=>100*rows.filter(r=>Number(r.day.slice(5,7))===i+1).length/rows.length);
    if(a.length>=36&&b.length>=36)comparison={from,to,osint:monthly(a),ibama:monthly(b),nOsint:a.length,nIbama:b.length};
   }
  }
 }
 return {active,results,comparison};
}
function ensure(){
 if(root)return;root=el('div','prospective-root');root.id='prospectiveRoot';button=el('button','prospective-toggle');button.type='button';button.setAttribute('aria-expanded','false');button.onclick=()=>{if(optionsOpen){setOptions(false);return;}if(!enabled){enabled=true;charts.hidden=false;dirty=true;render();}setOptions(true);};button.id='prospectiveToggle';button.hidden=true;last.root.querySelector('#cleanMapControls').insertBefore(button,last.root.querySelector('#cleanLanguageHost'));
 panel=el('section','prospective-options');panel.id='prospectiveOptions';panel.hidden=true;button.setAttribute('aria-controls',panel.id);panel.dataset.chart='options';charts=el('div','prospective-charts');charts.hidden=true;root.append(charts,panel);last.root.append(root);
 buildControls();
}
function setOptions(open){
 optionsOpen=open;button.setAttribute('aria-expanded',String(open));panel.hidden=!open||!last?.active;
 if(open&&last?.active){panel.style.zIndex=String(++zCounter);placeOptions();}else if(last?.active){button.focus({preventScroll:true});}
}
function placeOptions(){
 if(panel.hidden||dragging)return;
 const l=limits(panel),p=positions.options;
 if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){put(panel,p.x*l.x,p.y*l.y);return;}
 const b=button.getBoundingClientRect(),r=root.getBoundingClientRect();
 const x=b.left-r.left-panel.offsetWidth-12,y=b.top-r.top;
 if(x>=0){put(panel,x,y);return;}
 put(panel,b.left-r.left,b.bottom-r.top+10);
}
function buildControls(){
 panel.replaceChildren();const head=el('header','prospective-card-header'),heading=el('h3'),handle=el('button','prospective-drag',t(1));handle.type='button';handle.title=extra().move;handle.setAttribute('aria-label',t(1)+' — '+extra().move);heading.append(handle);head.append(heading);
 const close=el('button','prospective-card-close','×');close.type='button';close.title=t(38);close.setAttribute('aria-label',t(38)+': '+t(1));close.onclick=()=>setOptions(false);head.append(close);panel.append(head);attachDrag(panel,handle);
 function select(label,values,selected,change){const l=el('label','prospective-field',label),s=el('select');for(const [v,name] of values){const o=el('option','',name);o.value=v;s.append(o);}s.value=selected;s.onchange=()=>{change(Number(s.value));dirty=true;render();};l.append(s);panel.append(l);}
 const sourceLine=el('small','prospective-source-summary');sourceLine.id='prospectiveSources';panel.append(sourceLine);
 select(t(2),[[12,'12 '+t(3)],[24,'24 '+t(3)],[36,'36 '+t(3)],[0,t(4)]],history,v=>history=v);
 select(t(5),[[30,'1'],[60,'2'],[90,'3']],horizon,v=>horizon=v);
 const options=el('div','prospective-checks');for(let i=0;i<ids.length;i++){const l=el('label'),c=el('input');c.type='checkbox';c.dataset.chart=ids[i];c.checked=chosen.has(ids[i]);c.onchange=()=>{c.checked?chosen.add(ids[i]):chosen.delete(ids[i]);render();};l.append(c,document.createTextNode(t(6+i)));options.append(l);}statusNode=el('small','prospective-status');statusNode.setAttribute('role','status');statusNode.setAttribute('aria-live','polite');const reset=el('button','prospective-reset',extra().reset);reset.type='button';reset.onclick=()=>{positions={};savePositions();render();placeOptions();};panel.append(options,reset,statusNode,el('small','',t(18)+' '+t(43)));
}
const extra=()=>({pt:{move:'Arrastar para mover o gráfico (ou usar as setas)',close:'Fechar gráfico',error:'Não foi possível calcular a análise. Tente novamente.',loading:'Carregando dados canônicos…',ready:'Análise calculada',months:'meses completos',reset:'Restaurar posições'},en:{move:'Drag to move chart (or use arrow keys)',close:'Close chart',error:'Unable to calculate analysis. Try again.',loading:'Loading canonical data…',ready:'Analysis calculated',months:'complete months',reset:'Reset positions'},es:{move:'Arrastrar para mover el gráfico (o usar las flechas)',close:'Cerrar gráfico',error:'No se pudo calcular el análisis. Intente de nuevo.',loading:'Cargando datos canónicos…',ready:'Análisis calculado',months:'meses completos',reset:'Restaurar posiciones'}}[lang()]||{move:'Drag to move chart',close:'Close chart',error:'Unable to calculate analysis',loading:'Loading data…',ready:'Analysis calculated',months:'complete months',reset:'Reset positions'});
const clamp=(n,min,max)=>Math.min(Math.max(min,max),Math.max(min,n));
function limits(s){return {x:Math.max(0,root.clientWidth-s.offsetWidth-8),y:Math.max(0,root.clientHeight-s.offsetHeight-8)};}
function put(s,x,y,remember=false){const l=limits(s);x=clamp(x,0,l.x);y=clamp(y,0,l.y);s.style.left=x+'px';s.style.top=y+'px';if(remember){positions[s.dataset.chart]={x:l.x?x/l.x:0,y:l.y?y/l.y:0};savePositions();}}
function place(s,i){
 const l=limits(s),p=positions[s.dataset.chart];
 if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){put(s,p.x*l.x,p.y*l.y);return;}
 const leftWidth=last.root.querySelector('#cleanMapCharts')?.getBoundingClientRect().width||0;
 const start=Math.min(l.x,leftWidth+34),room=charts.clientWidth-start;
 const cols=Math.max(1,Math.floor(room/(s.offsetWidth+12)));
 const col=i%cols,row=Math.floor(i/cols),x=start+col*(s.offsetWidth+12),y=100+row*160;
 put(s,x+(y>l.y?Math.floor((y-l.y)/45)*14:0),y>l.y?Math.max(8,l.y-(row%3)*18):y);
}
function card(title,id){
 const s=el('section','prospective-card');s.dataset.chart=id;s.setAttribute('aria-label',title);s.style.zIndex=String(++zCounter);
 const header=el('header','prospective-card-header'),handle=el('button','prospective-drag',title),close=el('button','prospective-card-close','×');handle.type='button';handle.title=extra().move;handle.setAttribute('aria-label',title+' — '+extra().move);close.type='button';close.title=extra().close;close.setAttribute('aria-label',extra().close+': '+title);
 const heading=el('h3');heading.append(handle);header.append(heading,close);s.append(header);charts.append(s);
 close.onclick=()=>{chosen.delete(id);const input=panel.querySelector('input[data-chart="'+id+'"]');if(input)input.checked=false;s.remove();if(!chosen.size)statusNode.textContent=extra().ready;};
 attachDrag(s,handle);return s;
}
function attachDrag(s,handle){
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();dragging=true;s.style.zIndex=String(++zCounter);handle.setPointerCapture(e.pointerId);const ox=e.clientX-s.offsetLeft,oy=e.clientY-s.offsetTop;
 const move=ev=>{ev.stopPropagation();put(s,ev.clientX-ox,ev.clientY-oy);};
 const done=ev=>{ev.stopPropagation();handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',done);handle.removeEventListener('pointercancel',done);handle.removeEventListener('lostpointercapture',done);put(s,s.offsetLeft,s.offsetTop,true);dragging=false;if(rerender){rerender=false;render();}};
 handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',done);handle.addEventListener('pointercancel',done);handle.addEventListener('lostpointercapture',done);
 });
 handle.addEventListener('keydown',e=>{const d={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.key];if(!d)return;e.preventDefault();e.stopPropagation();s.style.zIndex=String(++zCounter);put(s,s.offsetLeft+d[0],s.offsetTop+d[1],true);});
}
function note(s,txt){s.append(el('small','prospective-note',txt));}
function bars(s,data,label=x=>x.key){if(!data.length){note(s,t(17));return;}const max=Math.max(1,...data.map(x=>x.n));for(const d of data.slice(0,6)){const row=el('div','prospective-row'),h=el('div','prospective-row-head');h.append(el('span','',label(d)),el('b','',fmt(d.n)));const rail=el('div','prospective-rail'),fill=el('span');fill.style.width=100*d.n/max+'%';rail.append(fill);row.append(h,rail);s.append(row);}}
// One localized month-initial convention for all chronological axes.
function monthInitial(i,locale=lang()){return new Intl.DateTimeFormat(locale,{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,i,1))).charAt(0).toLocaleUpperCase(locale);}
function monthLabel(key){const match=/^\d{4}-(0[1-9]|1[0-2])$/.exec(String(key));return match?monthInitial(Number(match[1])-1):'';}
function line(s,values,opts={}){
 if(!values.length){note(s,t(17));return;}const future=opts.future||[],all=[...values,...future],max=Math.max(1,...all.map(x=>Math.max(x.n,x.hi||0)),opts.ref||0)*1.13,w=286,h=112,x=i=>24+i*254/Math.max(1,all.length-1),y=v=>89-v*75/max;
 const z=svg('svg',{viewBox:'0 0 286 112',role:'img','aria-label':s.querySelector('h3').textContent});for(const v of [0,max/2,max]){add(z,'line',{x1:24,x2:278,y1:y(v),y2:y(v),class:'pi-grid'});add(z,'text',{x:20,y:y(v)+3,'text-anchor':'end'},fmt(v));}
 const path=(arr,offset=0)=>arr.map((d,i)=>(i?'L':'M')+x(i+offset)+' '+y(d.n)).join(' ');
 if(opts.ref!==undefined)add(z,'line',{x1:24,x2:278,y1:y(opts.ref),y2:y(opts.ref),class:'pi-reference'});
 if(future.length){const off=values.length,lo=future.map((d,i)=>x(off+i)+' '+y(d.lo)),hi=future.map((d,i)=>x(off+i)+' '+y(d.hi));add(z,'polygon',{points:[...hi,...lo.reverse()].join(' '),class:'pi-band'});add(z,'path',{d:path([values.at(-1),...future],off-1),class:'pi-forecast'});}
 add(z,'path',{d:path(values),class:'pi-line'});
 if(opts.indicator)values.forEach((v,i)=>{const dot=add(z,'circle',{cx:x(i),cy:y(v.n),r:v.partial?3.5:2,fill:v.partial?'#f6b65c':'currentColor',stroke:v.partial?'#f6b65c':'none'});add(dot,'title',{},v.key+': '+fmt(v.n)+(v.partial?' · '+indicatorWords().partial:''));});
 const step=Math.max(1,Math.ceil(all.length/15));all.forEach((d,i)=>{if(i%step===0||i===all.length-1){const label=add(z,'text',{x:x(i),y:105,'text-anchor':'middle'},monthLabel(d.key));if(!opts.seasonal)add(label,'title',{},new Intl.DateTimeFormat(lang(),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d.key+'-01T00:00:00Z')));}});s.append(z);
}
function pairLabel(d){return country(d.a)+(d.directed?' → ':d.key.includes('↔')?' ↔ ':' — ')+country(d.b);}
function render(){try{renderCharts();}catch(error){console.error('Prospective chart rendering failed',error);if(statusNode)statusNode.textContent=extra().error;}}
const compareWords=()=>({pt:{sources:'Fontes ativas',none:'Nenhuma fonte selecionada.',common:'Sazonalidade relativa · Brasil',share:'Percentual dos registros de cada fonte; não mede incidência.',insufficient:'Sem dois anos completos comuns e amostra suficiente para comparação normalizada.',loading:'IBAMA: dados ainda não carregados.',separate:'Séries independentes; os totais não são somados.',notApplicable:'Não documentado nesta fonte.',end:'Histórico até',units:'autos'},en:{sources:'Active sources',none:'No source selected.',common:'Relative seasonality · Brazil',share:'Share of each source’s records; not incidence.',insufficient:'Two shared complete years and adequate samples are not available for normalized comparison.',loading:'IBAMA: data not loaded yet.',separate:'Independent series; totals are not combined.',notApplicable:'Not documented by this source.',end:'History through',units:'notices'},es:{sources:'Fuentes activas',none:'Ninguna fuente seleccionada.',common:'Estacionalidad relativa · Brasil',share:'Porcentaje de registros de cada fuente; no mide incidencia.',insufficient:'No hay dos años completos comunes y muestras suficientes para comparar.',loading:'IBAMA: datos aún no cargados.',separate:'Series independientes; no se suman los totales.',notApplicable:'No documentado por esta fuente.',end:'Historial hasta',units:'actas'}}[lang()]);
function sourceSummary(){const n=panel?.querySelector('#prospectiveSources');if(n)n.textContent=compareWords().sources+': '+(activeSources().map(s=>s.toUpperCase()).join(' + ')||compareWords().none);}
function normalizedSeason(s,d){const w=compareWords();const section=el('section','prospective-comparison');section.append(el('h3','',w.common));s.append(section);if(!d){note(section,w.insufficient);return;}
 const z=svg('svg',{viewBox:'0 0 286 112',role:'img','aria-label':w.common}),max=Math.max(10,...d.osint,...d.ibama)*1.12,x=i=>24+i*254/11,y=v=>89-v*75/max;
 for(const v of [0,max/2,max]){add(z,'line',{x1:24,x2:278,y1:y(v),y2:y(v),class:'pi-grid'});add(z,'text',{x:20,y:y(v)+3,'text-anchor':'end'},fmt(v)+'%');}
 for(const k of ['osint','ibama'])add(z,'path',{d:d[k].map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(' '),class:k==='ibama'?'pi-line pi-ibama-comparison':'pi-line'});
 for(let i=0;i<12;i++)add(z,'text',{x:x(i),y:105,'text-anchor':'middle'},monthInitial(i));
 section.append(z);note(section,'OSINT (n='+fmt(d.nOsint)+') · IBAMA (n='+fmt(d.nIbama)+') · '+d.from+'–'+d.to);note(section,w.share);
}
function indicatorWords(){return ({pt:{occurrence:'Data de ocorrência',publication:'Data de publicação',occurrence_or_publication:'Ocorrência ou publicação (primeiro mês documentado; 1 por caso)',incorporation:'Data de incorporação validada',notice:'Data da autuação',history:'Registros no período do gráfico',undated:'Sem mês identificável',monthOnly:'Com mês conhecido, sem dia exato',partial:'Último mês parcial, até hoje',range:'Intervalo do gráfico',independent:'Histórico do gráfico independente do período do mapa; casos na seleção respeitam o filtro temporal diário.',model:'Outros gráficos analíticos usam meses completos e datas exatas de ocorrência (IBAMA: autuação).'},en:{occurrence:'Occurrence date',publication:'Publication date',occurrence_or_publication:'Occurrence or publication (earliest documented month; once per case)',incorporation:'Validated incorporation date',notice:'Notice date',history:'Records in chart period',undated:'No identifiable month',monthOnly:'Known month, no exact day',partial:'Latest month incomplete, through today',range:'Chart interval',independent:'Chart history independent of map period; selected cases follow daily temporal filter.',model:'Other analytical charts use complete months and exact occurrence dates (IBAMA: notice).'},es:{occurrence:'Fecha del hecho',publication:'Fecha de publicación',occurrence_or_publication:'Hecho o publicación (primer mes documentado; una vez por caso)',incorporation:'Fecha de incorporación validada',notice:'Fecha del acta',history:'Registros en el intervalo del gráfico',undated:'Sin mes identificable',monthOnly:'Mes conocido, sin día exacto',partial:'Último mes parcial, hasta hoy',range:'Intervalo del gráfico',independent:'Historial independiente del período del mapa; selección según el filtro temporal diario.',model:'Los demás gráficos analíticos usan meses completos y fechas exactas del hecho (IBAMA: acta).'}})[lang()]||{};}
function renderCharts(){
 if(!last?.active||!enabled)return;if(dragging){rerender=true;return;}
 try{if(dirty||!cache){cache=calculate();dirty=false;}}catch(error){console.error('Prospective analysis calculation failed',error);charts.replaceChildren();statusNode.textContent=extra().error;const err=card(t(0),'error');note(err,extra().error);place(err,0);return;}
 const {active,results,comparison}=cache;charts.replaceChildren();sourceSummary();const iw=window.IbamaFauna?.words(),cw=compareWords();
 statusNode.textContent=active.length?active.map(k=>results[k]?k.toUpperCase()+' · '+fmt(results[k].historyCount)+' · '+results[k].months.length+' '+extra().months:k.toUpperCase()+' · '+t(17)).join(' | '):cw.none;
 if(!active.length)return;
 for(const id of ids){if(!chosen.has(id))continue;const i=ids.indexOf(id),onlyIb=active.length===1&&active[0]==='ibama',cardNode=card(onlyIb&&id==='areas'?iw.byState:onlyIb&&id==='index'?iw.priority:t(6+i),id);
 for(const key of active){
 const ib=key==='ibama',a=results[key],s=el('section','prospective-source-section '+(ib?'pi-source-ibama':'pi-source-osint'));cardNode.append(s);
 const title=(ib&&id==='areas'?iw.byState:ib&&id==='index'?iw.priority:key.toUpperCase());s.append(el('h3','prospective-source-heading',title+(ib&&['areas','index'].includes(id)?' · IBAMA':'')));
 if(!a){note(s,ib?cw.loading:t(17));continue;}
 if(ib&&id==='forecast'){note(s,iw.noProjection);continue;}
 if(ib&&['routes','network','modes'].includes(id)){note(s,cw.notApplicable);continue;}
 const enough=a.months.length>=24&&a.historyCount>=36&&a.months.filter(x=>x.n>0).length>=12;
 switch(id){
 case 'kpi':{const k=el('div','prospective-kpis'),b=a.indicators,w=indicatorWords();for(const [n,v] of [[ib?iw.ready:t(22),b.selected],[w.history,b.count],[w.undated,b.undated]]){const d=el('div');d.append(el('small','',n),el('b','',fmt(v)));k.append(d);}s.append(k);note(s,w[b.basis]);if(b.start)note(s,w.range+': '+b.start+' — '+b.end+(b.partial?' · '+w.partial:''));line(s,b.months,{indicator:true});if(b.monthOnly)note(s,w.monthOnly+': '+fmt(b.monthOnly));note(s,w.independent);note(s,w.model);break;}
 case 'routes':bars(s,a.route.pairs,pairLabel);note(s,t(36));break;
 case 'areas':bars(s,a.areas.map(x=>({key:x.key,n:x.n})),x=>ib?x.key:country(x.key));break;
 case 'season':if(!enough){note(s,t(34));break;}line(s,a.season.map((x,i)=>({key:'2020-'+String(i+1).padStart(2,'0'),n:x.n})),{seasonal:true});note(s,t(25)+' · '+t(41));break;
 case 'heat':{if(!enough){note(s,t(34));break;}const grid=el('div','prospective-heat');grid.append(el('span'));for(let i=0;i<12;i++)grid.append(el('small','',monthInitial(i)));for(const g of a.groupSeason.slice(0,5)){grid.append(el('small','',group(g.key)));const max=Math.max(1,...g.values);for(const n of g.values){const cell=el('span','pi-cell');cell.style.opacity=String(.12+.88*n/max);cell.title=group(g.key)+': '+fmt(n);grid.append(cell);}}s.append(grid);note(s,t(50));break;}
 case 'trend':s.append(el('strong','prospective-metric',a.trend===null?'—':(a.trend>0?'+':'')+fmt(a.trend)+'%'));line(s,a.months.slice(-12),{ref:a.months.length>3?a.months.slice(0,-3).reduce((n,x)=>n+x.n,0)/(a.months.length-3):0});note(s,t(23)+': '+fmt(a.recent)+' · '+t(24)+': '+fmt(a.prior));break;
 case 'forecast':if(!a.forecast){note(s,t(35));break;}line(s,a.months.slice(-12),{future:a.forecast.estimates});note(s,t(26)+' / '+t(27)+' · '+t(28)+' · '+t(29)+': '+fmt(a.forecast.mae)+' (n='+a.forecast.origins+')');break;
 case 'modes':{const keys=[...new Set(a.modeRows.flatMap(x=>x.map(v=>v.key)))].sort();const cols=['#60a5fa','#527da1','#94a3b8','#7b8a9b','#b7cbdc','#57606c'];a.modeRows.forEach((r,j)=>{s.append(el('small','',[t(23),t(24),t(21)][j]));const rail=el('div','pi-stack'),n=r.reduce((v,x)=>v+x.n,0);for(const d of r){const span=el('span');span.style.width=100*d.n/Math.max(1,n)+'%';span.style.background=cols[keys.indexOf(d.key)%cols.length];span.title=group(d.key)+': '+fmt(d.n);rail.append(span);}s.append(rail);});const legend=el('div','pi-legend');keys.forEach((k,i)=>{const n=el('span','',group(k));n.style.borderLeft='5px solid '+cols[i%cols.length];legend.append(n);});s.append(legend);break;}
 case 'network':{const nodes=a.route.nodes.slice(0,6);bars(s,nodes,x=>country(x.key));note(s,t(30)+' · '+t(45));break;}
 case 'anomaly':s.append(el('strong','prospective-metric',a.anomaly===null?'—':fmt(a.anomaly)+' σ'));note(s,a.anomaly===null?t(17):t(42)+' · '+(a.anomaly>=2?t(32):t(33)));line(s,a.months.slice(-12));break;
 case 'index':{if(a.months.length<6){note(s,t(17));break;}bars(s,a.areas.filter(x=>x.recent>0).map(x=>({key:x.key,n:x.recent})),x=>ib?x.key:country(x.key));note(s,t(31)+' · '+t(37));for(const d of a.areas.filter(x=>x.recent>0).slice(0,5))note(s,(ib?d.key:country(d.key))+': '+d.recent+' / '+d.prior);break;}
 }
 if(id!=='kpi'&&a.months.length)note(s,cw.end+' '+a.months.at(-1).key);
 if(ib)note(s,iw.historical);else note(s,t(18));
 }
 if(active.length>1){if(id==='season')normalizedSeason(cardNode,comparison);note(cardNode,cw.separate);}
 }
 [...charts.querySelectorAll('.prospective-card')].forEach((s,i)=>place(s,i));
 placeOptions();
}
let prevLang='';
function sync(ctx){last=ctx;if(!ctx?.root||!ctx.api)return;ensure();root.hidden=!ctx.active;button.hidden=!ctx.active;panel.hidden=!ctx.active||!optionsOpen;charts.hidden=!enabled;if(!ctx.active)return;button.textContent=t(0);if(prevLang!==lang()){prevLang=lang();buildControls();}sourceSummary();if(enabled){dirty=true;render();}placeOptions();}
return Object.freeze({sync,registerSource,invalidate});
})();

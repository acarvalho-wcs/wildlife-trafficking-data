/* Case metadata is persisted during ingestion, never on page load. */
window.CaseContext = (() => {
  const DAY = 86400000;
  const RECENT_WINDOW = 7 * DAY;
  const labels = {
    pt: {recent:'Evento recente (últimos 7 dias)',historical:'Eventos anteriores',title:'Contexto do caso',references:'Referências',updated:'Última atualização',added:'Incorporado',locale:'pt-BR'},
    en: {recent:'Recent event (last 7 days)',historical:'Earlier events',title:'Case context',references:'References',updated:'Last updated',added:'Added',locale:'en-US'},
    es: {recent:'Evento reciente (últimos 7 días)',historical:'Eventos anteriores',title:'Contexto del caso',references:'Referencias',updated:'Última actualización',added:'Incorporado',locale:'es-ES'}
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const caseText = window.ScientificText.html;
  const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  // Validate source calendar days without assigning an event time to them.
  const calendarDate = value => {
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const [year,month,day]=value.split('-').map(Number),leap=year%4===0&&(year%100!==0||year%400===0);
    return month>=1&&month<=12&&day>=1&&day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
  };
  const eventTimestamp = value => {
    // A real instant needs its documented UTC offset; never assume a missing timezone.
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)||!calendarDate(value.slice(0,10)))return NaN;
    return Date.parse(value);
  };
  const calendarFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Manaus',year:'numeric',month:'2-digit',day:'2-digit'});
  // Locale punctuation/order varies between browser/ICU versions (en-CA may
  // render MM/DD/YYYY). Compare ISO keys assembled from named numeric parts.
  const localDay = now => {
    const parts=Object.fromEntries(calendarFormatter.formatToParts(new Date(now)).map(p=>[p.type,p.value]));
    return parts.year+'-'+parts.month+'-'+parts.day;
  };
  const occurrenceDay = e => {
    if(!e)return null;
    const value=e.occurred_at;
    const missing=value===null||value===undefined||value==='';
    const dayPrecision=e.occurred_at_precision==='day'||(!e.occurred_at_precision&&e.event_date_precision==='day');
    if(dayPrecision)return calendarDate(e.event_date)?e.event_date:calendarDate(value?.slice(0,10))?value.slice(0,10):null;
    if(calendarDate(value))return value;
    return missing&&calendarDate(e.event_date)?e.event_date:null;
  };
  const isRecent = (e, now=Date.now()) => {
    if(!e||!Number.isFinite(now))return false;
    const day=occurrenceDay(e);
    // Day-precision midnight values are placeholders, not documented event times.
    if(day)return day>=localDay(now-6*DAY)&&day<=localDay(now);
    if(e.occurred_at_precision==='day'||(!e.occurred_at_precision&&e.event_date_precision==='day'))return false;
    const age=now-eventTimestamp(e.occurred_at);
    return age>=0&&age<=RECENT_WINDOW;
  };
  const color = (e,now=Date.now()) => isRecent(e,now)?'#ff6b5f':'#d3ff55';
  const opacity = (e,now=Date.now()) => isRecent(e,now)?.95:1;
  const safeURL = value => {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
  function added(e,lang,now=Date.now()) {
    const at=timestamp(e.added_at);if(!Number.isFinite(at)||at>now)return '';
    const t=labels[lang],seconds=Math.floor((now-at)/1000);
    const [unit,value]=seconds<60?['second',seconds]:seconds<3600?['minute',Math.floor(seconds/60)]:seconds<86400?['hour',Math.floor(seconds/3600)]:['day',Math.floor(seconds/86400)];
    return '<div class="case-added popup-meta" data-case-id="'+esc(e.case_id)+'">'+esc(t.added+': '+new Intl.RelativeTimeFormat(t.locale,{numeric:'always'}).format(-value,unit))+' <time datetime="'+esc(e.added_at)+'" title="'+esc(e.added_at)+'">· '+esc(new Intl.DateTimeFormat(t.locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(at))+' UTC</time></div>';
  }
  function externalHTML(e,lang){
    const t=labels[lang],body=e['context_'+lang];
    if(e.status!=='VALIDATED'||typeof body!=='string'||!body.trim())return '';
    const referenceText=e['references_text_'+lang]||e.references_text_pt||'';
    const referenceParts=referenceText.split(/(?=\[\d+\])/).map(s=>s.trim()).filter(Boolean);
    const linked=text=>text.split(/(https?:\/\/[^\s<>]+)/g).map(part=>safeURL(part)?'<a class="source-link" href="'+esc(part)+'" target="_blank" rel="noopener noreferrer">'+esc(part)+'</a>':caseText(part)).join('');
    const refs=referenceParts.length?'<h4>'+t.references+'</h4><ul>'+referenceParts.map(r=>'<li>'+linked(r)+'</li>').join('')+'</ul>':'';
    const at=timestamp(e.context_updated_at),updated=Number.isFinite(at)?'<time datetime="'+esc(e.context_updated_at)+'">'+esc(new Intl.DateTimeFormat(t.locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(at))+' UTC</time>':esc(e.last_update_text||'—');
    return '<section class="case-context" lang="'+t.locale+'"><h3>'+t.title+'</h3><div class="case-context-text">'+caseText(body)+'</div>'+refs+'<div class="popup-meta">'+t.updated+': '+updated+' · <span class="context-status">VALIDATED</span></div></section>';
  }
  function html(e,lang) {
    if(e._external_case)return externalHTML(e,lang);
    const body=e['context_'+lang],at=timestamp(e.context_updated_at);
    if(e.context_status!=='validated'||typeof body!=='string'||!body.trim()||!Number.isFinite(at))return '';
    const refs=(Array.isArray(e.context_references)?e.context_references:[]).filter(r=>r&&safeURL(r.url)&&typeof(r['title_'+lang]||r.title)==='string');
    if(!refs.length)return '';
    const t=labels[lang];
    return '<section class="case-context" lang="'+t.locale+'"><h3>'+t.title+'</h3><div class="case-context-text">'+caseText(body)+'</div><h4>'+t.references+'</h4><ul>'+refs.map(r=>'<li><a class="source-link" href="'+esc(safeURL(r.url))+'" target="_blank" rel="noopener noreferrer">'+caseText(r['title_'+lang]||r.title)+'</a></li>').join('')+'</ul><div class="popup-meta">'+t.updated+': <time datetime="'+esc(e.context_updated_at)+'">'+esc(new Intl.DateTimeFormat(t.locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(at))+' UTC</time> · <span class="context-status">VALIDATED</span></div></section>';
  }
  const enrich=e=>{const r={...e,case_id:e.case_id||String(e.id)};if(r.case_context){for(const l of ['pt','en','es'])r['context_'+l]=r.case_context[l];r.context_references=r.case_context.references;if(String(r.status||r.context_status).toUpperCase()==='VALIDATED')r.context_status=validationErrors(r).length?'pending':'validated';}return r;};
  function complete(e) {
    return e.context_status==='validated' && validationErrors(e).length===0 && ['pt','en','es'].every(l=>html(e,l)!=='');
  }
  function validationErrors(e) {
    if(e._external_case)return ['pt','en','es'].filter(l=>typeof e['context_'+l]!=='string'||!e['context_'+l].trim()).map(l=>'Missing context_'+l);
    if(String(e.status||e.context_status||'').toUpperCase()!=='VALIDATED')return [];
    const c=e.case_context,errors=[];
    if(!c||typeof c!=='object')return ['VALIDATED requires case_context'];
    for(const l of ['pt','en','es'])if(typeof c[l]!=='string'||!c[l].trim())errors.push('Missing case_context.'+l);
    if(!Number.isFinite(timestamp(e.context_updated_at)))errors.push('Missing context_updated_at');
    if(!Array.isArray(c.references)||!c.references.length)errors.push('Missing verified references');
    else for(const r of c.references)if(!r||!safeURL(r.url)||r.verified!==true||!Number.isFinite(timestamp(r.verified_at))||!(r.title||r.title_pt&&r.title_en&&r.title_es))errors.push('Reference requires title, URL and dated verification');
    return errors;
  }
  const countable=e=>e._external_case?e.exclude_from_totals!==true:e.exclude_from_totals!==true&&e.record_type!=='aggregate_operation'&&e.aggregate_operation!==true;
  function aggregateLabel(e,lang){return countable(e)?'':'<div class="popup-meta">'+({pt:'Operação agregada · excluída dos totais para evitar dupla contagem',en:'Aggregate operation · excluded from totals to avoid double counting',es:'Operación agregada · excluida de los totales para evitar duplicación'})[lang]+'</div>';}
  return {complete,validationErrors,countable,aggregateLabel,DAY,RECENT_WINDOW,labels,timestamp,eventTimestamp,isRecent,color,opacity,added,html,enrich};
})();

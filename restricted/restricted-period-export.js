// Restricted dashboard: occurrence dates and filtered spreadsheet exports, independent of ingestion dates.
// No Firestore access; callers pass only records already authorized by the app.
export const periodLabels={
 pt:{period:"Período da ocorrência",all:"Todos os períodos",d7:"Últimos 7 dias",d30:"Últimos 30 dias",d90:"Últimos 90 dias",d365:"Últimos 12 meses",year:"Ano específico",custom:"Intervalo personalizado",undated:"Sem data de ocorrência",yearLabel:"Ano",from:"De",to:"Até",export:"Exportar .xlsx",title:"Exportar registros correspondentes aos filtros ativos"},
 en:{period:"Occurrence period",all:"All periods",d7:"Last 7 days",d30:"Last 30 days",d90:"Last 90 days",d365:"Last 12 months",year:"Specific year",custom:"Custom date range",undated:"Without occurrence date",yearLabel:"Year",from:"From",to:"To",export:"Export .xlsx",title:"Export records matching the active filters"},
 es:{period:"Período de ocurrencia",all:"Todos los períodos",d7:"Últimos 7 días",d30:"Últimos 30 días",d90:"Últimos 90 días",d365:"Últimos 12 meses",year:"Año específico",custom:"Intervalo personalizado",undated:"Sin fecha de ocurrencia",yearLabel:"Año",from:"Desde",to:"Hasta",export:"Exportar .xlsx",title:"Exportar registros según los filtros activos"}
};
const dateFields=["event_date","occurrence_date","date_of_occurrence","seizure_date","incident_date","observation_date","occurred_at","observed_at","eventDate","occurrenceDate","seizureDate","incidentDate","observationDate","date"];
function dayMs(y,m,d){
 if(y<1800||y>2300||m<1||m>12||d<1||d>31)return null;
 const ms=Date.UTC(y,m-1,d),t=new Date(ms);
 return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?ms:null;
}
export function parseOccurrence(value){
 if(value==null||value==="")return null;
 if(typeof value==="object"){
  const date=typeof value.toDate==="function"?value.toDate():typeof value.seconds==="number"?new Date(value.seconds*1000):null;
  return date instanceof Date&&Number.isFinite(date.getTime())?parseOccurrence(date.toISOString().slice(0,10)):null;
 }
 if(typeof value==="number"&&Number.isInteger(value)&&value>=1800&&value<=2300)value=String(value);
 if(typeof value!=="string")return null;
 const s=value.trim();
 let m=s.match(/^(\d{4})$/);
 if(m){const y=+m[1];return y>=1800&&y<=2300?{start:Date.UTC(y,0,1),end:Date.UTC(y,11,31),year:y,precision:"year"}:null;}
 m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
 if(m){const y=+m[1],time=dayMs(y,+m[2],+m[3]);return time==null?null:{start:time,end:time,year:y,precision:"day"};}
 m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s.*)?$/);
 if(m){const y=+m[3],time=dayMs(y,+m[2],+m[1]);return time==null?null:{start:time,end:time,year:y,precision:"day"};}
 m=s.match(/^(\d{4})[-/](\d{1,2})$/);
 if(m){
  const y=+m[1],month=+m[2],start=dayMs(y,month,1);
  return start==null?null:{start,end:Date.UTC(y,month,1)-86400000,year:y,precision:"month"};
 }
 return null;
}
export function occurrenceOf(record){
 for(const key of dateFields){const d=parseOccurrence(record[key]);if(d)return d;}
 for(const key of ["event_year","occurrence_year","seizure_year","aurum_original_year"]){const d=parseOccurrence(record[key]);if(d)return d;}
 // created_at, updated_at and publication timestamps are not occurrence dates.
 return null;
}
export function matchesPeriod(record,period,year,from,to,now=new Date()){
 if(!period||period==="all")return true;
 const date=occurrenceOf(record);
 if(period==="undated")return !date;
 if(!date)return false;
 if(period==="year")return date.year===Number(year);
 if(period==="custom"){
  const lo=from?parseOccurrence(from)?.start:null,hi=to?parseOccurrence(to)?.end:null;
  if(from&&lo==null||to&&hi==null||lo!=null&&hi!=null&&lo>hi)return false;
  return (lo==null||date.end>=lo)&&(hi==null||date.start<=hi);
 }
 const days={"7d":7,"30d":30,"90d":90,"365d":365}[period];
 if(!days||date.precision!=="day")return false;
 const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 return date.start>=today-(days-1)*86400000&&date.start<=today;
}
function cell(value){
 let s=String(value??"").replace(/\0/g,"");
 // Protect spreadsheet applications against formula interpretation of text data.
 if(/^[\s]*[=+@]/.test(s)||(/^[\s]*-/.test(s)&&!/^-?\d+(?:[.,]\d+)?$/.test(s)))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
export function csvText(rows,columns){
 const lines=[columns.map(c=>cell(c.label)).join(",")];
 for(const row of rows)lines.push(columns.map(col=>cell(col.value(row))).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}

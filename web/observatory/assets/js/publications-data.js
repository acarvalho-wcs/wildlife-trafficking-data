/* Sole publication catalog. No case/report imports and no embedded records. */
window.PublicationsData=(()=>{
 const url='https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-data/main/publications.json';
 const languages=['pt','en','es'];
 const http=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}};
 function validate(data){
  if(!data||data.schema_version!=='1.0'||!Array.isArray(data.publications))throw Error('Invalid publication catalog');
  const ids=new Set();
  for(const p of data.publications){
   if(!p||typeof p.id!=='string'||ids.has(p.id)||!p.title_original||!Array.isArray(p.authors)||!http(p.zenodo_url))throw Error('Invalid publication');
   if(p.publication_date!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.publication_date)||!Number.isFinite(Date.parse(p.publication_date))||new Date(p.publication_date).toISOString().slice(0,10)!==p.publication_date))throw Error('Invalid date');
   if(languages.some(l=>!p['title_'+l]||typeof p['summary_'+l]!=='string'))throw Error('Missing translation');
   if(p.pdf_url&&!http(p.pdf_url))throw Error('Invalid PDF URL');ids.add(p.id);
  }
  return data.publications.filter(p=>p.status==='PUBLISHED').slice().sort((a,b)=>(b.publication_date||'').localeCompare(a.publication_date||''));
 }
 async function load(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('Publication feed unavailable');return validate(await response.json());}finally{clearTimeout(timer);}}
 return {url,validate,load,http};
})();

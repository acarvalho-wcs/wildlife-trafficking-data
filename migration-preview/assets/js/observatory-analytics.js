/* Optional GA4 transport. Public metadata only; never a dependency of the application. */
(() => {
 'use strict';
 if(window.ObservatoryAnalytics)return;
 const id='G-TB6FW0EZES',valid=l=>['pt','en','es'].includes(l);
 const fields={map_view:[],globe_view:[],case_open:['case_id','case_country','view'],route_open:['route_id','view'],search_use:[],filter_apply:['filter_type'],report_open:['report_id','report_type'],report_pdf:['report_id','report_type'],publication_open:['publication_id','publication_type'],zenodo_click:['publication_id'],research_open:['paper_id'],doi_click:['paper_id'],news_open:['news_id'],language_change:['from_language','to_language'],fullscreen_use:['view'],section_view:['page']};
 const allowed={view:['map','globe'],filter_type:['country','fauna','modal','date','text','other'],report_type:['weekly','semiannual','annual'],page:['dashboard','events','species','sources','reports','publications','how-it-works'],from_language:['pt','en','es'],to_language:['pt','en','es']};
 let language='pt';
 try{const q=new URLSearchParams(location.search).get('lang'),saved=localStorage.getItem('observatory-language');language=valid(q)?q:valid(saved)?saved:'pt';}catch{}
 const page=location.pathname.endsWith('/publications.html')?'publications':location.pathname.endsWith('/how-it-works.html')?'how-it-works':'dashboard';
 const locationSafe=location.origin+(page==='publications'?'/publications.html':page==='how-it-works'?'/how-it-works.html':'/');
 let referrer='';try{if(document.referrer)referrer=new URL(document.referrer).origin+'/';}catch{}
 function send(...args){try{if(typeof window.gtag==='function')window.gtag(...args);}catch{/* Analytics must never affect navigation or rendering. */}}
 function currentLanguage(){const s=document.getElementById('language')||document.getElementById('publicationLanguage')||document.getElementById('methodologyLanguage');return valid(s?.value)?s.value:language;}
 function value(key,v){if(typeof v!=='string'&&typeof v!=='number')return;v=String(v);if(!v||v.length>100)return;if(allowed[key])return allowed[key].includes(v)?v:undefined;if(key==='case_country')return /^[\p{L}\p{M}\s().,'’–-]+$/u.test(v)?v:undefined;return /^[a-zA-Z0-9_.:-]+$/.test(v)?v:undefined;}
 function track(name,params={}){try{if(!Object.hasOwn(fields,name))return;const data={send_to:id,site_area:'observatory',language:currentLanguage(),page_location:locationSafe,page_referrer:referrer};for(const key of fields[name]){const v=value(key,params[key]);if(v!==undefined)data[key]=v;}send('event',name,data);}catch{}}
 function changeLanguage(next){if(!valid(next)||next===language)return;const previous=language;language=next;send('set','language',next);track('language_change',{from_language:previous,to_language:next});}
 window.ObservatoryAnalytics=Object.freeze({track,changeLanguage,language:currentLanguage,page});
 send('set',{site_area:'observatory',language,page_location:locationSafe,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false,url_passthrough:false});
 // Automatic pageview only; no additional manual page_view on internal UI changes.
 send('config',id,{site_area:'observatory',page:page,page_title:'Wildlife Observatory — '+page,page_location:locationSafe,page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:true});
})();

/* Independent methodology page: no map, data loader or dashboard dependencies. */
(() => {
 const content=window.ObservatoryMethodology;
 if(!content)return;
 const key='observatory-language',themeKey='observatory-methodology-theme';
 const valid=value=>['pt','en','es'].includes(value);
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rich=s=>safe(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
 const num=i=>String(i+1).padStart(2,'0');
 const blocks=items=>items.map(item=>Array.isArray(item)?'<ul>'+item.map(v=>'<li>'+rich(v)+'</li>').join('')+'</ul>':'<p>'+rich(item)+'</p>').join('');
 function markup(lang){
  const t=content[valid(lang)?lang:'pt'];
  return '<a class="skip-link" href="#methodology-content">'+safe(t.skip)+'</a><header class="page-header"><a class="institution-logo" href="https://brasil.wcs.org/" target="_blank" rel="noopener noreferrer" aria-label="WCS Brasil"><img src="wcs-brasil.png" alt="WCS Brasil" width="100" height="122"></a><div class="heading"><p class="kicker">'+safe(t.kicker)+'</p><h1>'+safe(t.name)+'</h1><p class="subtitle">'+safe(t.subtitle)+'</p></div><div class="page-controls"><a id="observatoryBack" class="back-link" href="./?lang='+lang+'">'+safe(t.back)+'</a><div class="select-controls"><label><span>'+safe(t.language)+'</span><select id="methodologyLanguage" aria-label="'+safe(t.language)+'">'+['pt','en','es'].map(l=>'<option value="'+l+'"'+(l===lang?' selected':'')+'>'+l.toUpperCase()+'</option>').join('')+'</select></label><label><span>'+safe(t.theme)+'</span><select id="methodologyTheme" aria-label="'+safe(t.theme)+'"><option value="dark">'+safe(t.dark)+'</option><option value="light">'+safe(t.light)+'</option></select></label></div></div></header>'+
  '<main id="methodology-content"><div class="intro-grid"><div class="intro-copy">'+blocks(t.intro)+'</div><aside class="method-card"><p class="kicker">'+safe(t.methodology)+'</p><h2>'+safe(t.methodTitle)+'</h2><p>'+safe(t.methodText)+'</p><ul>'+t.distinctions.map(v=>'<li>'+safe(v)+'</li>').join('')+'</ul></aside></div><div class="reading-grid"><nav class="contents" aria-labelledby="contentsTitle"><h2 id="contentsTitle">'+safe(t.toc)+'</h2><ol>'+t.sections.map((s,i)=>'<li><a href="#'+s.id+'"><span class="section-number" aria-hidden="true">'+num(i)+'</span><span>'+safe(s.title)+'</span></a></li>').join('')+'</ol></nav><div class="sections">'+t.sections.map((s,i)=>'<section class="method-section" id="'+s.id+'" aria-labelledby="'+s.id+'-title"><div class="section-heading"><span class="section-number" aria-hidden="true">'+num(i)+'</span><h2 id="'+s.id+'-title">'+safe(s.title)+'</h2></div>'+blocks(s.blocks)+'</section>').join('')+'</div></div></main>'+
  '<footer class="institution-footer"><strong>'+safe(t.program)+'</strong><p>'+safe(t.credit)+'</p><a href="https://brasil.wcs.org/" target="_blank" rel="noopener noreferrer">brasil.wcs.org ↗</a></footer>';
 }
 window.MethodologyPage={markup};
 if(typeof document==='undefined')return;
 const root=document.getElementById('methodologyRoot');if(!root)return;
 const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
 const save=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
 const params=new URLSearchParams(location.search);
 let lang=valid(params.get('lang'))?params.get('lang'):valid(read(key))?read(key):'pt';
 let theme=['dark','light'].includes(params.get('theme'))?params.get('theme'):read(themeKey)||read('observatory-map-theme')||'dark';
 if(!['dark','light'].includes(theme))theme='dark';
 function applyTheme(){document.documentElement.dataset.theme=theme;document.getElementById('methodologyTheme').value=theme;save(themeKey,theme);}
 function updateURL(){try{const url=new URL(location.href);url.searchParams.set('lang',lang);url.searchParams.set('theme',theme);history.replaceState(null,'',url);}catch{}}
 function render(){
  root.innerHTML=markup(lang);document.documentElement.lang={pt:'pt-BR',en:'en',es:'es'}[lang];document.title=content[lang].title+' | '+content[lang].name;save(key,lang);applyTheme();updateURL();
  document.getElementById('methodologyLanguage').addEventListener('change',e=>{if(valid(e.target.value)){lang=e.target.value;render();document.getElementById('methodologyLanguage').focus();}});
  document.getElementById('methodologyTheme').addEventListener('change',e=>{if(['dark','light'].includes(e.target.value)){theme=e.target.value;applyTheme();updateURL();}});
 }
 render();
})();

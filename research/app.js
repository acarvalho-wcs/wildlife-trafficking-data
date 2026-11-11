const TEXT={pt:{repository:'Repositório científico',collection:'Artigos científicos',dashboard:'Dashboard de apreensões ↗',reportages:'Reportagens sobre tráfico de fauna ↗',program:'Programa de Inteligência para Conservação',edition:'Atualizado em 19 set. 2026 · Seleção aberta a novas referências.',eyebrow:'ACERVO CIENTÍFICO',title:'Tráfico de animais',intro:'Artigos científicos para consulta, pesquisa e conservação.',papers:'artigos no acervo',period:'período das publicações',verified:'verificado em todas as referências',search:'Buscar no acervo',theme:'Tema',region:'Abrangência',clear:'Limpar',placeholder:'Título, autor, DOI ou palavra-chave',all:'Todos',online:'Comércio online',impacts:'Impactos e conservação',networks:'Redes e crime scripts',governance:'Governança',global:'Global / internacional',brasil:'Brasil',illegal:'Tráfico / ilegalidades',broader:'Comércio de fauna · contexto',source:'Consultar fonte ↗',count:'artigos exibidos',empty:'Nenhum artigo encontrado. Tente outro termo ou limpe os filtros.',method:'Seleção exploratória, não exaustiva. Metadados conferidos em páginas de periódicos e repositórios institucionais até 19/09/2026. Descrições editoriais baseadas nos resumos; títulos e nomes de autores preservados no original. O acesso ao texto completo depende da fonte.',grow:'O acervo pode ser ampliado em novas rodadas de pesquisa e com referências sugeridas.'},en:{repository:'Research repository',collection:'Scientific articles',dashboard:'Seizure dashboard ↗',reportages:'Wildlife trafficking reporting ↗',program:'Conservation Intelligence Program',edition:'Updated 19 Sep 2026 · Open to further references.',eyebrow:'RESEARCH COLLECTION',title:'Wildlife trafficking',intro:'Scientific articles for reference, research and conservation.',papers:'articles in the collection',period:'publication range',verified:'verified for every reference',search:'Search the collection',theme:'Topic',region:'Coverage',clear:'Clear',placeholder:'Title, author, DOI or keyword',all:'All',online:'Online trade',impacts:'Impacts and conservation',networks:'Networks and crime scripts',governance:'Governance',global:'Global / international',brasil:'Brazil',illegal:'Trafficking / illegalities',broader:'Wildlife trade · context',source:'View source ↗',count:'articles shown',empty:'No articles found. Try another term or clear the filters.',method:'Exploratory, non-exhaustive selection. Metadata checked against journal pages and institutional repositories through 19 September 2026. Editorial descriptions based on abstracts; titles and author names retained in their original form. Full-text access depends on the source.',grow:'The collection can grow through further research rounds and suggested references.'},es:{repository:'Repositorio científico',collection:'Artículos científicos',dashboard:'Panel de incautaciones ↗',reportages:'Reportajes sobre tráfico de fauna ↗',program:'Programa de Inteligencia para la Conservación',edition:'Actualizado el 19 sep. 2026 · Abierta a nuevas referencias.',eyebrow:'ACERVO CIENTÍFICO',title:'Tráfico de animales',intro:'Artículos científicos para consulta, investigación y conservación.',papers:'artículos en el acervo',period:'período de publicaciones',verified:'verificado en todas las referencias',search:'Buscar en el acervo',theme:'Tema',region:'Cobertura',clear:'Limpiar',placeholder:'Título, autor, DOI o palabra clave',all:'Todos',online:'Comercio en línea',impacts:'Impactos y conservación',networks:'Redes y crime scripts',governance:'Gobernanza',global:'Global / internacional',brasil:'Brasil',illegal:'Tráfico / irregularidades',broader:'Comercio de fauna · contexto',source:'Consultar fuente ↗',count:'artículos mostrados',empty:'No se encontraron artículos. Pruebe otro término o limpie los filtros.',method:'Selección exploratoria, no exhaustiva. Metadatos verificados en páginas de revistas y repositorios institucionales hasta el 19/09/2026. Descripciones editoriales basadas en los resúmenes; títulos y nombres de autores conservados en su forma original. El acceso al texto completo depende de la fuente.',grow:'El acervo puede ampliarse con nuevas rondas de investigación y referencias sugeridas.'}};
const PAPERS_URL='https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-research/main/papers.json';
// Keep every canonical field intact; never merge or fall back to bundled records.
let papers=[];
let lang='pt';
let loadState='loading';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const localized=(paper,field)=>paper[`${field}_${lang}`]??'';
const authors=paper=>Array.isArray(paper.authors)?paper.authors.join(', '):paper.authors;
const doiUrl=paper=>'https://doi.org/'+String(paper.doi??'').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
const safeUrl=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}};
const LOAD_TEXT={
  pt:{loading:'Carregando artigos…',error:'Não foi possível carregar os artigos. Recarregue a página para tentar novamente.'},
  en:{loading:'Loading articles…',error:'Unable to load the articles. Reload the page to try again.'},
  es:{loading:'Cargando artículos…',error:'No se pudieron cargar los artículos. Recargue la página para volver a intentarlo.'}
};
function render(){
  const t=TEXT[lang];
  if(loadState!=='ready'){
    $('totalArticles').textContent='—';
    $('publicationRange').textContent='—';
    $('count').textContent=LOAD_TEXT[lang][loadState];
    $('articles').innerHTML=`<div class="empty">${LOAD_TEXT[lang][loadState]}</div>`;
    return;
  }
  const query=normalize($('query').value.trim());
  const rows=papers.filter(a=>(!$('topic').value||a.topic_code===$('topic').value)&&(!$('region').value||a.scope_code===$('region').value)&&normalize([a.title,authors(a),a.doi,a.journal,a.citation,localized(a,'description'),localized(a,'topic'),localized(a,'scope'),localized(a,'classification')].join(' ')).includes(query));
  $('totalArticles').textContent=papers.length;
  const years=papers.map(a=>Number(a.year)).filter(Number.isFinite);
  $('publicationRange').textContent=years.length?`${Math.min(...years)}–${Math.max(...years)}`:'—';
  $('count').textContent=`${rows.length} / ${papers.length} ${t.count}`;
  $('articles').innerHTML=rows.length?rows.map(a=>`<article><div class="year">${esc(a.year)}</div><div><div class="tags"><span class="tag">${esc(localized(a,'topic'))}</span><span class="tag">${esc(localized(a,'scope'))}</span><span class="tag scope">${esc(localized(a,'classification'))}</span></div><h3><a href="${esc(doiUrl(a))}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3><p class="authors">${esc(authors(a))}</p><div class="journal">${esc(a.journal)}</div><p class="summary">${esc(localized(a,'description'))}</p><div class="links"><a class="doi" href="${esc(doiUrl(a))}" target="_blank" rel="noopener noreferrer">DOI: ${esc(a.doi)}</a><a class="source" href="${esc(safeUrl(a.source_url))}" target="_blank" rel="noopener noreferrer">${t.source}</a></div></div></article>`).join(''):`<div class="empty">${t.empty}</div>`;
}
function translate(){
  const t=TEXT[lang];
  document.documentElement.lang=lang==='pt'?'pt-BR':lang;
  document.title=`${t.collection} | ${t.title}`;
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t[el.dataset.t]);
  $('query').placeholder=t.placeholder;
  for(const [id,field] of [['topic','topic'],['region','scope']]){
    const value=$(id).value;
    const options=new Map(papers.map(a=>[a[`${field}_code`],localized(a,field)]));
    $(id).innerHTML=`<option value="">${t.all}</option>`+Array.from(options,([code,label])=>`<option value="${esc(code)}">${esc(label)}</option>`).join('');
    $(id).value=options.has(value)?value:'';
  }
  render();
}
async function loadPapers(){
  try{
    const response=await fetch(`${PAPERS_URL}?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(!Array.isArray(data.papers))throw new Error('Invalid papers response');
    papers=data.papers;
    loadState='ready';
  }catch(error){
    loadState='error';
    console.error('Unable to load research collection:',error);
  }
  translate();
}
$('language').addEventListener('change',e=>{lang=e.target.value;translate()});
$('query').addEventListener('input',render);
$('topic').addEventListener('change',render);
$('region').addEventListener('change',render);
$('clear').addEventListener('click',()=>{$('query').value='';$('topic').value='';$('region').value='';render()});
translate();
loadPapers();

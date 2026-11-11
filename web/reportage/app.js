const translations={
pt:{collection:'Acervo de reportagens',reports:'Reportagens',dashboard:'Painel de notícias ↗',research:'Artigos científicos ↗',program:'Programa de Inteligência para Conservação',scope:'Critério editorial',criteria:'Reportagens que investigam redes, mercados, causas e impactos do tráfico. Notícias de apreensões isoladas não integram o acervo.',title:'Tráfico de fauna: reportagens',subtitle:'Jornalismo aprofundado sobre o comércio ilegal de animais silvestres.',search:'Buscar no acervo',placeholder:'Título, autor ou assunto',source:'Veículo',topic:'Tema',year:'Ano',clear:'Limpar',shown:'Reportagens exibidas',outlets:'Veículos no acervo',period:'Período do acervo',selection:'Seleção de reportagens',order:'Mais recentes primeiro',note:'Títulos e resumos editoriais em três idiomas. Os links levam aos textos originais dos respectivos veículos. Informações refletem a data de cada publicação.',updated:'Seleção revisada em',all:'Todos',read:'Ler reportagem ↗',mirror:'Republicação no Conexão Planeta',original:'Original em',languages:{pt:'português',en:'inglês',es:'espanhol',id:'indonésio'},empty:'Nenhuma reportagem encontrada. Tente outros termos ou limpe os filtros.',networks:'Redes e rotas',health:'Saúde da fauna',fraud:'Fraudes e lavagem',conservation:'Conservação',markets:'Mercados e demanda',digital:'Comércio digital',justice:'Justiça criminal',governance:'Governança e controle'},
en:{collection:'In-depth reporting',reports:'Reports',dashboard:'News dashboard ↗',research:'Scientific articles ↗',program:'Conservation Intelligence Program',scope:'Editorial criteria',criteria:'Reports investigating trafficking networks, markets, causes and impacts. Standalone seizure news is excluded from this collection.',title:'Wildlife trafficking: in-depth reports',subtitle:'In-depth journalism on the illegal wildlife trade.',search:'Search the collection',placeholder:'Title, author or subject',source:'Publisher',topic:'Topic',year:'Year',clear:'Clear',shown:'Reports shown',outlets:'Publishers in collection',period:'Collection period',selection:'Selected reports',order:'Newest first',note:'Titles and editorial summaries are available in three languages. Links open the publishers’ original articles. Information reflects each article’s publication date.',updated:'Selection reviewed on',all:'All',read:'Read report ↗',mirror:'Republished on Conexão Planeta',original:'Original in',languages:{pt:'Portuguese',en:'English',es:'Spanish',id:'Indonesian'},empty:'No reports found. Try different terms or clear the filters.',networks:'Networks and routes',health:'Wildlife health',fraud:'Fraud and laundering',conservation:'Conservation',markets:'Markets and demand',digital:'Online trade',justice:'Criminal justice',governance:'Governance and controls'},
es:{collection:'Colección de reportajes',reports:'Reportajes',dashboard:'Panel de noticias ↗',research:'Artículos científicos ↗',program:'Programa de Inteligencia para la Conservación',scope:'Criterio editorial',criteria:'Reportajes que investigan redes, mercados, causas e impactos del tráfico. Se excluyen las noticias de incautaciones aisladas.',title:'Tráfico de fauna: reportajes',subtitle:'Periodismo en profundidad sobre el comercio ilegal de fauna silvestre.',search:'Buscar en la colección',placeholder:'Título, autor o tema',source:'Medio',topic:'Tema',year:'Año',clear:'Limpiar',shown:'Reportajes mostrados',outlets:'Medios en la colección',period:'Período de la colección',selection:'Selección de reportajes',order:'Más recientes primero',note:'Títulos y resúmenes editoriales disponibles en tres idiomas. Los enlaces abren los textos originales de cada medio. La información refleja la fecha de publicación.',updated:'Selección revisada el',all:'Todos',read:'Leer reportaje ↗',mirror:'Republicación en Conexão Planeta',original:'Original en',languages:{pt:'portugués',en:'inglés',es:'español',id:'indonesio'},empty:'No se encontraron reportajes. Prueba otros términos o limpia los filtros.',networks:'Redes y rutas',health:'Salud de la fauna',fraud:'Fraudes y blanqueo',conservation:'Conservación',markets:'Mercados y demanda',digital:'Comercio digital',justice:'Justicia penal',governance:'Gobernanza y controles'}};
const NEWS_URL = 'https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-news/main/news.json';
const localeByLanguage = {pt:'pt-BR', en:'en-GB', es:'es-ES'};
const htmlLanguage = {pt:'pt-BR', en:'en', es:'es'};
const loadMessages = {
  pt:{loading:'Carregando reportagens…', error:'Não foi possível carregar o acervo agora. Tente novamente em instantes.'},
  en:{loading:'Loading reports…', error:'The collection could not be loaded right now. Please try again shortly.'},
  es:{loading:'Cargando reportajes…', error:'No fue posible cargar la colección ahora. Inténtalo de nuevo en unos instantes.'}
};

let language = 'pt';
let articles = [];
let lastSuccessfulArticles = [];
let feedUpdatedAt = '';
let isLoading = true;
let loadFailed = false;

const $ = id => document.getElementById(id);
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const safeUrl = value => {
  try {
    const url = new URL(value);
    return ['http:','https:'].includes(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
};
const localizedField = (article, field) => article[`${field}_${language}`] || article[`${field}_pt`] || article[`${field}_en`] || article[`${field}_es`] || '';
const authors = article => Array.isArray(article.authors) ? article.authors.join(', ') : String(article.authors || '');
const originalLanguage = (article, t) => t.languages[article.original_language] || String(article.original_language || '').toUpperCase();

function filtered(){
  const query = normalize($('query').value);
  return articles.filter(article => {
    const matchesSource = !$('source').value || article.outlet === $('source').value;
    const matchesTopic = !$('topic').value || article.topic_code === $('topic').value;
    const matchesYear = !$('year').value || String(article.publication_date || '').startsWith($('year').value);
    const searchable = [
      article.original_title,
      article.title_pt,
      article.title_en,
      article.title_es,
      article.description_pt,
      article.description_en,
      article.description_es,
      article.topic_pt,
      article.topic_en,
      article.topic_es,
      article.topic_code,
      article.outlet,
      authors(article)
    ].join(' ');
    return matchesSource && matchesTopic && matchesYear && normalize(searchable).includes(query);
  }).sort((a,b)=>String(b.publication_date || '').localeCompare(String(a.publication_date || '')));
}

function render(){
  const t = translations[language];
  const locale = localeByLanguage[language];

  if (isLoading && !articles.length) {
    $('count').textContent = '—';
    $('list').innerHTML = `<div class="empty">${loadMessages[language].loading}</div>`;
    return;
  }

  if (loadFailed && !articles.length) {
    $('count').textContent = '0';
    $('list').innerHTML = `<div class="empty">${loadMessages[language].error}</div>`;
    return;
  }

  const rows = filtered();
  $('count').textContent = rows.length;
  $('list').innerHTML = rows.length ? rows.map(article => {
    const articleUrl = safeUrl(article.source_url);
    const date = String(article.publication_date || '');
    const formattedDate = new Date(`${date}T12:00:00Z`).toLocaleDateString(locale,{day:'2-digit',month:'short',year:'numeric'});
    const optionalMirror = article.mirror_url || article.mirror;
    return `<article><div class="meta"><b>${esc(article.outlet)}</b><time datetime="${esc(date)}">${esc(formattedDate)}</time><span class="badge">${esc(localizedField(article,'topic'))}</span></div><div class="content"><h3 lang="${htmlLanguage[language]}"><a href="${esc(articleUrl)}" target="_blank" rel="noopener noreferrer">${esc(localizedField(article,'title'))}</a></h3><div class="author">${esc(authors(article))} · ${t.original} ${esc(originalLanguage(article,t))}</div><p>${esc(localizedField(article,'description'))}</p><div class="actions"><a class="read" href="${esc(articleUrl)}" target="_blank" rel="noopener noreferrer">${t.read}</a>${optionalMirror?`<a class="mirror" href="${esc(safeUrl(optionalMirror))}" target="_blank" rel="noopener noreferrer">${t.mirror}</a>`:''}</div></div></article>`;
  }).join('') : `<div class="empty">${t.empty}</div>`;
}

function localize(){
  const t = translations[language];
  const locale = localeByLanguage[language];
  const years = articles.map(article=>Number(String(article.publication_date || '').slice(0,4))).filter(Number.isFinite);
  const sources = [...new Set(articles.map(article=>article.outlet).filter(Boolean))];
  const topics = new Map();
  articles.forEach(article=>{
    if (article.topic_code && !topics.has(article.topic_code)) topics.set(article.topic_code, localizedField(article,'topic'));
  });

  document.documentElement.lang = htmlLanguage[language];
  document.title = t.title;
  document.querySelector('meta[name="description"]').content = t.subtitle;
  document.querySelectorAll('[data-t]').forEach(element=>element.textContent=t[element.dataset.t]);
  $('query').placeholder = t.placeholder;
  document.querySelector('.filters').setAttribute('aria-label',t.search);

  const options = {
    source:sources.map(value=>[value,value]),
    topic:[...topics.entries()],
    year:[...new Set(years)].sort((a,b)=>b-a).map(value=>[String(value),String(value)])
  };
  Object.entries(options).forEach(([id,values])=>{
    const previous = $(id).value;
    $(id).innerHTML = `<option value="">${t.all}</option>` + values.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');
    $(id).value = values.some(([value])=>String(value)===previous) ? previous : '';
  });

  $('outlet-count').textContent = sources.length || '—';
  $('period-value').textContent = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '—';
  if (feedUpdatedAt) {
    const updatedDate = new Date(feedUpdatedAt);
    if (!Number.isNaN(updatedDate.getTime())) {
      $('updated').dateTime = updatedDate.toISOString();
      $('updated').textContent = updatedDate.toLocaleDateString(locale);
    }
  }
  render();
}

async function loadArticles(){
  if (!articles.length) {
    isLoading = true;
    loadFailed = false;
    render();
  }
  try {
    const response = await fetch(NEWS_URL,{cache:'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.news)) throw new Error('Invalid news feed');
    const loaded = data.news.slice().sort((a,b)=>String(b.publication_date || '').localeCompare(String(a.publication_date || '')));
    articles = loaded;
    lastSuccessfulArticles = loaded;
    feedUpdatedAt = data.updated_at || feedUpdatedAt;
    loadFailed = false;
  } catch (error) {
    articles = lastSuccessfulArticles;
    loadFailed = true;
  } finally {
    isLoading = false;
    localize();
  }
}

$('language').addEventListener('change',event=>{language=event.target.value;localize()});
['source','topic','year'].forEach(id=>$(id).addEventListener('change',render));
$('query').addEventListener('input',render);
$('clear').addEventListener('click',()=>{['source','topic','year','query'].forEach(id=>$(id).value='');render()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadArticles()});

localize();
loadArticles();

/* Article media enriches the existing case IDs; it never creates case records. */
window.CaseMedia=(()=>{
 const labels={
  pt:{image:'Imagem publicada pela fonte',open:'Abrir imagem na notícia',credit:'Crédito / fonte',missing:'Imagem da notícia ainda não disponível nesta ficha.',failed:'A fonte não disponibilizou a imagem. Consulte a notícia original.',source:'Ver notícia original',illustrative:'Imagem ilustrativa da publicação; não documenta esta apreensão.'},
  en:{image:'Image published by the source',open:'Open image in the news report',credit:'Credit / source',missing:'The news image is not yet available in this record.',failed:'The source image could not be loaded. See the original news report.',source:'View original news report',illustrative:'Illustrative publication image; it does not document this seizure.'},
  es:{image:'Imagen publicada por la fuente',open:'Abrir imagen en la noticia',credit:'Crédito / fuente',missing:'La imagen de la noticia aún no está disponible en esta ficha.',failed:'No se pudo cargar la imagen de la fuente. Consulte la noticia original.',source:'Ver noticia original',illustrative:'Imagen ilustrativa de la publicación; no documenta esta incautación.'}
 };
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
 function images(e){
  const raw=Array.isArray(e.images)?e.images:(e.legacy_site_id&&window.CASE_MEDIA?.[e.legacy_site_id]?.images)||Object.values(window.CASE_MEDIA||{}).flatMap(entry=>entry.images||[]).filter(image=>image.source_url===e.source_url);
  return raw.filter(m=>m.verified===true&&safeUrl(m.url)&&safeUrl(m.source_url)&&['occurrence','article_photo','illustrative','roundup'].includes(m.kind));
 }
 function html(e,lang='pt'){
  const t=labels[lang]||labels.pt,media=images(e),source=safeUrl(e.url);
  if(!media.length)return '<div class="case-media-empty">'+esc(t.missing)+(source?' <a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">'+esc(t.source)+' ↗</a>':'')+'</div>';
  return '<div class="case-media" aria-label="'+esc(t.image)+'">'+media.map(m=>{
   const credit=m.credit||e.source,caption=m['caption_'+lang]||'',alt=caption||t.image+': '+(e.title||e.city);
   return '<figure class="case-photo"><a class="case-photo-link" href="'+esc(safeUrl(m.source_url))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(t.open)+'"><img data-source-photo src="'+esc(safeUrl(m.url))+'" alt="'+esc(window.ScientificText.plain(alt))+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="case-photo-failure">'+esc(t.failed)+'</span></a><figcaption>'+esc(t.credit)+': '+window.ScientificText.html(credit)+(caption?'<br>'+window.ScientificText.html(caption):'')+(m.kind==='illustrative'?'<br>'+esc(t.illustrative):'')+' · <a href="'+esc(safeUrl(m.source_url))+'" target="_blank" rel="noopener noreferrer">'+esc(t.source)+' ↗</a></figcaption></figure>';
  }).join('')+'</div>';
 }
 // Capture handles lazy images inserted by Leaflet, the globe drawer and filtered lists.
 document.addEventListener('error',event=>{
  const img=event.target;
  if(img?.hasAttribute?.('data-source-photo')){img.hidden=true;img.closest('.case-photo')?.classList.add('unavailable');}
 },true);
 return {html,images,safeUrl};
})();

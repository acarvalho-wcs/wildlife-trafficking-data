/* Institutional text only; shared by the existing notice and sidebar. */
(function () {
 'use strict';
 const labels={
  "pt": {
    "testTitle": "Plataforma em fase de testes",
    "testText": "O Observatório Global de Tráfico de Animais está em fase de testes, com lançamento oficial previsto para breve. A plataforma já permite consultar e explorar dados, utilizar o dashboard interativo, gerar relatórios personalizados e exportar resultados de buscas. Informações e funcionalidades poderão ser atualizadas e aprimoradas.",
    "citeTitle": "Utilizou o Observatório em seu trabalho? Cite-nos!",
    "citeText": "Ao utilizar dados, mapas ou análises da plataforma em trabalhos acadêmicos, relatórios, apresentações ou outras publicações, utilize a referência abaixo.",
    "sidebarTitle": "Como citar o Observatório",
    "sidebarText": "Ao utilizar dados, mapas, ferramentas ou análises do Observatório em seus trabalhos, cite a plataforma utilizando a referência abaixo.",
    "important": "Importante:",
    "documentNote": "Relatórios e demais documentos possuem títulos e DOIs próprios e devem ser citados individualmente. A referência abaixo corresponde exclusivamente à plataforma.",
    "copy": "Copiar citação",
    "copied": "Citação copiada",
    "copyError": "Não foi possível copiar. Selecione a referência para copiá-la."
  },
  "en": {
    "testTitle": "Platform in Testing Phase",
    "testText": "The Illegal Wildlife Trafficking Global Observatory is currently in its testing phase, with its official launch expected soon. Users can already explore data, access the interactive dashboard, generate customized reports, and export search results. Information and features may be updated and refined.",
    "citeTitle": "Using the Observatory in your work? Please cite us!",
    "citeText": "When using data, maps, or analyses from the platform in academic work, reports, presentations, or other publications, please use the citation below.",
    "sidebarTitle": "How to Cite the Observatory",
    "sidebarText": "When using data, maps, tools, or analyses from the Observatory in your work, please cite the platform using the reference below.",
    "important": "Important:",
    "documentNote": "Reports and other documents have their own titles and DOIs and must be cited individually. The reference below applies exclusively to the platform.",
    "copy": "Copy citation",
    "copied": "Citation copied",
    "copyError": "Could not copy. Select the reference to copy it."
  },
  "es": {
    "testTitle": "Plataforma en fase de pruebas",
    "testText": "El Observatorio Global del Tráfico de Fauna Silvestre se encuentra en fase de pruebas y su lanzamiento oficial está previsto próximamente. Los usuarios ya pueden explorar datos, utilizar el panel interactivo, generar informes personalizados y exportar resultados de búsquedas. La información y las funcionalidades podrán actualizarse y mejorarse.",
    "citeTitle": "¿Utiliza el Observatorio en su trabajo? ¡Cítenos!",
    "citeText": "Al utilizar datos, mapas o análisis de la plataforma en trabajos académicos, informes, presentaciones u otras publicaciones, utilice la siguiente referencia.",
    "sidebarTitle": "Cómo citar el Observatorio",
    "sidebarText": "Al utilizar datos, mapas, herramientas o análisis del Observatorio en sus trabajos, cite la plataforma utilizando la siguiente referencia.",
    "important": "Importante:",
    "documentNote": "Los informes y demás documentos tienen títulos y DOI propios y deben citarse individualmente. La referencia siguiente corresponde exclusivamente a la plataforma.",
    "copy": "Copiar cita",
    "copied": "Cita copiada",
    "copyError": "No se pudo copiar. Seleccione la referencia para copiarla."
  }
};
 const doi='https://doi.org/10.5281/zenodo.23282620';
 const reference='Wildlife Conservation Society Brasil. (2026). Illegal Wildlife Trafficking Global Observatory. WCS Brasil. '+doi;
 function markup(lang='pt',popup=false) {
  const t=labels[lang]||labels.pt;
  return '<section class="observatory-citation" lang="'+(labels[lang]?lang:'pt')+'">'+
   (popup?'<h3>'+t.testTitle+'</h3><p>'+t.testText+'</p><h3>'+t.citeTitle+'</h3><p>'+t.citeText+'</p>':'<h3>'+t.sidebarTitle+'</h3><p>'+t.sidebarText+'</p><p><strong>'+t.important+'</strong> '+t.documentNote+'</p>')+
   '<p class="observatory-reference">Wildlife Conservation Society Brasil. (2026). <em>Illegal Wildlife Trafficking Global Observatory</em>. WCS Brasil. <a href="'+doi+'" target="_blank" rel="noopener noreferrer">'+doi+'</a></p>'+
   '<button type="button" class="observatory-copy" data-copy-citation>'+t.copy+'</button><span class="observatory-copy-status" role="status" aria-live="polite"></span></section>';
 }
 async function copyReference() {
  try {if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(reference);return;}}catch{/* Fall back on browsers that deny clipboard permission. */}
  const focus=document.activeElement,selection=document.getSelection?.();
  const ranges=selection?Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()):[];
  const input=document.createElement('textarea');input.value=reference;input.setAttribute('readonly','');input.style.cssText='position:fixed;left:-9999px;top:0;';
  // A fallback inside the open dialog stays outside the browser's inert background.
  const host=document.querySelector('.reports-modal[open]')||document.body;host.appendChild(input);
  let copied=false;
  try {input.select();copied=document.execCommand('copy');}finally{input.remove();focus?.focus({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(range=>selection.addRange(range));}}
  if(!copied)throw Error('Clipboard unavailable');
 }
 function bind(host,lang='pt') {
  const t=labels[lang]||labels.pt;
  host.querySelectorAll('[data-copy-citation]').forEach(button=>button.addEventListener('click',async()=>{
   const status=button.parentElement.querySelector('.observatory-copy-status');
   try {await copyReference();status.textContent=t.copied;}catch{status.textContent=t.copyError;}
  }));
 }
 function render(lang='pt') {
  ['sidebarCitation','mobileCitation'].forEach(id=>{const host=document.getElementById(id);if(host){host.innerHTML=markup(lang);bind(host,lang);}});
 }
 window.ObservatoryCitation={markup,bind,render};
})();

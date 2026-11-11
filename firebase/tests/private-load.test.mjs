import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
for (const [browserName,engine] of [["chromium",chromium],["webkit",webkit]]) {
const browser=await engine.launch({headless:true});
try{
 const page=await browser.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
 await page.goto("http://127.0.0.1:8751/secure.html",{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>window.__nimfAppStarted===true,{timeout:22000});
 const obs=page.locator("a.secure-brand");
 assert.equal(await obs.getAttribute("href"),"https://wildlife-trafficking-dashboard.wcs-associa-6434.chatgpt.site/");
 assert.equal(await obs.getAttribute("target"),"_blank");
 const logo=obs.locator("img.secure-observatory-logo");
 assert.ok((await obs.getAttribute("aria-label")).includes("Observatório Global de Tráfico de Animais"));
 assert.equal(await logo.getAttribute("src"),"./assets/Logo_observat.png");
 const portal=page.locator("#back-public");
 assert.equal(await portal.getAttribute("href"),"https://wildlife-trafficking-dashboard.wcs-associa-6434.chatgpt.site/");
 assert.equal((await portal.textContent()).trim(),"Retorne ao Observatório Global de Tráfico de Animais");
 assert.equal(await page.title(),"IWT Global Observatory | Área restrita");
 for(const [code,label,tab] of [
  ["en","Return to the Illegal Wildlife Trafficking Global Observatory","IWT Global Observatory | Restricted area"],
  ["es","Regrese al Observatorio Global de Tráfico de Animales","IWT Global Observatory | Área restringida"],
  ["pt","Retorne ao Observatório Global de Tráfico de Animais","IWT Global Observatory | Área restrita"]
 ]){
  await page.locator("#secure-language").selectOption(code);
  assert.equal((await portal.textContent()).trim(),label);
  assert.equal(await page.title(),tab);
 }
 assert.ok(!((await portal.getAttribute("href"))||"").endsWith("/index.html"),"Back navigation must target the actual Observatory");

 await logo.evaluate(async img=>{if(!img.complete)await new Promise(resolve=>{img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true})});});
 assert.ok(await logo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0),"Uploaded animal logo must load as actual image");
 assert.equal((await page.locator("#private-kicker").textContent()).trim(),"PAINEL RESTRITO - APENAS USUÁRIOS AUTORIZADOS");
 const darkBacking=await logo.evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.notEqual(darkBacking,"rgba(0, 0, 0, 0)","Logo needs pale backing in dark theme");
 await page.locator("#secure-theme").click();
 const lightBacking=await logo.evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.equal(lightBacking,"rgba(0, 0, 0, 0)","Logo backing should disappear in light theme");
 await page.locator("#secure-theme").click();
 console.log("PASS: "+browserName+" animal Observatory logo loads and restricted kicker is corrected");
 const shown=await page.locator("#auth-panel").isVisible()||await page.locator("#config-panel").isVisible();
 assert.ok(shown,"The page must never display only the empty sidebar");
 if(!await page.locator("#auth-panel").isVisible())throw Error("Login unavailable. Console errors: "+errors.slice(0,4).join(" | "));
 assert.equal(await page.locator("#auth-email").isVisible(),true);

 console.log("PASS: "+browserName+" private login loads with no credentials or map dependency");
 // Use consistent image tiles so tests validate geographic positioning, not external tile uptime.
 await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({
  status:200,contentType:"image/svg+xml",
  body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#629fc4"/><path d="M0 140L90 90L170 105L256 50L256 256L0 256Z" fill="#dce4c8"/></svg>'
 }));
 // This fixture renders the actual explorer in a browser without Firebase credentials.
 await page.goto("http://127.0.0.1:8751/tests/map-explorer.html",{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>window.__demoReady===true,{timeout:15000});
 assert.ok(await page.locator(".nimf-raster-layer").isVisible(),"Raster fallback must render when MapLibre is absent");
 assert.ok(await page.locator("canvas.nimf-raster-tiles").count()===1,"Raster tiles must compose into a single canvas");
 await page.waitForFunction(()=>Number(document.getElementById("explorer-map").dataset.loadedTiles)>0,{timeout:14000});
 const camera=await page.locator("#explorer-map").evaluate(el=>({lat:Number(el.dataset.centerLatitude),lon:Number(el.dataset.centerLongitude),zoom:Number(el.dataset.zoom),count:Number(el.dataset.mappedCount),tile:el.dataset.centerTile}));
 console.log("MAP_CAMERA: "+JSON.stringify(camera));
 assert.ok(Math.abs(camera.lat+3.119)<0.005 && Math.abs(camera.lon+60.0217)<0.005,"Map must center on Manaus, not another continent");
 assert.equal(camera.zoom,7,"Single municipality must be shown at regional zoom");
 assert.equal(camera.count,1);
 assert.equal(camera.tile,"7/42/65","Web Mercator tile for Manaus must be correct");

 assert.equal(await page.locator(".nimf-raster-pin").count(),1,"Georeferenced synthetic record must have a map marker");
 await page.locator(".nimf-raster-pin").first().click();
 assert.equal(await page.locator("#explorer-map-card").isVisible(),true,"Clicking a map marker opens a card over the map");
 assert.equal(await page.locator("#explorer-map-card").getAttribute("data-record-id"),"synthetic-demo");
 assert.equal(await page.locator("#explorer-map-card .scientific-name").first().evaluate(el=>getComputedStyle(el).fontStyle),"italic");
 assert.ok((await page.locator("#explorer-map-card").textContent()).includes("Amazonas"));
 await page.locator(".explorer-map-card-close").click();
 assert.equal(await page.locator("#explorer-map-card").isHidden(),true,"X closes the record card");

 assert.equal(await page.locator(".nimf-raster-pin").first().evaluate(el=>Math.round(parseFloat(getComputedStyle(el).width))),15,"Raster markers should be 30 percent smaller than previous 21px");
 await page.locator("#species-trigger").click();
 const italic=page.locator("#species-menu .scientific-name").first();
 assert.equal(await italic.isVisible(),true,"Species choice must be visible and italic");
 assert.equal(await italic.evaluate(el=>getComputedStyle(el).fontStyle),"italic");
 await page.locator("#species-menu button").filter({hasText:"Testudo ficticia"}).click();
 assert.equal(await page.locator("#explorer-species").inputValue(),"Testudo ficticia");
 assert.equal(await page.locator("#explorer-cards .scientific-name").count(),1);
 assert.equal(await page.locator("#explorer-count").textContent(),"1");

 // Locale switch updates the entire map explorer, record title, status, precision, and source context.
 for(const [lang,headline,status,cat] of [["en","Wildlife markets: map and filters","Under review","Commercial listing"],["es","Mercados de fauna: mapa y filtros","En revisión","Anuncio comercial"],["pt","Mercados de fauna: mapa e filtros","Em revisão","Anúncio comercial"]]){
  await page.evaluate(l=>window.__demoSetLanguage(l),lang);
  assert.equal((await page.locator("#explorer-title").textContent()).trim(),headline);
  assert.ok((await page.locator("#explorer-cards .explorer-card small").textContent()).includes(status));
  assert.equal(await page.evaluate(l=>window.__demoLocalized("category",l),lang),cat);
  assert.equal(await page.evaluate(l=>window.__demoLocalized("status",l),lang),status);
  assert.ok(Math.abs(Number(await page.locator("#explorer-map").getAttribute("data-center-latitude"))+3.119)<0.005);
 }

 console.log("PASS: "+browserName+" OSM composite map and PT EN ES filters");
 // A published point in each new layer is map-visible only when its layer is enabled.
 await page.evaluate(()=>{
  document.getElementById("explorer-species").value="";
  document.getElementById("explorer-species").dispatchEvent(new Event("change"));
  window.__demoSetPoints([
   {id:"point-platform",layer_type:"platform",title:"Reviewed internet platform",municipality:"São Paulo",state:"SP",latitude:-23.55,longitude:-46.63,location_precision:"municipality",published:true,evidence_status:"corroborated"},
   {id:"point-fair",layer_type:"fair",title:"Reviewed public market",municipality:"Belém",state:"PA",latitude:-1.46,longitude:-48.5,location_precision:"municipality",published:true,evidence_status:"corroborated"},
   {id:"point-physical",layer_type:"physical_market",title:"Reviewed approximate trading area",municipality:"Manaus",state:"AM",latitude:-3.119,longitude:-60.02,location_precision:"municipality",published:true,evidence_status:"corroborated"},
   {id:"point-draft",layer_type:"physical_market",title:"Unpublished investigation",municipality:"Belém",state:"PA",latitude:-1.46,longitude:-48.5,location_precision:"municipality",published:false,evidence_status:"reported"}
  ]);
 });
 assert.equal(await page.locator("#explorer-count").textContent(),"4");
 assert.equal(await page.locator("#explorer-layers input").count(),4);
 const countFor=async category=>Number(await page.locator('[data-layer-count="'+category+'"]').textContent());
 assert.equal(await countFor("advertisement"),1);
 assert.equal(await countFor("platform"),1);
 assert.equal(await countFor("fair"),1);
 assert.equal(await countFor("physical_market"),1);
 assert.equal(await page.locator(".nimf-raster-pin").count(),4,"All four categories should render four map points");
 // Filters must automatically reframe the live map to matching coordinates.
 await page.locator("#explorer-search").fill("Reviewed public market");
 assert.equal(await page.locator("#explorer-count").textContent(),"1");
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"1");
 let filteredCamera=await page.locator("#explorer-map").evaluate(el=>[Number(el.dataset.centerLatitude),Number(el.dataset.centerLongitude),Number(el.dataset.zoom)]);
 assert.ok(Math.abs(filteredCamera[0]+1.46)<0.01&&Math.abs(filteredCamera[1]+48.5)<0.01&&filteredCamera[2]>=7,
  "Typing in free search must automatically pan/zoom to Belém");
 await page.locator("#explorer-search").fill("");
 await page.locator("#explorer-state").selectOption("SP");
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"1");
 filteredCamera=await page.locator("#explorer-map").evaluate(el=>[Number(el.dataset.centerLatitude),Number(el.dataset.centerLongitude),Number(el.dataset.zoom)]);
 assert.ok(Math.abs(filteredCamera[0]+23.55)<0.01&&Math.abs(filteredCamera[1]+46.63)<0.01,
  "Changing a geographic facet must automatically pan to São Paulo");
 await page.locator("#explorer-state").selectOption("");
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"4");
 console.log("PASS: "+browserName+" search and geographic filters automatically pan and zoom without map interaction");

 await page.locator("#explorer-cards .explorer-card").filter({hasText:"Reviewed internet platform"}).click();
 assert.equal(await page.locator("#explorer-map-card").getAttribute("data-record-id"),"point-point-platform");
 const recentered=await page.locator("#explorer-map").evaluate(el=>({
  lat:Number(el.dataset.centerLatitude),lon:Number(el.dataset.centerLongitude),zoom:Number(el.dataset.zoom)
 }));
 assert.ok(Math.abs(recentered.lat+23.55)<0.01&&Math.abs(recentered.lon+46.63)<0.01,"Clicking the right-side result must pan to São Paulo");
 assert.ok(recentered.zoom>=7,"Clicking the right-side result must zoom toward municipality");
 assert.ok((await page.locator("#explorer-map-card").textContent()).includes("Reviewed internet platform"));

 await page.locator("#layers-toggle").click();
 await page.locator("#explorer-layers").waitFor({state:"visible"});
 await page.locator('#explorer-layers input[value="advertisement"]').uncheck();
 assert.equal(await page.locator(".nimf-raster-pin[data-layer='advertisement']").count(),0,"Hidden category must remove its map pin");
 assert.equal(await page.locator(".nimf-raster-pin").count(),3,"Map markers refresh instantly for layer changes");
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"3");
 assert.equal(await countFor("advertisement"),1,"Badge shows available georeferenced records even when hidden");
 await page.locator('#explorer-layers input[value="advertisement"]').check();
 assert.equal(await page.locator(".nimf-raster-pin").count(),4);

 assert.equal(await page.locator("#layers-toggle").getAttribute("aria-expanded"),"true");
 assert.equal(await page.locator("#explorer-layers").getAttribute("aria-hidden"),"false");
 assert.ok(await page.locator("#explorer-layers").isVisible());
 assert.ok(await page.locator("#explorer-layers").isVisible(),"The color-coded category drawer should overlay the map");
 assert.equal(await page.locator("#layers-toggle").getAttribute("aria-expanded"),"true");
 assert.equal(await page.locator("#explorer-layers .layer-swatch").count(),4);
 const colors=await page.locator("#explorer-layers .layer-swatch").evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundColor));
 assert.equal(new Set(colors).size,4,"Four distinct category colors");
 await page.locator('#explorer-layers input[value="physical_market"]').uncheck();
 assert.equal(await page.locator("#explorer-count").textContent(),"3");
 await page.locator('#explorer-layers input[value="physical_market"]').check();
 assert.equal(await page.locator("#explorer-count").textContent(),"4");
 await page.locator("#layers-close").click();
 assert.equal(await page.locator("#explorer-layers").getAttribute("aria-hidden"),"true");
 assert.equal(await page.locator("#layers-toggle").getAttribute("aria-expanded"),"false");
 await page.locator("#explorer-fullscreen").click();
 assert.ok(await page.locator(".explorer-map-wrap").evaluate(el=>el.classList.contains("is-fullscreen")));
 assert.equal(await page.locator("#explorer-fullscreen").getAttribute("aria-pressed"),"true");
 await page.locator("#layers-toggle").click();
 assert.equal(await page.locator("#explorer-layers").getAttribute("aria-hidden"),"false","Layers remain available in fullscreen");
 await page.locator("#layers-close").click();
 assert.equal(await page.locator("#explorer-layers").getAttribute("aria-hidden"),"true","X closes the layer drawer without leaving fullscreen");
 assert.ok(await page.locator(".explorer-map-wrap").evaluate(el=>el.classList.contains("is-fullscreen")));
 await page.keyboard.press("Escape");
 assert.ok(!await page.locator(".explorer-map-wrap").evaluate(el=>el.classList.contains("is-fullscreen")));
 await page.evaluate(()=>window.__demoSetLanguage("en"));
 assert.ok((await page.locator('[data-layer-title="physical_market"]').textContent()).includes("Physical"));
 await page.evaluate(()=>window.__demoSetLanguage("es"));
 assert.ok((await page.locator("#explorer-fullscreen").textContent()).includes("Pantalla"));
 console.log("PASS: "+browserName+" four thematic map layers and fullscreen/escape");
 // A canonical online store is a PLATFORM layer and points to its public city
 // centre; the international practitioner directory has no invented marker.
 await page.evaluate(()=>window.__demoSetPoints([]));
 await page.evaluate(()=>{
   window.__demoInit([
    {id:"myants-de",record_kind:"platform",title:"MyAnts.de",source:"MyAnts.de",
     source_url:"https://www.myants.de/",status:"Em revisão",category:"Plataforma",
     scientific_name:null,platform_kind:"online_store",municipality:"Weiden in der Oberpfalz",
     state:"Bayern",country:"DE",latitude:49.67527,longitude:12.16321,location_precision:"municipality"},
    {id:"iakp",record_kind:"platform",title:"IAKP",source:"IAKP",
     source_url:"https://iakp.org/search/",status:"Em revisão",category:"Plataforma",
     scientific_name:null,platform_kind:"practitioner_directory",country:null},
    {id:"ant-listing",record_kind:"listing",title:"Colônia anunciada de Atta laevigata",
     scientific_name:"Atta laevigata",status:"Em revisão",source:"MyAnts.de"}
   ],"pt");
 });
 assert.equal(await page.locator("#explorer-count").textContent(),"3");
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"1");
 assert.equal(await page.locator("#explorer-unmapped-count").textContent().then(s=>s.trim()),"2 sem localização mapeável");
 await page.locator("#explorer-cards .explorer-card").filter({hasText:"Weiden in der Oberpfalz"}).click();
 assert.equal(await page.locator("#explorer-map-card").getAttribute("data-record-id"),"myants-de");
 const germany=await page.locator("#explorer-map").evaluate(el=>[Number(el.dataset.centerLatitude),Number(el.dataset.centerLongitude)]);
 assert.ok(Math.abs(germany[0]-49.67527)<0.01&&Math.abs(germany[1]-12.16321)<0.01,"MyAnts card should center its municipal German location");
 await page.locator("#explorer-cards .explorer-card").filter({hasText:"IAKP"}).click();
 assert.equal(await page.locator("#explorer-map-card").getAttribute("data-record-id"),"iakp");
 const unmapped=await page.locator("#explorer-map").evaluate(el=>[Number(el.dataset.centerLatitude),Number(el.dataset.centerLongitude)]);
 assert.deepEqual(unmapped,germany,"Unmapped worldwide directory must not invent a map location");
 assert.ok((await page.locator("#explorer-map-card").textContent()).includes("Sem coordenadas verificadas"));
 await page.evaluate(()=>window.__demoSetLanguage("en"));
 assert.ok((await page.locator("#explorer-map-card").textContent()).includes("No verified coordinates"));

 assert.equal(Number(await page.locator('[data-layer-count="platform"]').textContent()),1);
 assert.equal(Number(await page.locator('[data-layer-count="advertisement"]').textContent()),0);
 await page.locator("#layers-toggle").click();
 await page.locator("#explorer-layers").waitFor({state:"visible"});
 await page.locator('#explorer-layers input[value="platform"]').uncheck();
 assert.equal(await page.locator("#explorer-map").getAttribute("data-visible-marker-count"),"0");
 assert.equal(await page.locator("#explorer-count").textContent(),"1","Only the unlocated listing remains after hiding platforms");
 await page.locator('#explorer-layers input[value="platform"]').check();
 assert.equal(await page.locator("#explorer-count").textContent(),"3");
 await page.locator("#layers-close").click();
 await page.evaluate(()=>window.__demoSetLanguage("en"));
 assert.equal(await page.evaluate(()=>window.__demoLocalized("category","en")),"Commercial listing");
 console.log("PASS: "+browserName+" one approximate German store marker; global IAKP remains unmapped");


 // Test the actual intake form, with a browser-side stub for the Firebase import.
 await page.route("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js",route=>route.fulfill({
  status:200,contentType:"application/javascript",headers:{"access-control-allow-origin":"*"},
  body:"export const collection=()=>null,query=()=>null,where=()=>null,limit=()=>null,onSnapshot=()=>()=>{},addDoc=()=>null,doc=()=>null,serverTimestamp=()=>null,writeBatch=()=>null;"
 }));
 await page.goto("http://127.0.0.1:8751/tests/intake-languages.html",{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>window.__intakeTestReady===true,{timeout:15000});
 for(const [lang,title,button,placeholder] of [
  ["en","Investigation contributions","Submit for review","Scientific or common name"],
  ["es","Contribuciones para investigación","Enviar para evaluación","Nombre científico o común"],
  ["pt","Contribuições para investigação","Enviar para triagem","Nome científico ou comum"]
 ]){
  await page.evaluate(l=>window.__setIntakeLanguage(l),lang);
  assert.equal((await page.locator(".private-contributions .explorer-head h3").textContent()).trim(),title);
  assert.equal((await page.locator("#tip-submit").textContent()).trim(),button);
  assert.equal(await page.locator("#tip-species").getAttribute("placeholder"),placeholder);
  assert.equal(await page.locator("#tip-type option").count(),6);
 }
 console.log("PASS: "+browserName+" investigation intake changes fully across three languages");
 await page.evaluate(async()=>window.__openIntake({}, {uid:"rogue",email:"dcarvalhoaf@gmail.com"},true,"pt"));
 assert.equal(await page.locator("#admin-review").isHidden(),true,"A flagged external user must not see moderation controls");
 await page.evaluate(()=>window.__closeIntake());
 await page.evaluate(async()=>window.__openIntake({}, {uid:"admin",email:"acarvalho@wcs.org"},true,"pt"));
 assert.equal(await page.locator("#admin-review").isVisible(),true,"Institutional admin can see triage");
 await page.evaluate(()=>window.__closeIntake());
 await page.evaluate(async()=>window.__openIntake({}, {uid:"user",email:"dcarvalhoaf@gmail.com"},false,"pt"));
 assert.equal(await page.locator("#admin-review").isHidden(),true,"Normal contributor sees only their contributions");
 console.log("PASS: "+browserName+" moderation controls restricted to institutional administrator");



}finally{await browser.close();}
}

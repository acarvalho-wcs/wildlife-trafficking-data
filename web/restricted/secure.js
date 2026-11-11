import {appendScientific,appendScientificTerm} from "./scientific-format.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, reload } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, limit, query, where, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js?v=internal-storage-20261016";
import {localizedField, localizedTitle} from "./record-locale.js?v=login-recovery-20261015-2";
// Load optional map and intake modules only after authentication and authorization.
// A failure in either module must never prevent the login screen from appearing.

const $=id=>document.getElementById(id);
const txt={
 pt:{sideTitle:"Inteligência de mercados de fauna silvestre",sideCopy:"Acesso individual, verificação de e-mail e autorização administrativa. Os dados só são consultados após validação da conta.",sideFooter:"Acesso exclusivo a usuários autorizados",back:"Retorne ao Observatório Global de Tráfico de Animais",authTitle:"Acessar o NIMF",authSubtitle:"Seu e-mail e sua senha são administrados pelo serviço de autenticação, nunca pelo GitHub Pages.",login:"Entrar",signup:"Solicitar acesso",email:"E-mail",password:"Senha",confirm:"Confirmar senha",forgot:"Esqueceu sua senha?",note:"Criar uma conta não concede acesso aos dados. É necessária aprovação do administrador.",configTitle:"Área restrita em configuração",configBody:"O administrador precisa conectar o Firebase e aplicar as regras de segurança. Nenhuma informação privada está disponível neste momento.",unverifiedTitle:"Confirme seu e-mail",unverifiedText:"Enviamos um link para confirmar o endereço. Depois, volte aqui e verifique novamente.",pendingTitle:"Aguardando aprovação",pendingText:"Seu e-mail foi verificado. O administrador ainda precisa aprovar sua conta antes de você consultar registros.",blockedTitle:"Acesso ainda não autorizado",blockedText:"A conta não possui autorização válida para consultar os dados. Solicite aprovação ao administrador.",refresh:"Verificar novamente",resend:"Reenviar verificação",logout:"Sair",privateTitle:"Painel privado",privateDescription:"Dados carregados somente após autenticação, e-mail confirmado e autorização no Firestore.",recordsLabel:"Registros disponíveis",account:"Conta",approved:"Autorizada",roleAdmin:"Administrador de triagem",roleContributor:"Usuário colaborador",recordsTitle:"Registros privados",recordsSubtitle:"Registros aprovados para consulta, com controle de acesso aplicado no banco.",search:"Pesquisar",colTitle:"Título",colType:"Categoria",colSource:"Fonte",colStatus:"Verificação",empty:"Nenhum registro privado disponível ainda.",footer:"Dados internos. Não redistribua sem autorização.",searchPlaceholder:"Buscar nos registros carregados",privateKicker:"PAINEL RESTRITO - APENAS USUÁRIOS AUTORIZADOS",mapError:"O serviço cartográfico está parcialmente indisponível. Os filtros e registros continuam acessíveis.",explorerError:"Não foi possível abrir o explorador geográfico. Os registros continuam acessíveis na tabela.",intakeError:"A área de contribuições está temporariamente indisponível. Os demais dados continuam acessíveis.",genericError:"Não foi possível concluir esta ação. Confira seus dados ou tente novamente.",mismatch:"As senhas não coincidem.",weak:"Use uma senha com pelo menos 8 caracteres.",resetSent:"Se o e-mail estiver cadastrado, você receberá orientações para redefinir a senha.",resent:"Se a conta for elegível, um novo e-mail de verificação será enviado.",created:"Conta criada. Confirme seu e-mail e aguarde aprovação.",failedRead:"Falha ao consultar registros. Confira as regras de acesso."},
 en:{sideTitle:"Wildlife market intelligence",sideCopy:"Individual access with verified email and administrator approval before any private data can be accessed.",sideFooter:"Authorized users only",back:"Return to the Illegal Wildlife Trafficking Global Observatory",authTitle:"Access NIMF",authSubtitle:"Email and passwords are handled by the authentication service, never GitHub Pages.",login:"Sign in",signup:"Request access",email:"Email",password:"Password",confirm:"Confirm password",forgot:"Forgot password?",note:"Creating an account does not grant data access. Administrator approval is required.",configTitle:"Restricted area not configured",configBody:"The administrator must configure Firebase and deploy security rules. No private data is available yet.",unverifiedTitle:"Verify your email",unverifiedText:"An email verification link has been sent. Confirm your address and check again.",pendingTitle:"Awaiting approval",pendingText:"Your email is verified, but an administrator must approve this account.",blockedTitle:"Access not approved",blockedText:"Your account has no valid data access authorization.",refresh:"Check again",resend:"Resend verification",logout:"Sign out",privateTitle:"Private dashboard",privateDescription:"Data loads only after authentication, email verification and Firestore authorization.",recordsLabel:"Available records",account:"Account",approved:"Approved",roleAdmin:"Review administrator",roleContributor:"Contributor",recordsTitle:"Private records",recordsSubtitle:"Records available only after database access verification.",search:"Search",colTitle:"Title",colType:"Category",colSource:"Source",colStatus:"Verification",empty:"No private records yet.",footer:"Internal data. Do not redistribute without authorization.",searchPlaceholder:"Search loaded records",privateKicker:"RESTRICTED DASHBOARD - AUTHORIZED USERS ONLY",mapError:"Part of the map service is unavailable. Filters and records remain accessible.",explorerError:"Could not load the geographic explorer. Records remain accessible in the table.",intakeError:"Contributions are temporarily unavailable. Other data remain accessible.",genericError:"Unable to complete this action. Check your details or try again.",mismatch:"Passwords do not match.",weak:"Use at least 8 characters.",resetSent:"If this email is registered, you will receive password reset instructions.",resent:"If eligible, another verification message will be sent.",created:"Account created. Verify your email and await approval.",failedRead:"Could not load records. Check database security rules."},
 es:{sideTitle:"Inteligencia de mercados de fauna silvestre",sideCopy:"Acceso individual, correo verificado y aprobación administrativa antes de consultar datos privados.",sideFooter:"Solo usuarios autorizados",back:"Regrese al Observatorio Global de Tráfico de Animales",authTitle:"Ingresar a NIMF",authSubtitle:"El correo y la contraseña son administrados por el servicio de autenticación, nunca por GitHub Pages.",login:"Ingresar",signup:"Solicitar acceso",email:"Correo",password:"Contraseña",confirm:"Confirmar contraseña",forgot:"¿Olvidó su contraseña?",note:"Crear una cuenta no otorga acceso. Se requiere aprobación del administrador.",configTitle:"Área restringida sin configurar",configBody:"El administrador debe configurar Firebase y publicar las reglas de seguridad. No hay datos privados disponibles todavía.",unverifiedTitle:"Verifique su correo",unverifiedText:"Enviamos un enlace de confirmación. Verifique su dirección e inténtelo de nuevo.",pendingTitle:"Esperando aprobación",pendingText:"Su correo fue verificado, pero el administrador debe aprobar la cuenta.",blockedTitle:"Acceso no autorizado",blockedText:"Esta cuenta no tiene autorización válida para acceder a los datos.",refresh:"Verificar nuevamente",resend:"Reenviar confirmación",logout:"Salir",privateTitle:"Panel privado",privateDescription:"Los datos se cargan solamente tras autenticación, verificación del correo y autorización en Firestore.",recordsLabel:"Registros disponibles",account:"Cuenta",approved:"Autorizada",roleAdmin:"Administrador de revisión",roleContributor:"Usuario colaborador",recordsTitle:"Registros privados",recordsSubtitle:"Registros accesibles únicamente tras verificación en la base.",search:"Buscar",colTitle:"Título",colType:"Categoría",colSource:"Fuente",colStatus:"Verificación",empty:"No hay registros privados todavía.",footer:"Datos internos. No redistribuir sin autorización.",searchPlaceholder:"Buscar en los registros cargados",privateKicker:"PANEL RESTRINGIDO - SOLO USUARIOS AUTORIZADOS",mapError:"Una parte del servicio cartográfico no está disponible. Los filtros y registros siguen accesibles.",explorerError:"No fue posible abrir el explorador geográfico. Los registros siguen accesibles en la tabla.",intakeError:"Las contribuciones no están disponibles temporalmente. Los demás datos siguen accesibles.",genericError:"No se pudo completar la acción. Revise los datos o inténtelo nuevamente.",mismatch:"Las contraseñas no coinciden.",weak:"Utilice por lo menos 8 caracteres.",resetSent:"Si el correo está registrado, recibirá instrucciones para cambiar la contraseña.",resent:"Si es elegible, se enviará otra verificación.",created:"Cuenta creada. Verifique su correo y espere aprobación.",failedRead:"No fue posible consultar los registros. Revise las reglas de seguridad."}
};
let locale="pt",mode="login",auth=null,db=null,activeUser=null,records=[],authEpoch=0,approvalAdmin=false,reportGrants=[];
let explorerModule=null,intakeModule=null,mapModule=null,pointsBuffer=[],aurumQuantityBuffer={};
let workspaceView="dashboard";
let stopAccessRequests=null,adminPendingRequests=null,adminRequestsError=false,adminRequestUserId=null,adminRequestEpoch=-1,adminDeepLinkFocused=false;
/* Initialize OSINT filters before the first translate() call and Firebase startup. */
const osintCategoryKeys=["all","wildlifeTrade","digital","transport","species","geospatial","companies","media","cyber"];
let osintActiveCategory="all";

function switchWorkspace(view){
 if($("dashboard-panel").hidden || !auth?.currentUser || !auth.currentUser.emailVerified || !activeUser || auth.currentUser.uid!==activeUser.uid)return;
 workspaceView=["reports","internal","osint"].includes(view)?view:"dashboard";
 $("dashboard-primary").hidden=workspaceView!=="dashboard";
 $("intelligence-reports-view").hidden=workspaceView!=="reports";
 $("internal-reports-view").hidden=workspaceView!=="internal";
 $("osint-tools-view").hidden=workspaceView!=="osint";
 $("reports-nav").classList.toggle("active",workspaceView==="reports");
 $("internal-reports-nav").classList.toggle("active",workspaceView==="internal");
 $("osint-tools-nav").classList.toggle("active",workspaceView==="osint");
 $("dashboard-nav").classList.toggle("active",workspaceView==="dashboard");
 $("dashboard-nav").setAttribute("aria-current",workspaceView==="dashboard"?"page":"false");
 $("reports-nav").setAttribute("aria-current",workspaceView==="reports"?"page":"false");
 $("internal-reports-nav").setAttribute("aria-current",workspaceView==="internal"?"page":"false");
 $("osint-tools-nav").setAttribute("aria-current",workspaceView==="osint"?"page":"false");
 if(workspaceView==="reports")$("intelligence-reports-view").focus({preventScroll:true});
 if(workspaceView==="internal")$("internal-reports-view").focus({preventScroll:true});
 if(workspaceView==="osint")$("osint-tools-view").focus({preventScroll:true});
}
$("reports-nav").addEventListener("click",()=>switchWorkspace("reports"));
$("internal-reports-nav").addEventListener("click",()=>switchWorkspace("internal"));
$("osint-tools-nav").addEventListener("click",()=>switchWorkspace("osint"));
$("dashboard-nav").addEventListener("click",()=>switchWorkspace("dashboard"));

for(const [language,translations] of Object.entries({"pt":{"sideTitle":"Sobre esta seção de investigação","sideCopy":"A Investigação de Mercados de Fauna integra o Observatório Global de Tráfico de Animais. O acesso às ferramentas, análises e informações desta seção é restrito a usuários autorizados pela administração do projeto.","sideFooter":"Criado e gerenciado pelo Programa de Inteligência para Conservação da WCS Brasil.","brand":"Investigação de Mercados de Fauna","sideKicker":"SEÇÃO RESTRITA","reportsNav":"Relatórios de inteligência","contact":"Entre em contato com os desenvolvedores","program":"Programa de Inteligência para Conservação","reportsKicker":"BIBLIOTECA RESTRITA","reportsTitle":"Relatórios de inteligência","reportsDesc":"Página interna para organização de relatórios, pastas e arquivos de inteligência, disponíveis somente a usuários autorizados.","reportsEmptyTitle":"Biblioteca em preparação","reportsEmptyDesc":"Pastas e documentos serão adicionados em uma próxima etapa. Nenhum arquivo está disponível no momento.","authTitle":"Acessar Investigação de Mercados de Fauna","authKicker":"INVESTIGAÇÃO DE MERCADOS DE FAUNA / ACESSO","intakeKicker":"INVESTIGAÇÃO DE MERCADOS DE FAUNA / CONTRIBUIÇÕES","mapKicker":"INVESTIGAÇÃO DE MERCADOS DE FAUNA / MAPA REVISADO"},"en":{"sideTitle":"About this investigation section","sideCopy":"Wildlife Market Investigations is part of the Illegal Wildlife Trafficking Global Observatory. Access to the tools, analyses and information in this section is restricted to users authorized by the project's administration.","sideFooter":"Created and managed by the WCS Brazil Conservation Intelligence Program.","brand":"Wildlife Market Investigations","sideKicker":"RESTRICTED SECTION","reportsNav":"Intelligence reports","contact":"Contact the developers","program":"Conservation Intelligence Program","reportsKicker":"RESTRICTED LIBRARY","reportsTitle":"Intelligence reports","reportsDesc":"Internal page for organizing intelligence reports, folders and files, available only to authorized users.","reportsEmptyTitle":"Library in preparation","reportsEmptyDesc":"Folders and documents will be added at a later stage. No files are currently available.","authTitle":"Access Wildlife Market Investigations","authKicker":"WILDLIFE MARKET INVESTIGATIONS / ACCESS","intakeKicker":"WILDLIFE MARKET INVESTIGATIONS / CONTRIBUTIONS","mapKicker":"WILDLIFE MARKET INVESTIGATIONS / REVIEWED MAP"},"es":{"sideTitle":"Sobre esta sección de investigación","sideCopy":"Investigación de Mercados de Fauna forma parte del Observatorio Global de Tráfico de Animales. El acceso a las herramientas, los análisis y la información de esta sección está restringido a usuarios autorizados por la administración del proyecto.","sideFooter":"Creado y gestionado por el Programa de Inteligencia para la Conservación de WCS Brasil.","brand":"Investigación de Mercados de Fauna","sideKicker":"SECCIÓN RESTRINGIDA","reportsNav":"Informes de inteligencia","contact":"Contacte a los desarrolladores","program":"Programa de Inteligencia para la Conservación","reportsKicker":"BIBLIOTECA RESTRINGIDA","reportsTitle":"Informes de inteligencia","reportsDesc":"Página interna para organizar informes, carpetas y archivos de inteligencia, disponibles únicamente para usuarios autorizados.","reportsEmptyTitle":"Biblioteca en preparación","reportsEmptyDesc":"Las carpetas y los documentos se agregarán en una próxima etapa. Actualmente no hay archivos disponibles.","authTitle":"Acceder a Investigación de Mercados de Fauna","authKicker":"INVESTIGACIÓN DE MERCADOS DE FAUNA / ACCESO","intakeKicker":"INVESTIGACIÓN DE MERCADOS DE FAUNA / CONTRIBUCIONES","mapKicker":"INVESTIGACIÓN DE MERCADOS DE FAUNA / MAPA REVISADO"}}))Object.assign(txt[language],translations);
Object.assign(txt.pt,{waitingKicker:"CONTROLE DE ACESSO",authEmailPlaceholder:"usuario@instituicao.org",institutionPlaceholder:"Ex.: Universidade, órgão público ou ONG",justificationPlaceholder:"Explique a finalidade profissional do acesso e como pretende utilizar a plataforma.",retryTitle:"Complete sua solicitação para avaliação administrativa."});
Object.assign(txt.en,{waitingKicker:"ACCESS CONTROL",authEmailPlaceholder:"user@institution.org",institutionPlaceholder:"e.g. University, government agency or NGO",justificationPlaceholder:"Explain the professional purpose of your request and how you intend to use the platform.",retryTitle:"Complete your request for administrative review."});
Object.assign(txt.es,{waitingKicker:"CONTROL DE ACCESO",authEmailPlaceholder:"usuario@institucion.org",institutionPlaceholder:"Ej.: Universidad, organismo público u ONG",justificationPlaceholder:"Explique la finalidad profesional del acceso y cómo pretende utilizar la plataforma.",retryTitle:"Complete su solicitud para evaluación administrativa."});
txt.pt.dashboardNav="Painel";txt.en.dashboardNav="Dashboard";txt.es.dashboardNav="Panel";
const reportStrings={
 pt:{methodTitle:"Como são construídos",methodBody:"Relatórios de inteligência organizam evidências de fontes abertas, documentos e registros verificados, confrontando informações, registrando incertezas e distinguindo observação de comprovação de comércio ou ilícito. Informações sensíveis são tratadas sob controles adicionais de acesso.",none:"Nenhum relatório foi disponibilizado para sua conta.",open:"Consultar relatório"},
 en:{methodTitle:"How reports are prepared",methodBody:"Intelligence reports organize evidence from open sources, documents and verified records, cross-check facts, record uncertainty and distinguish observation from proven trade or wrongdoing. Sensitive information is handled under additional access controls.",none:"No intelligence reports are available to your account.",open:"View report"},
 es:{methodTitle:"Cómo se elaboran",methodBody:"Los informes de inteligencia organizan evidencias de fuentes abiertas, documentos y registros verificados, contrastan información, registran incertidumbres y distinguen observaciones de comercio o infracciones comprobadas. La información sensible está sujeta a controles adicionales.",none:"No hay informes disponibles para su cuenta.",open:"Consultar informe"}
};
const internalStrings={
 pt:{nav:"Relatórios Internos",kicker:"BIBLIOTECA INTERNA",title:"Relatórios Internos",description:"Relatórios e análises do Programa de Inteligência para Conservação da WCS Brasil, organizados por tema.",tabsLabel:"Categorias de relatórios internos",evolution:"Relatórios de Gestão",territorial:"Relatórios territoriais",species:"Relatórios de espécies",descriptions:{evolution:"Relatórios de gestão, auditoria, acompanhamento institucional e evolução operacional do Observatório.",territorial:"Análises do Programa de Inteligência para Conservação da WCS Brasil sobre territórios e áreas prioritárias para a conservação, suas dinâmicas e os desafios associados ao tráfico de fauna.",species:"Análises de espécies visadas pelo tráfico de fauna, abordando padrões de comércio, ameaças, evidências documentadas e prioridades para a conservação."},empty:"Nenhum relatório disponível nesta categoria.",loading:"Carregando relatórios...",error:"Não foi possível carregar os relatórios. Tente atualizar a página.",period:"Período",year:"Ano",available:"Idioma disponível",download:"Ver relatório",notAvailable:"Arquivo indisponível no idioma selecionado.",pdfOriginal:"PDF original em português",supplementary:"Materiais gráficos complementares"},
 en:{nav:"Internal Reports",kicker:"INTERNAL LIBRARY",title:"Internal Reports",description:"Reports and analyses from WCS Brasil's Conservation Intelligence Program, organized by topic.",tabsLabel:"Internal report categories",evolution:"Management Reports",territorial:"Territorial reports",species:"Species reports",descriptions:{evolution:"Management, audit, institutional monitoring and operational development reports for the Observatory.",territorial:"Analyses by WCS Brasil's Conservation Intelligence Program concerning territories and priority conservation areas, their dynamics and wildlife trafficking challenges.",species:"Analyses of species targeted by wildlife trafficking, addressing trade patterns, threats, documented evidence and conservation priorities."},empty:"No reports are available in this category.",loading:"Loading reports...",error:"Reports could not be loaded. Please refresh the page.",period:"Period",year:"Year",available:"Available language",download:"View report",notAvailable:"The selected language edition is not available.",pdfOriginal:"Original PDF in Portuguese",supplementary:"Supplementary graphics"},
 es:{nav:"Informes Internos",kicker:"BIBLIOTECA INTERNA",title:"Informes Internos",description:"Informes y análisis del Programa de Inteligencia para la Conservación de WCS Brasil, organizados por tema.",tabsLabel:"Categorías de informes internos",evolution:"Informes de Gestión",territorial:"Informes territoriales",species:"Informes sobre especies",descriptions:{evolution:"Informes de gestión, auditoría, seguimiento institucional y evolución operativa del Observatorio.",territorial:"Análisis del Programa de Inteligencia para la Conservación de WCS Brasil sobre territorios y áreas prioritarias para la conservación, sus dinámicas y los desafíos relacionados con el tráfico de fauna.",species:"Análisis sobre especies afectadas por el tráfico de fauna, incluidos patrones comerciales, amenazas, evidencias documentadas y prioridades para la conservación."},empty:"No hay informes disponibles en esta categoría.",loading:"Cargando informes...",error:"No se pudieron cargar los informes. Actualice la página.",period:"Período",year:"Año",available:"Idioma disponible",download:"Ver informe",notAvailable:"El archivo en el idioma seleccionado no está disponible.",pdfOriginal:"PDF original en portugués",supplementary:"Material gráfico complementario"}
};
const osintStrings={
 pt:{
  nav:"Ferramentas OSINT",kicker:"FONTES ABERTAS / FERRAMENTAS",title:"Ferramentas OSINT",
  description:"Acesso rápido a serviços externos úteis para pesquisa, preservação de páginas, análise de embarcações, pesca, domínios e investigação em fontes abertas.",
  note:"Os serviços abaixo são externos ao Observatório. Use-os de acordo com suas políticas de uso, a legislação aplicável e a finalidade institucional da investigação.",
  open:"Abrir ferramenta",
  tools:{
   wayback:"Consulte versões arquivadas de páginas e acompanhe mudanças históricas em sites.",
   marineTraffic:"Pesquise embarcações, posições, movimentos, portos e informações de tráfego marítimo.",
   gisis:"Consulte o Global Integrated Shipping Information System da Organização Marítima Internacional.",
   gfw:"Explore atividade de embarcações, pesca aparente, encontros e presença no mar em mapas interativos.",
   whois:"Investigue registros de domínio e informações técnicas associadas à infraestrutura de sites.",
   osintFramework:"Navegue por um diretório estruturado de recursos e técnicas de investigação em fontes abertas.",
   googleDorks:"Use operadores avançados de busca para localizar páginas, documentos, domínios e termos específicos no Google."
  }
 },
 en:{
  nav:"OSINT Tools",kicker:"OPEN SOURCES / TOOLS",title:"OSINT Tools",
  description:"Quick access to external services for web preservation, vessel and fishing analysis, domain research and open-source investigations.",
  note:"The services below are external to the Observatory. Use them in accordance with their terms, applicable law and the institutional purpose of the investigation.",
  open:"Open tool",
  tools:{
   wayback:"Review archived versions of web pages and track historical changes to websites.",
   marineTraffic:"Research vessels, positions, movements, ports and maritime traffic information.",
   gisis:"Access the International Maritime Organization's Global Integrated Shipping Information System.",
   gfw:"Explore vessel activity, apparent fishing activity, encounters and presence at sea on interactive maps.",
   whois:"Investigate domain registration records and technical information associated with website infrastructure.",
   osintFramework:"Browse a structured directory of open-source investigation resources and techniques.",
   googleDorks:"Use advanced search operators to locate pages, documents, domains and specific terms in Google."
  }
 },
 es:{
  nav:"Herramientas OSINT",kicker:"FUENTES ABIERTAS / HERRAMIENTAS",title:"Herramientas OSINT",
  description:"Acceso rápido a servicios externos para preservación web, análisis de embarcaciones y pesca, investigación de dominios y fuentes abiertas.",
  note:"Los servicios que aparecen a continuación son externos al Observatorio. Úselos conforme a sus políticas, la legislación aplicable y la finalidad institucional de la investigación.",
  open:"Abrir herramienta",
  tools:{
   wayback:"Consulte versiones archivadas de páginas y siga cambios históricos en sitios web.",
   marineTraffic:"Investigue embarcaciones, posiciones, movimientos, puertos e información de tráfico marítimo.",
   gisis:"Acceda al Global Integrated Shipping Information System de la Organización Marítima Internacional.",
   gfw:"Explore actividad de embarcaciones, pesca aparente, encuentros y presencia en el mar mediante mapas interactivos.",
   whois:"Investigue registros de dominios e información técnica asociada a la infraestructura de sitios web.",
   osintFramework:"Explore un directorio estructurado de recursos y técnicas de investigación en fuentes abiertas.",
   googleDorks:"Use operadores avanzados de búsqueda para localizar páginas, documentos, dominios y términos específicos en Google."
  }
 }
};

/* OSINT library localization. */
Object.assign(osintStrings.pt,{"searchLabel":"Buscar ferramenta","searchPlaceholder":"Nome, espécie, rota ou finalidade","reset":"Limpar filtros","filtersLabel":"Categorias de ferramentas OSINT","count":"{shown} de {total} ferramentas","empty":"Nenhuma ferramenta encontrada para os filtros selecionados.","categories":{"all":"Todas","wildlifeTrade":"Comércio de fauna","digital":"Investigação digital","transport":"Transporte e rotas","species":"Espécies e biodiversidade","geospatial":"Geoespacial","companies":"Empresas e vínculos"}});
Object.assign(osintStrings.pt.tools,{"citesTrade":"Consulte registros oficiais de comércio internacional declarado sob a CITES por espécie, país e período. Não é uma base de tráfico ilegal.","speciesPlus":"Verifique enquadramento CITES e CMS, taxonomia, distribuição e informações regulatórias de espécies.","googleLens":"Pesquise imagens semelhantes para examinar fotografias de animais e possíveis reutilizações em anúncios.","tineye":"Localize cópias de fotografias em diferentes sites para avaliar a reutilização de imagens em anúncios.","openCorporates":"Consulte registros públicos de empresas para contextualizar importadores, exportadores e estabelecimentos comerciais.","adsbExchange":"Examine posições e trajetórias de aeronaves reportadas por ADS-B; cobertura e históricos podem variar.","gbif":"Consulte registros de ocorrência e dados georreferenciados de biodiversidade para contextualizar a distribuição de espécies.","iNaturalist":"Explore observações, imagens e identificações colaborativas de espécies; dados devem ser verificados antes do uso investigativo.","iucnRedList":"Consulte categorias de ameaça, avaliações de conservação e informações sobre distribuição de espécies na Lista Vermelha da IUCN."});
Object.assign(osintStrings.en,{"searchLabel":"Search tools","searchPlaceholder":"Tool name, species, route or purpose","reset":"Clear filters","filtersLabel":"OSINT tool categories","count":"{shown} of {total} tools","empty":"No tools match the selected filters.","categories":{"all":"All","wildlifeTrade":"Wildlife trade","digital":"Digital investigation","transport":"Transport and routes","species":"Species and biodiversity","geospatial":"Geospatial","companies":"Companies and connections"}});
Object.assign(osintStrings.en.tools,{"citesTrade":"Review official CITES-reported international trade records by species, country and period. This is not an illegal wildlife trade database.","speciesPlus":"Check CITES and CMS listings, taxonomy, distribution and species-related regulatory information.","googleLens":"Find visually similar images to investigate wildlife photographs and possible reuse across advertisements.","tineye":"Locate copies of photographs across websites to assess image reuse in online listings.","openCorporates":"Search public company records to contextualize importers, exporters and commercial entities.","adsbExchange":"Examine aircraft positions and routes reported through ADS-B; coverage and historical data may vary.","gbif":"Explore biodiversity occurrence and georeferenced records to contextualize species distributions.","iNaturalist":"Browse community observations, photographs and species identifications; validate records before investigative use.","iucnRedList":"Review threat categories, conservation assessments and species distribution information from the IUCN Red List."});
Object.assign(osintStrings.es,{"searchLabel":"Buscar herramientas","searchPlaceholder":"Nombre, especie, ruta o finalidad","reset":"Limpiar filtros","filtersLabel":"Categorías de herramientas OSINT","count":"{shown} de {total} herramientas","empty":"No se encontraron herramientas con los filtros seleccionados.","categories":{"all":"Todas","wildlifeTrade":"Comercio de fauna","digital":"Investigación digital","transport":"Transporte y rutas","species":"Especies y biodiversidad","geospatial":"Geoespacial","companies":"Empresas y vínculos"}});
Object.assign(osintStrings.es.tools,{"citesTrade":"Consulte registros oficiales del comercio internacional declarado a la CITES por especie, país y período. No es una base de tráfico ilegal.","speciesPlus":"Verifique listados CITES y CMS, taxonomía, distribución e información normativa sobre especies.","googleLens":"Busque imágenes similares para investigar fotografías de fauna y posibles reutilizaciones en anuncios.","tineye":"Localice copias de fotografías en diferentes sitios para evaluar la reutilización de imágenes en anuncios.","openCorporates":"Consulte registros públicos de empresas para contextualizar importadores, exportadores y establecimientos comerciales.","adsbExchange":"Examine posiciones y rutas de aeronaves registradas mediante ADS-B; cobertura e historiales pueden variar.","gbif":"Consulte registros de presencia y datos georreferenciados de biodiversidad para contextualizar la distribución de especies.","iNaturalist":"Explore observaciones, imágenes e identificaciones colaborativas; verifique los registros antes de usarlos en investigaciones.","iucnRedList":"Consulte categorías de amenaza, evaluaciones de conservación y datos de distribución de especies en la Lista Roja de la UICN."});

/* Additional global monitoring and Recorded Future article tools. */
Object.assign(osintStrings.pt.tools,{"osiris":"Painel global de fontes abertas com camadas de voos, embarcações, satélites e câmeras; confira a origem e a atualização dos dados.","worldCam":"Localize câmeras públicas de cidades, portos e aeroportos para obter contexto visual de localidades.","radioGarden":"Encontre emissoras de rádio de diferentes regiões e acompanhe relatos e notícias locais em áudio.","flightradar24":"Consulte voos e trajetórias disponíveis no mapa; histórico detalhado e cobertura podem depender do plano.","theHarvester":"Software para coletar informações públicas sobre domínios, subdomínios e infraestrutura digital; requer instalação.","securityTrails":"Consulte registros e histórico DNS, IPs e domínios por API; exige chave e pode ter limites comerciais.","bgpView":"Explore informações públicas sobre ASNs, endereços IP e rotas BGP para contextualizar infraestrutura de rede.","rfVulnerabilities":"Consulte informações de vulnerabilidades e CVEs para avaliar riscos de infraestrutura e plataformas digitais.","triageSandbox":"Analise arquivos e possíveis ameaças digitais em ambiente controlado; não envie dados investigativos sensíveis.","mitaka":"Extensão de navegador para pesquisar indicadores, domínios e outras entidades em múltiplas fontes OSINT.","rfExtension":"Extensão que contextualiza URLs, domínios, IPs e indicadores de risco; recursos variam conforme a licença.","haveIBeenPwned":"Verifique se endereços de e-mail sob sua responsabilidade aparecem em vazamentos públicos conhecidos.","builtWith":"Identifique tecnologias usadas por sites e lojas virtuais para comparar infraestrutura de plataformas comerciais.","shodan":"Pesquise informações já indexadas sobre dispositivos e serviços conectados à internet; use apenas para fins autorizados.","spiderFoot":"Software de correlação automatizada de fontes OSINT sobre domínios e infraestrutura; código disponível no GitHub.","maltego":"Organize conexões entre empresas, sites, domínios e outras entidades em gráficos de vínculos.","nmap":"Ferramenta instalável para inspeção autorizada de redes e serviços; não é uma busca passiva por padrão."});
Object.assign(osintStrings.pt.categories,{"media":"Mídia e monitoramento","cyber":"Cibersegurança"});
Object.assign(osintStrings.en.tools,{"osiris":"Global open-source monitoring dashboard with flight, maritime, satellite and camera layers; verify source and freshness.","worldCam":"Find public webcams in cities, harbors and airports for visual context about locations.","radioGarden":"Find radio stations worldwide and follow local news and reporting through public broadcasts.","flightradar24":"View available flight positions and routes on a map; detailed history and coverage can depend on the plan.","theHarvester":"Software for gathering public domain, subdomain and digital infrastructure information; requires installation.","securityTrails":"Query DNS history, IP and domain records via API; requires an API key and may have commercial limits.","bgpView":"Explore public ASN, IP address and BGP route information to contextualize network infrastructure.","rfVulnerabilities":"Review vulnerability and CVE information to assess risks affecting digital infrastructure and platforms.","triageSandbox":"Analyze files and potential digital threats in a controlled sandbox; do not upload sensitive investigative data.","mitaka":"Browser extension for pivoting from indicators, domains and other entities to multiple OSINT sources.","rfExtension":"Browser extension for context on URLs, domains, IPs and risk indicators; features vary by license.","haveIBeenPwned":"Check whether email addresses you own or administer appear in known public data breaches.","builtWith":"Identify technologies used by websites and online stores to compare commercial platform infrastructure.","shodan":"Search indexed information about internet-connected devices and services; use only for authorized purposes.","spiderFoot":"Open-source software to correlate OSINT on domains and infrastructure; source code is on GitHub.","maltego":"Map relationships among companies, sites, domains and other entities using link-analysis graphs.","nmap":"Installable tool for authorized network and service inspection; not passive reconnaissance by default."});
Object.assign(osintStrings.en.categories,{"media":"Media and monitoring","cyber":"Cybersecurity"});
Object.assign(osintStrings.es.tools,{"osiris":"Panel global de fuentes abiertas con capas de vuelos, buques, satélites y cámaras; verifique las fuentes y su actualización.","worldCam":"Localice cámaras públicas de ciudades, puertos y aeropuertos para contextualizar lugares.","radioGarden":"Encuentre emisoras de radio de distintas regiones y siga noticias e informes locales en audio.","flightradar24":"Consulte vuelos y rutas disponibles en el mapa; el historial detallado y la cobertura pueden depender del plan.","theHarvester":"Programa para recopilar información pública sobre dominios, subdominios e infraestructura digital; requiere instalación.","securityTrails":"Consulte historial DNS, direcciones IP y dominios por API; requiere clave y puede tener límites comerciales.","bgpView":"Explore información pública sobre ASN, direcciones IP y rutas BGP para contextualizar infraestructura de red.","rfVulnerabilities":"Consulte información de vulnerabilidades y CVE para evaluar riesgos de infraestructura y plataformas digitales.","triageSandbox":"Analice archivos y posibles amenazas digitales en un entorno controlado; no suba datos sensibles de investigaciones.","mitaka":"Extensión del navegador para consultar indicadores, dominios y otras entidades en varias fuentes OSINT.","rfExtension":"Extensión que contextualiza URL, dominios, IP e indicadores de riesgo; funciones según licencia.","haveIBeenPwned":"Compruebe si las direcciones de correo bajo su responsabilidad aparecen en filtraciones públicas conocidas.","builtWith":"Identifique tecnologías de sitios y tiendas en línea para comparar infraestructuras comerciales.","shodan":"Busque información indexada sobre dispositivos y servicios de internet; úsela solo con autorización.","spiderFoot":"Programa abierto para correlacionar fuentes OSINT sobre dominios e infraestructura; código en GitHub.","maltego":"Organice conexiones entre empresas, sitios, dominios y otras entidades mediante gráficos de vínculos.","nmap":"Herramienta instalable para inspección autorizada de redes y servicios; no es búsqueda pasiva por defecto."});
Object.assign(osintStrings.es.categories,{"media":"Medios y monitoreo","cyber":"Ciberseguridad"});
const accessStrings={
pt:{institution:"Instituição / organização",justification:"Justificativa para solicitar acesso",privacy:"As informações serão utilizadas exclusivamente para avaliar sua solicitação.",retry:"Complete sua solicitação para avaliação administrativa.",send:"Enviar solicitação",adminTitle:"Solicitações de novos usuários",adminDescription:"Avalie instituição e justificativa. A autorização de relatórios é separada.",approve:"Aprovar acesso",emailVerified:"E-mail verificado",confirm:"Confirma a autorização de acesso ao painel para este usuário? Isso não libera relatórios de inteligência.",pending:"Aguardando aprovação",submitted:"Solicitação registrada. Aguarde avaliação administrativa.",error:"Não foi possível registrar sua solicitação. Tente novamente.",approved:"Acesso aprovado.",review:"Abrir solicitação",firebaseUsers:"Abrir Firebase",firebaseUsersAria:"Abrir usuários no Firebase Console (nova aba)",needsDetails:"Complete os dados da solicitação para enviá-la à administração.",checking:"Consultando solicitações...",nonePending:"Nenhuma solicitação pendente",onePending:"1 solicitação pendente",manyPending:"{count} solicitações pendentes",readError:"Não foi possível consultar as solicitações."},
en:{institution:"Institution / organization",justification:"Reason for requesting access",privacy:"This information is used only to assess your access request.",retry:"Complete your request for administrative review.",send:"Submit request",adminTitle:"New user access requests",adminDescription:"Review institution and rationale. Intelligence report authorization is separate.",approve:"Approve access",emailVerified:"Email verified",confirm:"Approve this user's dashboard access? This does not grant intelligence report access.",pending:"Awaiting approval",submitted:"Your request was recorded. Await administrative review.",error:"Unable to submit your request. Please try again.",approved:"Access approved.",review:"Open request",firebaseUsers:"Open Firebase",firebaseUsersAria:"Open users in Firebase Console (new tab)",needsDetails:"Complete your request details to submit them for administrative review.",checking:"Checking requests...",nonePending:"No pending requests",onePending:"1 pending request",manyPending:"{count} pending requests",readError:"Could not load access requests."},
es:{institution:"Institución / organización",justification:"Motivo de la solicitud de acceso",privacy:"Esta información se utiliza únicamente para evaluar su solicitud.",retry:"Complete su solicitud para la evaluación administrativa.",send:"Enviar solicitud",adminTitle:"Solicitudes de nuevos usuarios",adminDescription:"Revise institución y justificación. El acceso a informes requiere autorización independiente.",approve:"Aprobar acceso",emailVerified:"Correo verificado",confirm:"¿Aprueba el acceso de este usuario al panel? Esto no autoriza informes de inteligencia.",pending:"Pendiente de aprobación",submitted:"Solicitud registrada. Espere la evaluación administrativa.",error:"No fue posible registrar la solicitud. Inténtelo nuevamente.",approved:"Acceso aprobado.",review:"Abrir solicitud",firebaseUsers:"Abrir Firebase",firebaseUsersAria:"Abrir usuarios en Firebase Console (nueva pestaña)",needsDetails:"Complete los datos de la solicitud para enviarla a la administración.",checking:"Consultando solicitudes...",nonePending:"Ninguna solicitud pendiente",onePending:"1 solicitud pendiente",manyPending:"{count} solicitudes pendientes",readError:"No se pudieron consultar las solicitudes."}
};
const t=k=>txt[locale][k]||k;
function show(id){for(const p of ["config-panel","auth-panel","waiting-panel","dashboard-panel"])$(p).hidden=p!==id;const allowed=id==="dashboard-panel";$("reports-nav").disabled=!allowed;$("internal-reports-nav").disabled=!allowed;$("osint-tools-nav").disabled=!allowed;$("dashboard-nav").disabled=!allowed;document.body.dataset.privateReady=allowed?"true":"false";if(!allowed){workspaceView="dashboard";$("reports-nav").classList.remove("active");$("internal-reports-nav").classList.remove("active");$("osint-tools-nav").classList.remove("active");$("dashboard-primary").hidden=false;$("intelligence-reports-view").hidden=true;$("internal-reports-view").hidden=true;$("osint-tools-view").hidden=true;}}
function message(id,text){$(id).textContent=text;$(id).hidden=!text;}
function translate(){
 document.documentElement.lang=locale==="pt"?"pt-BR":locale;
 refreshInterfaceThemeLabel();
  document.title="IWT Global Observatory | "+(locale==="pt"?"Área restrita":locale==="en"?"Restricted area":"Área restringida");
 const items={"waiting-kicker":"waitingKicker","side-title":"sideTitle","side-copy":"sideCopy","side-footer":"sideFooter","back-public":"back","auth-title":"authTitle","auth-subtitle":"authSubtitle","login-tab":"login","signup-tab":"signup","email-label":"email","password-label":"password","confirm-label":"confirm","forgot-password":"forgot","auth-note":"note","config-title":"configTitle","config-body":"configBody","refresh-access":"refresh","resend-verification":"resend","waiting-logout":"logout","private-title":"privateTitle","private-description":"privateDescription","private-logout":"logout","records-label":"recordsLabel","account-label":"account","account-status":"approved","records-title":"recordsTitle","records-subtitle":"recordsSubtitle","search-label":"search","col-title":"colTitle","col-type":"colType","col-source":"colSource","col-status":"colStatus","privacy-footer":"footer"};
 items["private-kicker"]="privateKicker";
 Object.assign(items,{"side-brand-name":"brand","side-kicker":"sideKicker","dashboard-nav-label":"dashboardNav","reports-nav-label":"reportsNav","contact-label":"contact","program-name":"program","reports-page-kicker":"reportsKicker","reports-page-title":"reportsTitle","reports-page-description":"reportsDesc","reports-empty-description":"reportsEmptyDesc","auth-kicker":"authKicker","intake-kicker":"intakeKicker","admin-map-kicker":"mapKicker"});
 for(const [id,key] of Object.entries(items))$(id).textContent=t(key);
 for(const [id,key] of Object.entries({"internal-reports-nav-label":"nav","internal-reports-kicker":"kicker","internal-reports-title":"title","internal-reports-description":"description"}))$(id).textContent=internalStrings[locale][key];
 const osint=osintStrings[locale];
 for(const [id,key] of Object.entries({"osint-tools-nav-label":"nav","osint-tools-kicker":"kicker","osint-tools-title":"title","osint-tools-description":"description","osint-tools-note":"note"}))$(id).textContent=osint[key];
 for(const [tool,key] of Object.entries({wayback:"wayback",marineTraffic:"marineTraffic",gisis:"gisis",gfw:"gfw",whois:"whois",osintFramework:"osintFramework",googleDorks:"googleDorks",citesTrade:"citesTrade",speciesPlus:"speciesPlus",googleLens:"googleLens",tineye:"tineye",openCorporates:"openCorporates",adsbExchange:"adsbExchange",gbif:"gbif",iNaturalist:"iNaturalist",iucnRedList:"iucnRedList",osiris:"osiris",worldCam:"worldCam",radioGarden:"radioGarden",flightradar24:"flightradar24",theHarvester:"theHarvester",securityTrails:"securityTrails",bgpView:"bgpView",rfVulnerabilities:"rfVulnerabilities",triageSandbox:"triageSandbox",mitaka:"mitaka",rfExtension:"rfExtension",haveIBeenPwned:"haveIBeenPwned",builtWith:"builtWith",shodan:"shodan",spiderFoot:"spiderFoot",maltego:"maltego",nmap:"nmap"})){
  const desc=$("osint-desc-"+tool);if(desc)desc.textContent=osint.tools[key];
 }
 document.querySelectorAll(".osint-tool-link-label").forEach(node=>node.textContent=osint.open+" ↗");
 // OSINT enhancements must never block Firebase initialization.
 try{updateOsintLibrary();}catch(error){console.warn("OSINT library filtering failed",error);}
 $("record-search").placeholder=t("searchPlaceholder");
 $("auth-email").placeholder=t("authEmailPlaceholder");$("auth-institution").placeholder=t("institutionPlaceholder");$("auth-justification").placeholder=t("justificationPlaceholder");$("retry-request-title").textContent=t("retryTitle");
 for(const [id,key] of [["institution-label","institution"],["justification-label","justification"],["signup-privacy-note","privacy"],["retry-institution-label","institution"],["retry-justification-label","justification"],["retry-request-button","send"],["admin-requests-title","adminTitle"],["admin-requests-description","adminDescription"],["admin-firebase-users-link","firebaseUsers"]]){const target=$(id);if(target)target.textContent=accessStrings[locale][key];}
 $("admin-firebase-users-link").setAttribute("aria-label",accessStrings[locale].firebaseUsersAria);
 if(approvalAdmin && adminRequestUserId)renderAdminApplications();
 document.querySelector(".secure-brand")?.setAttribute("aria-label",t("back"));document.querySelector(".secure-brand")?.setAttribute("title",t("back"));
 $("account-role").textContent=approvalAdmin?t("roleAdmin"):t("roleContributor");
 if(intakeModule){try{intakeModule.setIntakeLanguage(locale);}catch(e){console.warn("Intake locale update failed",e);}}
  if(mapModule){try{mapModule.setMapPointLanguage(locale);}catch(e){console.warn("Map admin locale update failed",e);}}
 showInternalCategory(internalCategory);
 $("submit-button").textContent=t(mode);$("auth-confirm").autocomplete=mode==="signup"?"new-password":"off";
 $("auth-password").autocomplete=mode==="signup"?"new-password":"current-password";
 if(activeUser && $("waiting-panel").hidden===false)displayWaiting(activeUser,!activeUser.emailVerified,false);
 if(!$("dashboard-panel").hidden){drawRecords();if(explorerModule){try{explorerModule.setExplorerLanguage(locale);}catch(e){console.warn("Explorer locale update failed",e);}}} if(window.__nimfRefreshUtilityPanels)window.__nimfRefreshUtilityPanels(); if(window.__nimfMapFilterTranslate)window.__nimfMapFilterTranslate();
}
const publicReportCatalogUrl="https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/reports-internal.json";
const publicReportBase="https://raw.githubusercontent.com/acarvalho-wcs/wildlife-trafficking-reports/main/";
let internalLibrary=[],internalCatalogLoaded=false,internalCatalogError=false,internalCategory="evolution";
const internalCategories=["evolution","territorial","species"];
function localInternal(value,lang){return typeof value==="string"?value:(value?.[lang]||value?.pt||"");}
function showInternalCategory(category,focus=false){
 if(!internalCategories.includes(category))return;
 internalCategory=category;
 const l=internalStrings[locale],tablist=$("internal-reports-tabs"),panel=$("internal-reports-panel");
 tablist.setAttribute("aria-label",l.tabsLabel);
 for(const key of internalCategories){
  const button=$("internal-category-"+key);
  button.setAttribute("aria-selected",String(key===category));
  button.classList.toggle("active",key===category);
  button.tabIndex=key===category?0:-1;
  $("internal-category-"+key+"-label").textContent=l[key];
 }
 panel.setAttribute("aria-labelledby","internal-category-"+category);
 $("internal-reports-panel-title").textContent=l[category];
 $("internal-reports-panel-description").textContent=l.descriptions[category];
 renderInternalReport();
 if(focus)$("internal-category-"+category).focus();
}
function renderInternalReport(){
 const list=$("internal-reports-folders");if(!list)return;
 list.replaceChildren();
 const lang=["pt","en","es"].includes(locale)?locale:"pt",labels=internalStrings[lang];
 const empty=$("internal-reports-empty");
 if(!internalCatalogLoaded){
  empty.textContent=internalCatalogError?labels.error:labels.loading;
  empty.hidden=false;return;
 }
 if(internalCatalogError){empty.textContent=labels.error;empty.hidden=false;return;}
 const items=internalLibrary.filter(item=>(item.category||"evolution")===internalCategory);
 for(const item of items){
  const card=document.createElement("article");card.className="internal-document-card";
  const title=document.createElement("h4");appendScientific(title,localInternal(item.title,lang)||item.id,item.scientific_name||"");card.append(title);
  const desc=document.createElement("p");desc.className="internal-document-description";appendScientific(desc,localInternal(item.description,lang),item.scientific_name||"");card.append(desc);
  const meta=document.createElement("dl");meta.className="internal-document-meta";
  const dateFormat=lang==="en"?"en-GB":lang==="es"?"es-ES":"pt-BR";
  const start=item.period_start,end=item.period_end;
  // Prefer the selected language, but always offer another verified PDF edition.
  const validPdf=entry=>entry?.available===true&&typeof entry.path==="string"&&/^reports\/internal\/[a-zA-Z0-9._/-]+[.]pdf$/.test(entry.path)&&!entry.path.split("/").includes("..");
  const availableFiles=item.files||{};
  const originalKey=[...new Set([lang,"en","pt","es"])].find(key=>validPdf(availableFiles[key]));
  const file=originalKey?availableFiles[originalKey]:null;
  const valid=Boolean(file);
  const originalLanguage=["pt","en","es"].includes(file?.language)?file.language:originalKey;
  const fallbackLanguage=valid&&originalLanguage!==lang;
  const originalPdfLabel=originalLanguage==="pt"?labels.pdfOriginal:originalLanguage==="en"?"Original PDF in English":"Original PDF in Spanish";
  const languageLabel=valid?(fallbackLanguage?originalPdfLabel:lang==="pt"?"Português":lang==="en"?"English":"Español"):"";
  const availableLabel=fallbackLanguage&&originalLanguage==="en"?"Available language":labels.available;
  const formatDate=value=>{if(typeof value!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return "";const parts=value.split("-");return new Intl.DateTimeFormat(dateFormat,{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(+parts[0],+parts[1]-1,+parts[2])));};
  for(const [term,detail] of [[labels.period,[formatDate(start),formatDate(end)].filter(Boolean).join(" – ")],[labels.year,(item.date||"").slice(0,4)],[availableLabel,languageLabel]]){
   if(!detail)continue;const group=document.createElement("div"),dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=term;dd.textContent=detail;group.append(dt,dd);meta.append(group);
  }
  card.append(meta);
  if(valid){
   const link=document.createElement("a");
   link.href=publicReportBase+file.path.split("/").map(encodeURIComponent).join("/");
   link.target="_blank";link.rel="noopener noreferrer";link.className="internal-document-link";
   link.textContent=labels.download+" ↗";
   card.append(link);
  }else{
   const unavailable=document.createElement("p");unavailable.className="reports-empty-description";unavailable.textContent=labels.notAvailable;card.append(unavailable);
  }
  if(Array.isArray(item.materials)&&item.materials.some(m=>m.available===true)){
   const attachments=document.createElement("div");attachments.className="internal-report-attachments";
   const heading=document.createElement("h5");heading.textContent=labels.supplementary;attachments.append(heading);
   const links=document.createElement("div");links.className="internal-report-attachment-links";
   for(const material of item.materials){
    // Keep the triple-border infographic exclusive to its own territorial dossier.
    if(item.id==="territorial-guapore-itenez-2026-10-09" && /Infogra/i.test(material.path||"") && /Fronteira/i.test(material.path||""))continue;
    if(material.available!==true||material.type!=="image"||typeof material.path!=="string"||!material.path.startsWith("reports/internal/")||!/[.](png|jpe?g)$/.test(material.path.toLowerCase())||material.path.split("/").includes(".."))continue;
    const link=document.createElement("a");link.className="internal-report-attachment";
    link.href=publicReportBase+material.path.split("/").map(encodeURIComponent).join("/");
    link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=localInternal(material.title,lang)+" ↗";links.append(link);
   }
   attachments.append(links);card.append(attachments);
  }
  list.append(card);
 }
 empty.textContent=labels.empty;empty.hidden=items.length>0;
}
async function loadInternalReports(){
 internalCatalogLoaded=false;internalCatalogError=false;renderInternalReport();
 try{
  const response=await fetch(publicReportCatalogUrl+"?v="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw Error("Catalogue fetch failed");
  const payload=await response.json();
  internalLibrary=Array.isArray(payload.reports)?payload.reports:[];
  // Pending PDF links are enabled only when the uploaded file is reachable.
  const pendingChecks=internalLibrary.flatMap(item=>Object.values(item.files||{}).filter(file=>file?.available===false&&typeof file.path==="string"&&/^reports\/internal\/[a-zA-Z0-9._/-]+[.]pdf$/.test(file.path)));
  await Promise.all(pendingChecks.map(async file=>{
   try{
    const pdfUrl=publicReportBase+file.path.split("/").map(encodeURIComponent).join("/");
    const response=await fetch(pdfUrl+"?v="+Date.now(),{method:"HEAD",cache:"no-store"});
    if(response.ok)file.available=true;
   }catch(error){console.info("A report PDF is pending upload or temporarily unavailable.");}
  }));
 }catch(error){console.warn("Internal catalog unavailable",error);internalLibrary=[];internalCatalogError=true;}
 finally{internalCatalogLoaded=true;renderInternalReport();}
}
for(const key of internalCategories){
 $("internal-category-"+key).addEventListener("click",()=>showInternalCategory(key));
 $("internal-category-"+key).addEventListener("keydown",event=>{
  if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
  event.preventDefault();
  const i=internalCategories.indexOf(key),next=event.key==="Home"?0:event.key==="End"?internalCategories.length-1:(i+(event.key==="ArrowRight"?1:-1)+internalCategories.length)%internalCategories.length;
  showInternalCategory(internalCategories[next],true);
 });
}
function renderGrantedReports(){
 const box=$("reports-folders");box.replaceChildren();
 for(const item of reportGrants){
  const article=document.createElement("article");article.className="reports-folder-card";
  const h=document.createElement("h3");h.textContent=item["title_"+locale]||item.title||item.id;article.append(h);
  const p=document.createElement("p");p.textContent=item["description_"+locale]||item.description||"";article.append(p);
  // No direct static file URLs: report bytes must be served via an access-checked backend.
  box.append(article);
 }
 $("reports-empty-description").hidden=reportGrants.length>0;
}
async function loadReportGrants(user,epoch){
 reportGrants=[];renderGrantedReports();
 try{
  const grants=await getDocs(query(collection(db,"report_grants",user.uid,"items"),limit(100)));
  if(epoch!==authEpoch||auth?.currentUser?.uid!==user.uid)return;
  for(const g of grants.docs){
   if(g.data().allowed!==true)continue;
   try{
    const metadata=await getDoc(doc(db,"intelligence_reports",g.id));
    if(epoch!==authEpoch||auth?.currentUser?.uid!==user.uid)return;
    if(metadata.exists())reportGrants.push({id:g.id,...metadata.data()});
   }catch(error){console.warn("Restricted report metadata unavailable",error?.code||error);}
  }
 }catch(error){console.warn("Restricted report entitlements unavailable",error?.code||error);}
 if(epoch!==authEpoch||auth?.currentUser?.uid!==user.uid)return;
 renderGrantedReports();
}
function switchMode(next){
 mode=next;$("login-tab").classList.toggle("active",next==="login");$("signup-tab").classList.toggle("active",next==="signup");
 $("login-tab").setAttribute("aria-selected",String(next==="login"));$("signup-tab").setAttribute("aria-selected",String(next==="signup"));
 $("password-confirm-wrap").hidden=next!=="signup";$("signup-details").hidden=next!=="signup";$("auth-confirm").required=next==="signup";
 $("auth-institution").required=next==="signup";$("auth-justification").required=next==="signup";
 message("auth-error","");$("auth-password").value="";$("auth-confirm").value="";translate();
}
function displayWaiting(user,unverified,denied=false){
 show("waiting-panel");$("waiting-title").textContent=t(unverified?"unverifiedTitle":denied?"blockedTitle":"pendingTitle");
 $("waiting-text").textContent=t(unverified?"unverifiedText":denied?"blockedText":"pendingText");
 $("waiting-address").textContent=user?.email||"";
 $("resend-verification").hidden=!unverified;message("waiting-error","");message("waiting-request-status","");
 $("access-request-retry").hidden=true;
}
function docCell(row,field){
 if(["title","category","status"].includes(field))return localizedField(row,field,locale);
 const val=row[field];return typeof val==="string" ? val : "";
}
function drawRecords(){
 const search=$("record-search").value.trim().toLocaleLowerCase(locale);
 const matched=records.filter(r=>Object.values(r).some(v=>typeof v==="string"&&v.toLocaleLowerCase(locale).includes(search)));
 $("records-count").textContent=String(records.length);
 $("records-empty").hidden=matched.length>0;
 const body=$("record-rows");body.replaceChildren();
 for(const r of matched){
  const tr=document.createElement("tr");
  for(const key of ["title","category","source","status"]){
   const td=document.createElement("td");if(key==="title")appendScientific(td,localizedTitle(r,locale),r.scientific_name);else td.textContent=docCell(r,key);tr.append(td);
  }body.append(tr);
 }
}

function loadMapEngine(){
 if(window.maplibregl)return Promise.resolve();
 if(window.__nimfMapEnginePromise)return window.__nimfMapEnginePromise;
 const link=document.createElement("link");link.rel="stylesheet";
 link.href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.10.0/dist/maplibre-gl.css";
 document.head.append(link);
 const sources=[
  "https://cdn.jsdelivr.net/npm/maplibre-gl@5.10.0/dist/maplibre-gl.js",
  "https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.js"
 ];
 window.__nimfMapEnginePromise=new Promise((resolve,reject)=>{
  const next=i=>{
   if(i>=sources.length){reject(new Error("MapLibre unavailable"));return;}
   const tag=document.createElement("script");tag.src=sources[i];tag.async=true;
   tag.onload=()=>window.maplibregl?resolve():next(i+1);
   tag.onerror=()=>next(i+1);
   document.head.append(tag);
  };
  next(0);
 });
 return window.__nimfMapEnginePromise;
}
function enablePrivateWidgets(user,epoch){
 const valid=()=>epoch===authEpoch&&auth?.currentUser?.uid===user.uid&&!$("dashboard-panel").hidden;
 void (async()=>{
  try{
   const mod=await import("./explorer.js?v=restricted-period-csv-20261103");
   if(!valid())return;
   explorerModule=mod;
   mod.initExplorer(records,locale);mod.setMapPoints(pointsBuffer,aurumQuantityBuffer);
   try{
    await loadMapEngine();
    if(valid())mod.setExplorerLanguage(locale);
   }catch(e){
    if(valid())$("explorer-map-notice").textContent=t("mapError");
    console.warn("NIMF map initialization unavailable",e?.message||e);
   }
  }catch(e){
   if(valid())$("explorer-map-notice").textContent=t("explorerError");
   console.error("NIMF explorer initialization error",e);
  }
 })();
 void (async()=>{
  try{
   const mod=await import("./map-points.js?v=aurum-source-column-h-20261102");
   if(!valid())return;
   mapModule=mod;
   mod.startMapPoints(db,user,approvalAdmin,(items,quantities)=>{
    if(!valid())return;
    pointsBuffer=items;
    aurumQuantityBuffer=quantities||{};
    if(explorerModule)explorerModule.setMapPoints(items,aurumQuantityBuffer);
   },locale);
  }catch(e){console.warn("Map point review module unavailable",e?.code||e);}
 })();
 void (async()=>{
  try{
   const mod=await import("./intake.js?v=filter42");
   if(!valid())return;
   intakeModule=mod;
   await mod.openIntake(db,user,approvalAdmin,locale,tip=>mapModule?.promoteTip(tip));
  }catch(e){
   if(valid())$("tip-feedback").textContent=t("intakeError");
   console.error("NIMF intake initialization error",e);
  }
 })();
}

async function loadPrivateRecords(user,epoch){
 const snap=await getDocs(collection(db,"records"));
 if(epoch!==authEpoch||auth.currentUser?.uid!==user.uid)return;
 records=snap.docs.filter(d=>d.id!=="abelhas-org-30683").map(d=>({id:d.id,...d.data()}));
 $("account-email").textContent=user.email||"";
 $("account-role").textContent=approvalAdmin?t("roleAdmin"):t("roleContributor");
 void loadInternalReports();
 $("record-search").value="";show("dashboard-panel");switchWorkspace("dashboard");message("records-error","");drawRecords();enablePrivateWidgets(user,epoch);void loadReportGrants(user,epoch);void loadAdminApplications(user,epoch);
}
async function ensureApplication(user,epoch){
 const current=()=>epoch===authEpoch&&auth?.currentUser?.uid===user.uid
  && user.emailVerified && !$("waiting-panel").hidden;
 if(!current())return;
 const key="nimf-pending-request-"+user.uid;
 try{
  // Firestore application writes require the refreshed email_verified claim.
  await user.getIdToken(true);
  if(!current())return;
  const requestRef=doc(db,"access_requests",user.uid);
  const existing=await getDoc(requestRef);
  if(!current())return;
  if(existing.exists()){
   $("access-request-retry").hidden=true;
   try{sessionStorage.removeItem(key);}catch(e){}
   if(existing.data()?.status==="pending")message("waiting-request-status",accessStrings[locale].submitted);
   return;
  }
  let stored=null;
  try{stored=sessionStorage.getItem(key);}catch(e){}
  if(stored){
   let values=null;
   try{values=JSON.parse(stored);}catch(e){}
   const institution=String(values?.institution||"").trim();
   const justification=String(values?.justification||"").trim();
   if(institution.length>=3&&institution.length<=160&&justification.length>=20&&justification.length<=1500){
    if(!current())return;
    await setDoc(requestRef,{email:user.email,institution,justification,status:"pending",created_at:serverTimestamp(),updated_at:serverTimestamp()});
    if(!current())return;
    try{sessionStorage.removeItem(key);}catch(e){}
    $("access-request-retry").hidden=true;
    message("waiting-request-status",accessStrings[locale].submitted);
    return;
   }
  }
  // A different browser session may not retain signup details; offer a secure retry.
  $("access-request-retry").hidden=false;
  message("waiting-request-status",accessStrings[locale].needsDetails);
 }catch(e){
  console.warn("Application registration failed",e?.code||e);
  if(current()){
   $("access-request-retry").hidden=false;
   message("waiting-error",accessStrings[locale].error);
  }
 }
}
$("access-request-retry").addEventListener("submit",async e=>{
 e.preventDefault();
 const user=auth?.currentUser;
 if(!user||!user.emailVerified)return;
 const institution=$("retry-institution").value.trim(),justification=$("retry-justification").value.trim();
 if(institution.length<3||institution.length>160||justification.length<20||justification.length>1500){message("waiting-error",accessStrings[locale].error);return;}
 const button=$("retry-request-button");button.disabled=true;
 try{
  await user.getIdToken(true);
  const requestRef=doc(db,"access_requests",user.uid);
  const existing=await getDoc(requestRef);
  if(!existing.exists()){
   await setDoc(requestRef,{email:user.email,institution,justification,status:"pending",created_at:serverTimestamp(),updated_at:serverTimestamp()});
  }
  if(auth?.currentUser?.uid!==user.uid)return;
  try{sessionStorage.removeItem("nimf-pending-request-"+user.uid);}catch(e){}
  $("access-request-retry").hidden=true;
  message("waiting-error","");
  message("waiting-request-status",accessStrings[locale].submitted);
 }catch(err){message("waiting-error",accessStrings[locale].error);}
 finally{button.disabled=false;}
});
function clearAdminApplications(){
 if(stopAccessRequests){const unsubscribe=stopAccessRequests;stopAccessRequests=null;unsubscribe();}
 adminPendingRequests=null;adminRequestsError=false;adminRequestUserId=null;adminRequestEpoch=-1;adminDeepLinkFocused=false;
 $("admin-access-requests").hidden=true;
 $("admin-requests-list").replaceChildren();
 $("admin-requests-status").dataset.state="loading";
 $("admin-requests-status").textContent="";
 $("admin-requests-feedback").textContent="";
}
function adminRequestSessionValid(){
 return approvalAdmin && adminRequestUserId!==null && auth?.currentUser?.uid===adminRequestUserId
  && activeUser?.uid===adminRequestUserId && authEpoch===adminRequestEpoch
  && !$("dashboard-panel").hidden;
}
function renderAdminApplications(){
 if(!adminRequestSessionValid())return;
 const labels=accessStrings[locale],indicator=$("admin-requests-status"),container=$("admin-requests-list");
 if(adminRequestsError){
  indicator.dataset.state="error";indicator.textContent=labels.readError;container.replaceChildren();return;
 }
 if(adminPendingRequests===null){
  indicator.dataset.state="loading";indicator.textContent=labels.checking;container.replaceChildren();return;
 }
 const count=adminPendingRequests.length;
 indicator.dataset.state=count?"pending":"empty";
 indicator.textContent=count===0?labels.nonePending:count===1?labels.onePending:labels.manyPending.replace("{count}",String(count));
 container.replaceChildren();
 const deepLink=new URLSearchParams(location.search).get("request");
 for(const request of adminPendingRequests){
  const data=request.data,article=document.createElement("article");article.className="access-request-card";
  if(request.id===deepLink)article.classList.add("access-request-highlight");
  const heading=document.createElement("strong");heading.textContent=data.email||request.id;article.append(heading);
  const organization=document.createElement("p");organization.textContent=labels.institution+": "+(data.institution||"");article.append(organization);
  const purpose=document.createElement("p");purpose.textContent=labels.justification+": "+(data.justification||"");article.append(purpose);
  const button=document.createElement("button");button.type="button";button.className="secure-button";button.textContent=labels.approve;
  // Approval remains a separate, confirmed, backend-authorized operation.
  button.onclick=async()=>{
   if(!adminRequestSessionValid()||!window.confirm(accessStrings[locale].confirm))return;
   button.disabled=true;
   try{
    const token=await auth.currentUser.getIdToken(true);
    if(!adminRequestSessionValid())return;
    const endpoint="https://us-central1-"+firebaseConfig.projectId+".cloudfunctions.net/approveAccessRequest";
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({requestId:request.id})});
    if(!response.ok)throw Error("Approval failed");
    if(adminRequestSessionValid())$("admin-requests-feedback").textContent=accessStrings[locale].approved;
    // The Firestore listener removes the approved request automatically.
   }catch(err){
    if(adminRequestSessionValid())$("admin-requests-feedback").textContent=accessStrings[locale].error;
   }finally{button.disabled=false;}
  };
  article.append(button);container.append(article);
  if(request.id===deepLink&&!adminDeepLinkFocused){adminDeepLinkFocused=true;article.scrollIntoView({block:"center"});}
 }
}
function loadAdminApplications(user,epoch){
 if(!approvalAdmin)return;
 // Use a server-filtered listener without a 100-document cap; only admins can see this panel.
 clearAdminApplications();
 adminRequestUserId=user.uid;adminRequestEpoch=epoch;
 $("admin-access-requests").hidden=false;
 renderAdminApplications();
 try{
  const pendingQuery=query(collection(db,"access_requests"),where("status","==","pending"));
  stopAccessRequests=onSnapshot(pendingQuery,snapshot=>{
   if(!adminRequestSessionValid())return;
   adminRequestsError=false;
   adminPendingRequests=snapshot.docs.map(d=>({id:d.id,data:d.data()}))
    .sort((a,b)=>{
     const stamp=r=>r.data.created_at?.toMillis?.()??r.data.created_at?.seconds*1000??0;
     return stamp(b)-stamp(a);
    });
   renderAdminApplications();
  },error=>{
   if(!adminRequestSessionValid())return;
   console.warn("Live access requests unavailable",error?.code||error);
   adminRequestsError=true;adminPendingRequests=null;renderAdminApplications();
  });
 }catch(error){
  if(!adminRequestSessionValid())return;
  console.warn("Live access requests initialization failed",error?.code||error);
  adminRequestsError=true;renderAdminApplications();
 }
}
async function evaluateUser(user,epoch){
 clearAdminApplications();
 approvalAdmin=false;
 activeUser=user;records=[];reportGrants=[];if(explorerModule)explorerModule.clearExplorer();if(intakeModule)intakeModule.closeIntake();if(mapModule)mapModule.closeMapPoints();pointsBuffer=[];aurumQuantityBuffer={};
 if(!user){show("auth-panel");return;}
 if(!user.emailVerified){displayWaiting(user,true);return;}
 try{
  const approval=await getDoc(doc(db,"access",user.uid));
  if(epoch!==authEpoch||auth.currentUser?.uid!==user.uid)return;
  if(approval.exists() && approval.data().approved===true){
    approvalAdmin=approval.data().admin===true && user.email?.trim().toLowerCase()==="acarvalho@wcs.org";
   try{await loadPrivateRecords(user,epoch);}
   catch(e){if(epoch===authEpoch){displayWaiting(user,false,true);message("waiting-error",t("failedRead"));}}
  }else{
   displayWaiting(user,false);
   await ensureApplication(user,epoch);
  }
 }catch(e){if(epoch===authEpoch){displayWaiting(user,false,true);message("waiting-error",t("genericError"));}}
}
function readyConfig(){
 return ["apiKey","authDomain","projectId","appId"].every(k=>typeof firebaseConfig[k]==="string"&&firebaseConfig[k].trim()!=="");
}
function busy(value){$("submit-button").disabled=value;}
$("secure-language").addEventListener("change",e=>{locale=e.target.value;translate();});
const interfaceThemeLabels={pt:{dark:"Escuro",light:"Claro",name:"Tema da interface"},en:{dark:"Dark",light:"White",name:"Interface theme"},es:{dark:"Oscuro",light:"Claro",name:"Tema de la interfaz"}};
function refreshInterfaceThemeLabel(){
 const mode=document.body.dataset.theme==="light"?"light":"dark";
 const labels=interfaceThemeLabels[locale]||interfaceThemeLabels.pt;
 const legacy=$("secure-theme");if(legacy){legacy.textContent=mode==="dark"?labels.light:labels.dark;legacy.setAttribute("aria-label",labels.name);}
 for(const [id,value] of [["interface-theme-dark","dark"],["interface-theme-light","light"]]){
  const button=$(id);if(button){button.textContent=labels[value];button.setAttribute("aria-pressed",String(mode===value));button.classList.toggle("is-active",mode===value);}
 }
 $("secure-theme-switch")?.setAttribute("aria-label",labels.name);
}
function setInterfaceTheme(mode){if(mode!=="dark"&&mode!=="light")return;document.body.dataset.theme=mode;refreshInterfaceThemeLabel();}
$("secure-theme").addEventListener("click",()=>setInterfaceTheme(document.body.dataset.theme==="dark"?"light":"dark"));
for(const [id,mode] of [["interface-theme-dark","dark"],["interface-theme-light","light"]])$(id)?.addEventListener("click",()=>setInterfaceTheme(mode));
refreshInterfaceThemeLabel();
$("login-tab").addEventListener("click",()=>switchMode("login"));
$("signup-tab").addEventListener("click",()=>switchMode("signup"));
$("record-search").addEventListener("input",drawRecords);
function loginFeedback(error){
 const code=String(error?.code||"");
 const messages={
  pt:{"auth/invalid-credential":"E-mail ou senha incorretos.","auth/invalid-email":"Verifique o endereço de e-mail.","auth/too-many-requests":"Muitas tentativas. Aguarde antes de tentar novamente.","auth/network-request-failed":"Não foi possível conectar ao Firebase. Verifique sua conexão."},
  en:{"auth/invalid-credential":"Incorrect email or password.","auth/invalid-email":"Check the email address.","auth/too-many-requests":"Too many attempts. Try again later.","auth/network-request-failed":"Could not connect to Firebase. Check your connection."},
  es:{"auth/invalid-credential":"Correo o contraseña incorrectos.","auth/invalid-email":"Compruebe la dirección de correo.","auth/too-many-requests":"Demasiados intentos. Inténtelo más tarde.","auth/network-request-failed":"No se pudo conectar a Firebase. Compruebe su conexión."}
 };
 return messages[locale]?.[code]||t("genericError");
}
$("auth-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!auth){message("auth-error",locale==="en"?"Authentication has not initialized. Reload the page.":locale==="es"?"La autenticación no se ha inicializado. Actualice la página.":"A autenticação não inicializou. Atualize a página.");return;}
 const email=$("auth-email").value.trim(),password=$("auth-password").value;
 message("auth-error","");
 if(password.length<8){message("auth-error",t("weak"));return;}
 if(mode==="signup" && password!==$("auth-confirm").value){message("auth-error",t("mismatch"));return;}
 busy(true);
 let finished=false;
 const watchdog=setTimeout(()=>{
  if(finished)return;
  busy(false);
  message("auth-error",locale==="en"?"Sign-in is taking too long. Check your connection and reload the page before retrying.":locale==="es"?"La autenticación está tardando demasiado. Compruebe la conexión y actualice la página antes de reintentar.":"O login está demorando além do esperado. Verifique a conexão e atualize a página antes de tentar novamente.");
 },12000);
 try{
  if(mode==="signup"){
   const institution=$("auth-institution").value.trim();
   const justification=$("auth-justification").value.trim();
   if(institution.length<3||institution.length>160||justification.length<20||justification.length>1500){
    message("auth-error",accessStrings[locale].needsDetails);return;
   }
   const credential=await createUserWithEmailAndPassword(auth,email,password);
   // Keep information only for the current browser session until email verification.
   try{sessionStorage.setItem("nimf-pending-request-"+credential.user.uid,JSON.stringify({institution,justification}));}
   catch(error){console.warn("Session storage unavailable for access request",error?.name||error);}
   await sendEmailVerification(credential.user);
   $("auth-password").value="";$("auth-confirm").value="";
   displayWaiting(credential.user,true);
  }else{
   const credential=await signInWithEmailAndPassword(auth,email,password);
   const epoch=++authEpoch;
   await evaluateUser(credential.user,epoch);
  }
 }catch(error){message("auth-error",loginFeedback(error));console.warn("Firebase sign-in failed",error?.code||error);}
 finally{finished=true;clearTimeout(watchdog);busy(false);}
});
$("forgot-password").addEventListener("click",async()=>{
 if(!auth)return;const email=$("auth-email").value.trim();
 if(!email){message("auth-error",t("email"));return;}
 try{await sendPasswordResetEmail(auth,email);}catch(e){}
 message("auth-error",t("resetSent"));
});
$("refresh-access").addEventListener("click",async()=>{
 if(!auth?.currentUser)return;
 $("refresh-access").disabled=true;
 try{
  await reload(auth.currentUser);await auth.currentUser.getIdToken(true);
  const epoch=++authEpoch;await evaluateUser(auth.currentUser,epoch);
 }catch(e){message("waiting-error",t("genericError"));}
 finally{$("refresh-access").disabled=false;}
});
$("resend-verification").addEventListener("click",async()=>{
 if(!auth?.currentUser)return;
 try{await sendEmailVerification(auth.currentUser);message("waiting-error",t("resent"));}
 catch(e){message("waiting-error",t("genericError"));}
});
for(const id of ["waiting-logout","private-logout"]){
 $(id).addEventListener("click",async()=>{if(auth)await signOut(auth);});
}
// Start Firebase authentication before any nonessential interface translations.
if(!readyConfig()){show("config-panel");window.__nimfAppStarted=true;}
else{
 try{
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app);db=getFirestore(app);
  show("auth-panel");window.__nimfAppStarted=true;
  onAuthStateChanged(auth,user=>{
   const epoch=++authEpoch;
   void evaluateUser(user,epoch).catch(error=>{
    console.warn("Auth state evaluation failed",error?.code||error);
    show("auth-panel");
    message("auth-error",loginFeedback(error));
   });
  },error=>{show("auth-panel");message("auth-error",loginFeedback(error));});
 }catch(e){
  console.error("Firebase startup failed",e?.code||e);
  show("config-panel");window.__nimfAppStarted=true;
 }
}
try{translate();}catch(error){console.warn("Optional interface translation failed",error);}

/* Mobile sign-in: show institutional disclaimer and WCS identity after the login card. */
(function arrangeMobileLoginInstitutional(){
 const disclaimer=document.querySelector(".secure-side-content.secure-disclaimer");
 const institutional=document.querySelector(".secure-side-bottom");
 const authCard=document.getElementById("auth-panel");
 if(!disclaimer||!institutional||!authCard)return;
 const a=document.createComment("sidebar disclaimer location"),b=document.createComment("sidebar institutional location");
 disclaimer.before(a);institutional.before(b);
 const mq=window.matchMedia("(max-width: 920px)");
 const sync=()=>{
  const move=mq.matches && !authCard.hidden && document.body.dataset.privateReady!=="true";
  if(move){
   authCard.after(disclaimer);
   disclaimer.after(institutional);
   disclaimer.classList.add("mobile-login-disclaimer");
   institutional.classList.add("mobile-login-institutional");
  }else{
   a.after(disclaimer);b.after(institutional);
   disclaimer.classList.remove("mobile-login-disclaimer");
   institutional.classList.remove("mobile-login-institutional");
  }
 };
 mq.addEventListener("change",sync);
 new MutationObserver(sync).observe(authCard,{attributes:true,attributeFilter:["hidden"]});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:["data-private-ready"]});
 sync();
})();

/* Admin workspace: only one expanded by default, optional multi-column comparison. */
(function initializeUtilityPanels(){
 const container=document.getElementById("utility-panel-grid"),compare=document.getElementById("utility-compare");
 if(!container||!compare)return;
 const definitions=[["exchange","information-exchange-panel","utility-open-exchange"],["mine","my-contributions-panel","utility-open-mine"],["triage","admin-review","utility-open-triage"],["history","admin-history","utility-open-history"],["layers","admin-map-panel","utility-open-layers"],["records","private-records-panel","utility-open-records"]];
 const open=new Set(), nodes=definitions.map(([key,id,buttonId])=>({key,node:document.getElementById(id),button:document.getElementById(buttonId)}));
 for(const entry of nodes){
  if(!entry.node||!entry.button)continue;
  if(entry.key==="triage"||entry.key==="history"||entry.key==="layers")entry.node.dataset.adminAvailable="false";
  entry.node.dataset.collapsed="true";
  entry.node.classList.add("utility-managed");
  container.append(entry.node);
 }
 const labels={pt:{exchange:"Troca de informações",mine:"Minhas contribuições",triage:"Triagem",history:"Histórico de triagens",layers:"Cadastro de camadas",records:"Registros privados",compare:"Comparar lado a lado"},en:{exchange:"Information exchange",mine:"My contributions",triage:"Review queue",history:"Triage history",layers:"Layer administration",records:"Private records",compare:"Compare side by side"},es:{exchange:"Intercambio de información",mine:"Mis contribuciones",triage:"Revisión",history:"Historial de evaluaciones",layers:"Administrar capas",records:"Registros privados",compare:"Comparar lado a lado"}};
 const redraw=()=>{
  const lang=typeof locale==="string"&&labels[locale]?locale:"pt";
  for(const entry of nodes){
   if(!entry.node||!entry.button)continue;
   const available=entry.key==="records"||entry.key==="mine"||entry.key==="exchange"||entry.node.dataset.adminAvailable==="true";
   entry.button.hidden=!available;
   if(!available)open.delete(entry.key);
   const expanded=available&&open.has(entry.key);
   entry.button.setAttribute("aria-expanded",String(expanded));
   entry.button.classList.toggle("is-active",expanded);
   entry.node.dataset.collapsed=String(!expanded);
   entry.button.textContent=labels[lang][entry.key]+" "+(expanded?"▴":"▾");
  }
  const count=open.size;container.style.setProperty("--utility-count",String(Math.max(1,count)));
  container.classList.toggle("utility-compare-enabled",compare.checked);
  document.getElementById("utility-compare-label").textContent=labels[lang].compare;
 };
 for(const entry of nodes){
  if(!entry.node||!entry.button)continue;
  entry.button.addEventListener("click",()=>{
   if(open.has(entry.key))open.delete(entry.key);
   else{if(!compare.checked)open.clear();open.add(entry.key);}
   redraw();
  });
  if(entry.key==="triage"||entry.key==="history"||entry.key==="layers"){
   const observer=new MutationObserver(()=>{
    if(!entry.node.hidden){entry.node.dataset.adminAvailable="true";entry.node.hidden=false;}
    else if(entry.node.dataset.adminAvailable==="true"){entry.node.dataset.adminAvailable="false";open.delete(entry.key);}
    redraw();
   });
   observer.observe(entry.node,{attributes:true,attributeFilter:["hidden"]});
  }
 }
 compare.addEventListener("change",()=>{
  if(!compare.checked&&open.size>1){
   const first=[...open][open.size-1];open.clear();open.add(first);
  }
  redraw();
 });
 const observer=new MutationObserver(()=>{
  if(document.getElementById("dashboard-panel")?.hidden||document.body.dataset.privateReady!=="true"){open.clear();compare.checked=false;}
  redraw();
 });
 observer.observe(document.body,{attributes:true,attributeFilter:["data-private-ready"]});
 window.__nimfRefreshUtilityPanels=redraw;
 redraw();
})();

/* Map filters drawer: reparent the existing global controls, preserving listeners. */
(function setupMapFiltersDrawer(){
 const toggle=document.getElementById("map-filters-toggle");
 const panel=document.getElementById("map-filters-panel");
 const close=document.getElementById("map-filters-close");
 const language=document.getElementById("secure-language");
 if(!toggle||!panel||!close||!language)return;
 const labels={pt:{filter:"Filtros",heading:"Controles do mapa",lang:"Idioma",close:"Fechar filtros"},en:{filter:"Filters",heading:"Map controls",lang:"Language",close:"Close filters"},es:{filter:"Filtros",heading:"Controles del mapa",lang:"Idioma",close:"Cerrar filtros"}};
 function setOpen(open){
  const active=Boolean(open);
  panel.hidden=!active;
  panel.inert=!active;
  toggle.setAttribute("aria-expanded",String(active));
  toggle.classList.toggle("is-active",active);
 }
 const translateDrawer=()=>{
  const l=labels[locale]||labels.pt;
  document.getElementById("map-filters-toggle-label").textContent=l.filter;
  document.getElementById("map-filters-heading").textContent=l.heading;
  close.setAttribute("aria-label",l.close);close.title=l.close;
  language.setAttribute("aria-label",l.lang);
  refreshInterfaceThemeLabel();
 };
 toggle.addEventListener("click",()=>{setOpen(panel.hidden);if(!panel.hidden)document.getElementById("explorer-search")?.focus({preventScroll:true});});
 close.addEventListener("click",()=>{setOpen(false);toggle.focus({preventScroll:true});});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){setOpen(false);toggle.focus({preventScroll:true});}});
 document.addEventListener("pointerdown",e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target))setOpen(false);});
 window.__nimfMapFilterTranslate=translateDrawer;
 translateDrawer();
})();


/* Ensure a stable visual identifier when a third-party logo cannot be loaded. */
(function setupOsintBrandFallbacks(){
 const identifiers={"Wayback Machine":"WB","MarineTraffic":"MT","IMO GISIS":"IMO",
  "Global Fishing Watch":"GFW","WHOIS API":"WHO","OSINT Framework":"OS","Google Dorks":"G","CITES Trade Database":"CT","Species+":"S+","Google Lens":"GL","TinEye":"TE","OpenCorporates":"OC","ADS-B Exchange":"AD","GBIF":"GB","iNaturalist":"IN","IUCN Red List":"RL","OSIRIS":"OI","WorldCam":"WC","Radio Garden":"RG","Flightradar24":"FR","theHarvester":"TH","SecurityTrails API":"ST","BGPView":"BG","Recorded Future Vulnerability Database":"RF","Triage Malware Sandbox":"TR","Mitaka":"MI","Recorded Future Browser Extension":"RF","Have I Been Pwned":"HP","BuiltWith":"BW","Shodan":"SH","SpiderFoot (open source)":"SF","Maltego":"MA","Nmap":"NM"};
 document.querySelectorAll(".osint-tool-brand").forEach(brand=>{
  const img=brand.querySelector("img"),heading=brand.querySelector("h3");
  if(!img||!heading)return;
  const fallback=document.createElement("span");
  fallback.className="osint-logo-fallback";fallback.setAttribute("aria-hidden","true");
  fallback.textContent=identifiers[heading.textContent]||"OS";
  brand.insertBefore(fallback,heading);
  const failed=()=>brand.classList.add("osint-logo-unavailable");
  img.addEventListener("error",failed,{once:true});
  if(img.complete&&img.naturalWidth===0)failed();
 });
})();


/* Search, category filters and counts for the OSINT library. */
function normalizeOsint(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function updateOsintLibrary(){
 const strings=osintStrings[locale]||osintStrings.pt, input=$("osint-search-input"),grid=$("osint-tools-grid");
 if(!input||!grid)return;
 const query=normalizeOsint(input.value),cards=[...grid.querySelectorAll(".osint-tool-card")];
 $("osint-search-label").textContent=strings.searchLabel;
 input.placeholder=strings.searchPlaceholder;
 $("osint-reset-filters").textContent=strings.reset;
 $("osint-filter-categories").setAttribute("aria-label",strings.filtersLabel);
 let shown=0;
 for(const card of cards){
  const categories=(card.dataset.osintCategories||"").split(/\s+/);
  const haystack=(card.querySelector("h3")?.textContent||"")+" "+(card.querySelector("p")?.textContent||"");
  const visible=(osintActiveCategory==="all"||categories.includes(osintActiveCategory))&&(!query||normalizeOsint(haystack).includes(query));
  card.hidden=!visible;if(visible)shown++;
 }
 for(const button of $("osint-filter-categories").querySelectorAll("[data-osint-category]")){
  const key=button.dataset.osintCategory;
  const count=cards.filter(card=>key==="all"||(card.dataset.osintCategories||"").split(/\s+/).includes(key)).length;
  button.querySelector(".osint-category-name").textContent=strings.categories[key];
  button.querySelector(".osint-filter-count").textContent=String(count);
  button.classList.toggle("active",key===osintActiveCategory);
  button.setAttribute("aria-pressed",String(key===osintActiveCategory));
 }
 $("osint-tool-count").textContent=strings.count.replace("{shown}",shown).replace("{total}",cards.length);
 $("osint-empty").textContent=strings.empty;
 $("osint-empty").hidden=shown!==0;
}
(function setupOsintFilterEvents(){
 const group=$("osint-filter-categories"),input=$("osint-search-input"),reset=$("osint-reset-filters");
 if(!group||!input||!reset)return;
 group.addEventListener("click",event=>{
  const button=event.target.closest("button[data-osint-category]");
  if(!button||!group.contains(button))return;
  osintActiveCategory=button.dataset.osintCategory;updateOsintLibrary();
 });
 input.addEventListener("input",updateOsintLibrary);
 reset.addEventListener("click",()=>{osintActiveCategory="all";input.value="";updateOsintLibrary();input.focus({preventScroll:true});});
 updateOsintLibrary();
})();

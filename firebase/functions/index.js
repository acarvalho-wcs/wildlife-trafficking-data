"use strict";
const {onDocumentCreated}=require("firebase-functions/v2/firestore");
const {onRequest}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const admin=require("firebase-admin");
const {sendGraphMail}=require("./graph-mail");
admin.initializeApp();
const msTenant=defineSecret("NIMF_MS_TENANT_ID");
const msClient=defineSecret("NIMF_MS_CLIENT_ID");
const msSecret=defineSecret("NIMF_MS_CLIENT_SECRET");
const msSender=defineSecret("NIMF_MS_SENDER");
const ADMIN_EMAIL="acarvalho@wcs.org";
const NOTICE_EMAIL="inteligencia@wcs.org";
const APP_URL="https://acarvalho-wcs.github.io/nimf-site/secure.html";
const REGION="us-central1";
const mailSecrets=[msTenant,msClient,msSecret,msSender];

exports.notifyAccessRequest=onDocumentCreated({document:"access_requests/{uid}",region:REGION,secrets:mailSecrets,retry:false},async event=>{
 const data=event.data?.data();if(!data || data.status!=="pending")return;
 const uid=event.params.uid;
 // Notification occurs only after creation by a verified Firebase user.
 const user=await admin.auth().getUser(uid);
 if(!user.emailVerified || user.email?.toLowerCase()!==String(data.email||"").toLowerCase())return;
 const link=APP_URL+"?request="+encodeURIComponent(uid);
 await sendGraphMail({
   tenantId:msTenant.value(),clientId:msClient.value(),clientSecret:msSecret.value(),
   sender:msSender.value(),recipient:NOTICE_EMAIL,
   subject:"[Investigação de Mercados de Fauna] Nova solicitação de acesso",
   body:["Nova solicitação de acesso ao painel restrito.","","E-mail verificado: "+String(data.email||""),
     "Instituição: "+String(data.institution||""),
     "Justificativa: "+String(data.justification||""),
     "Status: Aguardando aprovação","",
     "Revisar solicitação (login administrativo obrigatório): "+link,
     "","Abrir o link não concede acesso. Confirme a decisão na plataforma."].join("\n")
 });

});

exports.approveAccessRequest=onRequest({region:REGION,cors:[/^https:\/\/acarvalho-wcs\.github\.io$/],invoker:"public",maxInstances:3},async(req,res)=>{
 if(req.method!=="POST"){res.set("Allow","POST");res.status(405).send("Method not allowed");return;}
 try{
  const header=req.headers.authorization||"";
  if(!header.startsWith("Bearer ")){res.status(401).send("Unauthorized");return;}
  const identity=await admin.auth().verifyIdToken(header.slice(7),true);
  if(!identity.email_verified || String(identity.email||"").toLowerCase()!==ADMIN_EMAIL){res.status(403).send("Forbidden");return;}
  const db=admin.firestore();
  const self=await db.collection("access").doc(identity.uid).get();
  if(!self.exists || self.data().approved!==true || self.data().admin!==true){res.status(403).send("Forbidden");return;}
  const requestId=req.body?.requestId;
  if(typeof requestId!=="string"||!/^[a-zA-Z0-9_-]{6,128}$/.test(requestId)){res.status(400).send("Invalid request");return;}
  const requestRef=db.collection("access_requests").doc(requestId);
  const accessRef=db.collection("access").doc(requestId);
  await db.runTransaction(async tx=>{
   const snapshot=await tx.get(requestRef);
   if(!snapshot.exists||snapshot.data().status!=="pending")throw new Error("Request not pending");
   const person=await admin.auth().getUser(requestId);
   if(!person.emailVerified || person.email?.toLowerCase()!==String(snapshot.data().email||"").toLowerCase())throw new Error("Email not verified");
   tx.set(accessRef,{approved:true,admin:false,email:person.email,approved_at:admin.firestore.FieldValue.serverTimestamp(),approved_by:identity.uid},{merge:true});
   tx.update(requestRef,{status:"approved",updated_at:admin.firestore.FieldValue.serverTimestamp(),reviewed_by:identity.uid});
  });
  res.status(200).json({approved:true});
 }catch(error){
  console.error("Access approval failed",error?.message);
  res.status(409).json({error:"Approval could not be completed"});
 }
});


const githubReportsToken=defineSecret("NIMF_GITHUB_READ_TOKEN");
const INTERNAL_REPORTS={
 "evolution-2026-09-21-2026-10-15":{
  pt:"Observatorio_Relatorio_Evolucao_2026-09-21_a_10-15_PT.pdf",
  en:"Observatorio_Relatorio_Evolucao_2026-09-21_a_10-15_EN.pdf",
  es:"Observatorio_Relatorio_Evolucao_2026-09-21_a_10-15_ES.pdf"
 }
};
const INTERNAL_REPORT_REPO="acarvalho-wcs/wildlife-market-intelligence";
exports.downloadInternalReport=onRequest({
 region:REGION,cors:[/^https:\/\/acarvalho-wcs\.github\.io$/],
 invoker:"public",maxInstances:3,timeoutSeconds:30,secrets:[githubReportsToken]
},async(req,res)=>{
 res.set("Cache-Control","private, no-store");
 res.set("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.set("Allow","POST");res.status(405).send("Method not allowed");return;}
 try{
  const bearer=String(req.headers.authorization||"");
  if(!bearer.startsWith("Bearer ")){res.status(401).json({error:"Authentication required"});return;}
  const identity=await admin.auth().verifyIdToken(bearer.slice(7),true);
  if(identity.email_verified!==true){res.status(403).json({error:"Email verification required"});return;}
  const permission=await admin.firestore().collection("access").doc(identity.uid).get();
  if(!permission.exists||permission.data().approved!==true){res.status(403).json({error:"Approved access required"});return;}
  const reportId=req.body?.reportId,lang=req.body?.lang;
  if(typeof reportId!=="string"||typeof lang!=="string"||
    !Object.prototype.hasOwnProperty.call(INTERNAL_REPORTS,reportId)||
    !Object.prototype.hasOwnProperty.call(INTERNAL_REPORTS[reportId],lang)){
   res.status(400).json({error:"Unknown report or language"});return;
  }
  const filename=INTERNAL_REPORTS[reportId][lang];
  const path=["reports","internal",reportId,filename].map(encodeURIComponent).join("/");
  const token=githubReportsToken.value();
  if(!token){console.error("Internal report token is unconfigured");res.status(503).json({error:"Reports temporarily unavailable"});return;}
  const url="https://api.github.com/repos/"+INTERNAL_REPORT_REPO+"/contents/"+path+"?ref=main";
  const response=await fetch(url,{
   headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"nimf-internal-reports"},
   signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){console.error("Internal report GitHub fetch failed",response.status);res.status(502).json({error:"Report temporarily unavailable"});return;}
  const payload=await response.json();
  if(payload.encoding!=="base64"||typeof payload.content!=="string"){res.status(502).json({error:"Invalid report response"});return;}
  const bytes=Buffer.from(payload.content.replace(/\\s/g,""),"base64");
  if(bytes.length>10*1024*1024||bytes.subarray(0,5).toString("ascii")!=="%PDF-"){
   res.status(502).json({error:"Invalid report format"});return;
  }
  res.set("Content-Type","application/pdf");
  res.set("Content-Disposition",'attachment; filename="'+filename+'"');
  res.status(200).send(bytes);
 }catch(error){
  console.error("Internal report delivery failed",error?.name||"error");
  res.status(503).json({error:"Report temporarily unavailable"});
 }
});

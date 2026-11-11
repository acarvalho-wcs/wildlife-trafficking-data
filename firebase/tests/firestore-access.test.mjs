import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {doc,collection,getDoc,getDocs,query,where,setDoc,updateDoc,addDoc,serverTimestamp} from "firebase/firestore";

const env=await initializeTestEnvironment({
 projectId:"demo-nimf-access-tests",
 firestore:{host:"127.0.0.1",port:8080,rules:readFileSync("firestore.rules","utf8")}
});
let count=0;
try {
 const alice=env.authenticatedContext("alice",{email_verified:true,email:"alice@example.org"});
 const bob=env.authenticatedContext("bob",{email_verified:true,email:"bob@example.org"});
 const admin=env.authenticatedContext("admin",{email_verified:true,email:"acarvalho@wcs.org"});
 const rogue=env.authenticatedContext("rogue",{email_verified:true,email:"dcarvalhoaf@gmail.com"});
 const pending=env.authenticatedContext("pending",{email_verified:true,email:"pending@example.org"});
 const anon=env.unauthenticatedContext();
 await env.withSecurityRulesDisabled(async ctx=>{
  const f=ctx.firestore();
  for(const [uid,data] of [["alice",{approved:true}],["bob",{approved:true}],["admin",{approved:true,admin:true}],["rogue",{approved:true,admin:true}],["pending",{approved:false}]]){
   await setDoc(doc(f,"access",uid),data);
  }
  await setDoc(doc(f,"records","reviewed-001"),{title:"Test market record"});
  await setDoc(doc(f,"submissions","alice-001"),{
   owner_uid:"alice",type:"platform",title:"Fictitious reference",
   url:"https://example.org/demo",species:"",location:"",details:"",
   status:"received",review_note:"",created_at:new Date(),updated_at:new Date()
  });
 });
 async function test(label,promise,allowed){
  if(allowed)await assertSucceeds(promise);else await assertFails(promise);
  count++;console.log("PASS: "+label);
 }
 await test("anonymous private record denied",getDoc(doc(anon.firestore(),"records","reviewed-001")),false);
 await test("approved user private record allowed",getDoc(doc(alice.firestore(),"records","reviewed-001")),true);
 await test("pending user record denied",getDoc(doc(pending.firestore(),"records","reviewed-001")),false);
 await test("approved browser cannot update canonical record",updateDoc(doc(alice.firestore(),"records","reviewed-001"),{title:"Tampered"}),false);
 await test("owner can read own submission",getDoc(doc(alice.firestore(),"submissions","alice-001")),true);
 await test("other approved user cannot read submission",getDoc(doc(bob.firestore(),"submissions","alice-001")),false);
 await test("owner query constrained by owner_uid is allowed",getDocs(query(collection(alice.firestore(),"submissions"),where("owner_uid","==","alice"))),true);
 await test("approved user cannot list all submissions",getDocs(collection(bob.firestore(),"submissions")),false);
 await test("accidental admin flag on another email must not confer moderation",getDoc(doc(rogue.firestore(),"submissions","alice-001")),false);
 await test("accidental admin flag cannot list other submissions",getDocs(collection(rogue.firestore(),"submissions")),false);
 await test("rogue-admin flag cannot edit someone else contribution",updateDoc(doc(rogue.firestore(),"submissions","alice-001"),{status:"investigating",updated_at:serverTimestamp()}),false);
 await test("admin can read submissions",getDoc(doc(admin.firestore(),"submissions","alice-001")),true);
 await test("admin can list all submissions",getDocs(collection(admin.firestore(),"submissions")),true);
 await test("owner cannot modify workflow status",updateDoc(doc(alice.firestore(),"submissions","alice-001"),{status:"investigating",updated_at:serverTimestamp()}),false);
 await test("admin can set triage status",updateDoc(doc(admin.firestore(),"submissions","alice-001"),{status:"triage",review_note:"Under review",updated_at:serverTimestamp()}),true);
 const valid={owner_uid:"bob",type:"group",title:"Fictitious group",url:"https://example.org/fake",
 species:"",location:"",details:"Test only",status:"received",review_note:"",created_at:serverTimestamp(),updated_at:serverTimestamp()};
 await test("approved user can submit source for review",addDoc(collection(bob.firestore(),"submissions"),valid),true);
 await test("author cannot impersonate other user",addDoc(collection(bob.firestore(),"submissions"),{...valid,owner_uid:"alice"}),false);
 await test("pending user cannot submit",addDoc(collection(pending.firestore(),"submissions"),{...valid,owner_uid:"pending"}),false);

 const fairLead={...valid,type:"fair",owner_uid:"alice",url:"",title:"Fictitious open-air market"};
 const physicalLead={...valid,type:"physical_market",owner_uid:"alice",url:"",title:"Reported market location"};
 await test("approved user may suggest a fair without URL",addDoc(collection(alice.firestore(),"submissions"),fairLead),true);
 await test("approved user may suggest physical trade without URL",addDoc(collection(alice.firestore(),"submissions"),physicalLead),true);
 await test("online listing still requires HTTPS source",addDoc(collection(alice.firestore(),"submissions"),{...valid,owner_uid:"alice",type:"advertisement",url:""}),false);

 const applicant=env.authenticatedContext("applicant",{email_verified:true,email:"applicant@example.org"});
 const applicantUnverified=env.authenticatedContext("unverified",{email_verified:false,email:"unverified@example.org"});
 const requestPayload={email:"applicant@example.org",institution:"Research Institute",
   justification:"Research and authorized conservation intelligence analysis.",status:"pending",
   created_at:serverTimestamp(),updated_at:serverTimestamp()};
 await test("verified applicant can create a request",setDoc(doc(applicant.firestore(),"access_requests","applicant"),requestPayload),true);
 await test("unverified applicant cannot submit request",setDoc(doc(applicantUnverified.firestore(),"access_requests","unverified"),{...requestPayload,email:"unverified@example.org"}),false);
 await test("requester cannot self-approve",updateDoc(doc(applicant.firestore(),"access_requests","applicant"),{status:"approved"}),false);
 await test("other regular user cannot read application",getDoc(doc(alice.firestore(),"access_requests","applicant")),false);
 await test("administrator can inspect application",getDoc(doc(admin.firestore(),"access_requests","applicant")),true);
 await test("administrator browser cannot self-approve applicant",setDoc(doc(admin.firestore(),"access","applicant"),{approved:true}),false);
 await test("anonymous cannot enumerate applications",getDocs(collection(anon.firestore(),"access_requests")),false);
 const point={layer_type:"physical_market",title:"Generic suspected market area in Manaus",
  title_pt:"Área genérica de mercado sob avaliação em Manaus",
  title_en:"Generic suspected market area in Manaus",
  title_es:"Área genérica de mercado bajo evaluación en Manaos",
  description_pt:"Localização aproximada e sem informações pessoais.",
  description_en:"Approximate location without personal information.",
  description_es:"Ubicación aproximada sin información personal.",
  scientific_name:"",country:"BR",state:"AM",municipality:"Manaus",
  latitude:-3.119,longitude:-60.0217,location_precision:"municipality",
  evidence_status:"reported",source_url:"",notes:"Aggregate location; no personal information.",
  published:false,created_at:serverTimestamp(),created_by:"admin",
  updated_at:serverTimestamp(),updated_by:"admin"};
 await test("non-admin may not create a geographic point",addDoc(collection(alice.firestore(),"map_points"),{...point,created_by:"alice",updated_by:"alice"}),false);
 await test("noninstitutional admin flag cannot create map points",setDoc(doc(rogue.firestore(),"map_points","rogue-draft"),{...point,created_by:"rogue",updated_by:"rogue"}),false);
 await test("admin may create draft location for triage",setDoc(doc(admin.firestore(),"map_points","draft-001"),point),true);
 await test("author cannot read unpublished location",getDoc(doc(alice.firestore(),"map_points","draft-001")),false);
 await test("admin can inspect unpublished location",getDoc(doc(admin.firestore(),"map_points","draft-001")),true);
 await test("admin cannot publish uncorroborated allegations",updateDoc(doc(admin.firestore(),"map_points","draft-001"),{published:true,updated_at:serverTimestamp(),updated_by:"admin"}),false);
 await test("admin cannot publish exact geographic precision",updateDoc(doc(admin.firestore(),"map_points","draft-001"),{location_precision:"street",evidence_status:"corroborated",published:true,updated_at:serverTimestamp(),updated_by:"admin"}),false);
 await test("publication requires an English title",updateDoc(doc(admin.firestore(),"map_points","draft-001"),{title_en:"",evidence_status:"corroborated",published:true,updated_at:serverTimestamp(),updated_by:"admin"}),false);
 await test("publication requires a Spanish description",updateDoc(doc(admin.firestore(),"map_points","draft-001"),{description_es:"",evidence_status:"corroborated",published:true,updated_at:serverTimestamp(),updated_by:"admin"}),false);
 await test("admin can mark a reviewed approximate point published",updateDoc(doc(admin.firestore(),"map_points","draft-001"),{evidence_status:"corroborated",published:true,updated_at:serverTimestamp(),updated_by:"admin"}),true);
 await test("approved user may read published approximate location",getDoc(doc(bob.firestore(),"map_points","draft-001")),true);
 await test("approved user can query published map points",getDocs(query(collection(bob.firestore(),"map_points"),where("published","==",true))),true);
 await test("ordinary user cannot enumerate drafts",getDocs(collection(bob.firestore(),"map_points")),false);
 await test("unapproved account cannot read published map points",getDoc(doc(pending.firestore(),"map_points","draft-001")),false);
 await test("contributor cannot alter published administrative marker",updateDoc(doc(alice.firestore(),"map_points","draft-001"),{notes:"Changed"}),false);
 await test("admin may create author-visible status history",setDoc(doc(admin.firestore(),"submissions","alice-001","history","01"),{status:"triage",note:"Verification initiated",created_at:serverTimestamp(),actor_uid:"admin"}),true);
 await test("author may read own status history",getDoc(doc(alice.firestore(),"submissions","alice-001","history","01")),true);
 await test("other contributor cannot read author's status history",getDoc(doc(bob.firestore(),"submissions","alice-001","history","01")),false);
 await test("author cannot forge status history",setDoc(doc(alice.firestore(),"submissions","alice-001","history","02"),{status:"closed",note:"No",created_at:serverTimestamp(),actor_uid:"alice"}),false);
 await test("noninstitutional flagged admin cannot forge history",setDoc(doc(rogue.firestore(),"submissions","alice-001","history","03"),{status:"closed",note:"No",created_at:serverTimestamp(),actor_uid:"rogue"}),false);
 const owner=await getDoc(doc(alice.firestore(),"submissions","alice-001"));
 assert.equal(owner.data().status,"triage");
 console.log("All "+count+" Firestore security rule assertions passed.");
}finally{await env.cleanup();}

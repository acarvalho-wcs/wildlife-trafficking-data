"use strict";
const assert=require("node:assert/strict");
const {sendGraphMail}=require("../functions/graph-mail");
(async()=>{
 const calls=[];
 const mock=async(url,options)=>{
  calls.push({url,options});
  if(url.includes("/token"))return {ok:true,status:200,json:async()=>({access_token:"test-token"})};
  return {ok:true,status:202};
 };
 const result=await sendGraphMail({tenantId:"tenant",clientId:"app",clientSecret:"secret",sender:"notices@example.org",recipient:"review@example.org",subject:"Test",body:"Example request",fetchImpl:mock});
 assert.deepEqual(result,{accepted:true});
 assert.equal(calls.length,2);
 assert.match(calls[0].options.body,/grant_type=client_credentials/);
 assert.equal(calls[1].url,"https://graph.microsoft.com/v1.0/users/notices%40example.org/sendMail");
 assert.equal(JSON.parse(calls[1].options.body).message.toRecipients[0].emailAddress.address,"review@example.org");
 await assert.rejects(()=>sendGraphMail({tenantId:"tenant",clientId:"app",clientSecret:"secret",sender:"s@example.org",recipient:"r@example.org",subject:"x",body:"x",fetchImpl:async()=>({ok:false,status:403})}),/token request failed/);
 console.log("Graph transport tests passed");
})().catch(err=>{console.error(err);process.exitCode=1});

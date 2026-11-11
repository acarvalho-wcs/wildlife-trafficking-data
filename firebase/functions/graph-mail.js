"use strict";
// Microsoft Graph application-only mail transport. Credentials stay in Firebase Secret Manager.
const TOKEN_SCOPE="https://graph.microsoft.com/.default";
async function sendGraphMail({tenantId,clientId,clientSecret,sender,recipient,subject,body,fetchImpl=fetch}) {
  if(!tenantId||!clientId||!clientSecret||!sender||!recipient)throw Error("Microsoft Graph mail is not configured");
  const params=new URLSearchParams({
    client_id:clientId,
    client_secret:clientSecret,
    grant_type:"client_credentials",
    scope:TOKEN_SCOPE
  });
  const tokenResponse=await fetchImpl("https://login.microsoftonline.com/"+encodeURIComponent(tenantId)+"/oauth2/v2.0/token",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:params.toString(),
    signal:AbortSignal.timeout(15000)
  });
  if(!tokenResponse.ok)throw Error("Microsoft identity token request failed (HTTP "+tokenResponse.status+")");
  const token=await tokenResponse.json();
  if(typeof token.access_token!=="string"||!token.access_token)throw Error("Microsoft identity token missing");
  const sendResponse=await fetchImpl("https://graph.microsoft.com/v1.0/users/"+encodeURIComponent(sender)+"/sendMail",{
    method:"POST",
    headers:{"Authorization":"Bearer "+token.access_token,"Content-Type":"application/json"},
    body:JSON.stringify({
      message:{
        subject,
        body:{contentType:"Text",content:body},
        toRecipients:[{emailAddress:{address:recipient}}]
      },
      saveToSentItems:true
    }),
    signal:AbortSignal.timeout(15000)
  });
  // HTTP 202: Graph accepted the request, not proof of mailbox delivery.
  if(sendResponse.status!==202)throw Error("Microsoft Graph sendMail failed (HTTP "+sendResponse.status+")");
  return {accepted:true};
}
module.exports={sendGraphMail};

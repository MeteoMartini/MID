/** Pure, dependency-free OAuth consent renderer; no token or network access. */
const ALLOWED=new Set(['mid-ai:read','mid-ai:infer-public']);
const fail=reason=>{const e=new Error('MID_OAUTH_'+reason);e.reason=reason;throw e;};
const text=(x,max)=>typeof x==='string'&&x.length>0&&x.length<=max;
const escape=x=>String(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
function validScopes(scopes){
 return Array.isArray(scopes)&&scopes.length>0&&scopes.length<=ALLOWED.size&&
  scopes.every(s=>typeof s==='string'&&ALLOWED.has(s))&&
  new Set(scopes).size===scopes.length;
}
export function validateMidAiConsentScopes(requested,selected){
 if(!validScopes(requested)||!validScopes(selected)||
    !requested.includes('mid-ai:read')||!selected.includes('mid-ai:read')||
    selected.some(s=>!requested.includes(s)))fail('UNREQUESTED_OR_INVALID_SCOPE');
 return Object.freeze([...selected]);
}
export function renderMidAiConsentPage(details,handle){
 if(!details||!text(details.clientName,200)||!text(details.redirectHost,255)||
    !text(handle,200)||!validScopes(details.scope)||
    !details.scope.includes('mid-ai:read')||
    (details.clientDomain!=null&&!text(details.clientDomain,255)))
   fail('INVALID_CONSENT_DESCRIPTION');
 const client=escape(details.clientName),host=escape(details.redirectHost);
 const publisher=details.clientDomain?
  'Verifizierte Client-Domain: <strong>'+escape(details.clientDomain)+'</strong>.':
  'Der angezeigte Clientname ist kein verifizierter Herausgebernachweis.';
 const loopback=details.redirectIsLoopback===true||
  /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(details.redirectHost);
 const localWarning=loopback?
  '<p><strong>Lokales Ziel:</strong> Der Zugang wird an eine Anwendung auf diesem Gerät weitergeleitet. Nur erlauben, wenn die Anmeldung selbst gestartet wurde.</p>':'';
 const read='<label><input type="checkbox" name="scope" value="mid-ai:read" checked required> Modelle und Pläne lesen</label>';
 const write=details.scope.includes('mid-ai:infer-public')?
  '<p><label><input type="checkbox" name="scope" value="mid-ai:infer-public"> Öffentliche Free-Modellanfragen nur nach separater signierter Einzelfreigabe</label></p>':'';
 return '<!doctype html><html lang="de"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>MID AI Router OAuth</title></head><body><main><h1>MID AI Router</h1>'+
  '<p>Client: <strong>'+client+'</strong></p><p>'+publisher+'</p>'+
  '<p>Zugang wird weitergeleitet an: <strong>'+host+'</strong>.</p>'+localWarning+
  '<p>Nur öffentliche, anonymisierte Anfragen. Externe Modellkosten erfordern eine separate signierte Freigabe.</p>'+
  '<form method="POST" action="/authorize">'+
  '<input type="hidden" name="handle" value="'+escape(handle)+'">'+read+write+
  '<p><button type="submit" name="decision" value="approve">Freigeben</button> '+
  '<button type="submit" name="decision" value="deny" formnovalidate>Ablehnen</button></p>'+
  '</form></main></body></html>';
}

const HTTPS_URL_LITERAL=/https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s'"`\\]*)?/g;

function sourceHttpsUrls(source){
 const urls=[];
 for(const match of String(source).matchAll(HTTPS_URL_LITERAL)){
  try{const url=new URL(match[0]);if(url.protocol==='https:'&&!url.username&&!url.password)urls.push(url)}catch{}
 }
 return urls;
}

export function sourceUsesHttpsHost(source,hostname){
 const expected=new URL(`https://${hostname}/`);
 if(expected.hostname!==String(hostname).toLowerCase()||expected.port||expected.username||expected.password)throw new Error(`Ungültiger erwarteter Host: ${hostname}`);
 return sourceHttpsUrls(source).some(url=>url.hostname===expected.hostname);
}

export function sourceUsesExactHttpsUrl(source,expectedUrl){
 const expected=new URL(expectedUrl);
 if(expected.protocol!=='https:'||expected.username||expected.password)throw new Error(`Ungültige erwartete HTTPS-URL: ${expectedUrl}`);
 return sourceHttpsUrls(source).some(url=>url.href===expected.href);
}

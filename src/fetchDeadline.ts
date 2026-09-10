export async function fetchWithDeadline(input:RequestInfo|URL,init:RequestInit={},timeoutMs=12000,timeoutMessage='Netzwerkabruf hat das Zeitlimit überschritten.'):Promise<Response>{
 const parent=init.signal??undefined,controller=new AbortController(),abort=()=>controller.abort(parent?.reason),timer=globalThis.setTimeout(()=>controller.abort(new DOMException(timeoutMessage,'TimeoutError')),timeoutMs);
 if(parent?.aborted)abort();else parent?.addEventListener('abort',abort,{once:true});
 try{return await fetch(input,{...init,signal:controller.signal})}
 finally{globalThis.clearTimeout(timer);parent?.removeEventListener('abort',abort)}
}

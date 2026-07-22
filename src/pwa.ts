let updateTimer:number|undefined;
let visibilityHandler:(()=>void)|undefined;
let focusHandler:(()=>void)|undefined;

export async function registerMidServiceWorker(){
 if(!('serviceWorker'in navigator)||!import.meta.env.PROD)return null;
 try{
  const scriptUrl=new URL('./service-worker.js',document.baseURI);
  const registration=await navigator.serviceWorker.register(scriptUrl,{scope:'./',updateViaCache:'none'});
  await registration.update().catch(()=>undefined);
  if(updateTimer)window.clearInterval(updateTimer);
  if(visibilityHandler)document.removeEventListener('visibilitychange',visibilityHandler);
  if(focusHandler)window.removeEventListener('focus',focusHandler);
  const update=()=>void registration.update().catch(()=>undefined);
  updateTimer=window.setInterval(update,15*60*1000);
  visibilityHandler=()=>{if(document.visibilityState==='visible')update()};
  focusHandler=update;
  document.addEventListener('visibilitychange',visibilityHandler);
  window.addEventListener('focus',focusHandler);
  return registration;
 }catch{return null}
}

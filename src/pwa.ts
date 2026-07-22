export async function registerMidServiceWorker(){
 if(!('serviceWorker'in navigator)||!import.meta.env.PROD)return null;
 try{
  const registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
  await registration.update().catch(()=>undefined);
  window.setInterval(()=>void registration.update(),15*60*1000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void registration.update()});
  return registration;
 }catch{return null}
}

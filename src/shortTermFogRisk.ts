export type ShortTermFogRiskPoint={
 code:number;
 visibility:number;
 temperature:number;
 dewPoint:number;
 humidity:number;
 wind:number;
 cloud:number;
 lowCloud:number;
 isDay:boolean;
 epoch:number;
 precipitation?:number;
};

export type ShortTermFogRiskResult={score:number;label:'hoch'|'erhöht'|'gering'|'kein signifikantes';reason:'Nebel / Sichteinschränkung'|'Nebelrisiko'};

function clamp(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}

/**
 * Nebelrisiko für den 24-h-Ausblick.
 * Ein kleiner T/Td-Spread allein genügt nicht: tagsüber wird ohne explizites
 * Nebel-/Sichtsignal stark gedämpft; nachts braucht die Sättigungsdiagnose
 * zusätzlich schwachen Wind. Im warmen Halbjahr wird ein bloß grenzwertiger
 * 2-K-Spread nochmals zurückgestuft.
 */
export function shortTermFogRisk(point:ShortTermFogRiskPoint):ShortTermFogRiskResult{
 const visibility=Number(point.visibility),temperature=Number(point.temperature),dewPoint=Number(point.dewPoint),humidity=clamp(Number(point.humidity)||0,0,100),windKt=Math.max(0,Number(point.wind)||0),cloud=clamp(Number(point.cloud)||0,0,100),lowCloud=clamp(Number(point.lowCloud)||0,0,100),spread=Number.isFinite(temperature)&&Number.isFinite(dewPoint)?Math.max(0,temperature-dewPoint):99,month=new Date(Number(point.epoch)||Date.now()).getUTCMonth()+1,warmSeason=month>=5&&month<=9,explicitFog=Number(point.code)===45||Number(point.code)===48,restrictedVisibility=Number.isFinite(visibility)&&visibility<=5000;
 const visibilityScore=!Number.isFinite(visibility)?0:visibility<=200?100:visibility<=1000?88:visibility<=3000?66:visibility<=5000?42:0;
 const calm=windKt<=5,veryCalm=windKt<=3,nearSaturated=humidity>=97&&spread<=.8,saturated=humidity>=95&&spread<=1.2,borderline=humidity>=92&&spread<=2;
 let saturationScore=0;
 if(!point.isDay){
  if(nearSaturated&&veryCalm)saturationScore=warmSeason?64:72;
  else if(saturated&&calm)saturationScore=warmSeason?48:58;
  else if(borderline&&veryCalm)saturationScore=warmSeason?22:32;
 }else if(nearSaturated&&veryCalm){
  // Nach Sonnenaufgang nur bei nahezu vollständiger Sättigung ein Resthinweis.
  saturationScore=warmSeason?8:14;
 }
 // Geschlossene tiefe Bewölkung ist nicht automatisch Nebel. Ohne eingeschränkte
 // Sicht wird ein reines Stratussignal daher nicht hochgestuft.
 if(!restrictedVisibility&&!explicitFog&&(cloud>=90||lowCloud>=90))saturationScore=Math.min(saturationScore,point.isDay?8:24);
 let score=explicitFog?Math.max(72,visibilityScore,saturationScore):Math.max(visibilityScore,saturationScore);
 if(point.isDay&&!explicitFog&&!restrictedVisibility)score=Math.min(score,14);
 if(warmSeason&&borderline&&!nearSaturated&&!restrictedVisibility&&!explicitFog)score=Math.min(score,point.isDay?8:22);
 score=Math.round(clamp(score,0,100));
 return{score,label:score>=60?'hoch':score>=38?'erhöht':score>=20?'gering':'kein signifikantes',reason:(explicitFog||restrictedVisibility)?'Nebel / Sichteinschränkung':'Nebelrisiko'};
}

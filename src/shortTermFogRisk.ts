import {classifyVisibilityPhenomenon,visibilityPhenomenonIsFog} from './visibilityPhenomena';

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

export type ShortTermFogRiskResult={
 score:number;
 label:'hoch'|'erhöht'|'gering'|'kein signifikantes';
 reason:string;
 kind:'fog'|'mist'|'haze'|'restricted-visibility'|'fog-risk'|'none';
};

function clamp(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}
function visibilityScore(kind:ReturnType<typeof classifyVisibilityPhenomenon>['kind'],visibility:number){
 if(visibilityPhenomenonIsFog(kind)){
  if(Number.isFinite(visibility)&&visibility<200)return 100;
  if(Number.isFinite(visibility)&&visibility<500)return 94;
  if(Number.isFinite(visibility)&&visibility<1000)return 86;
  return 56; // expliziter Bodennebel/Nebelbank kann bei VV >1 km vorkommen
 }
 if(kind==='mist'){
  if(visibility<=1500)return 56;
  if(visibility<=3000)return 46;
  if(visibility<=5000)return 36;
  return visibility<=8000?24:0;
 }
 if(kind==='haze'){
  if(visibility<=2000)return 48;
  if(visibility<=3500)return 40;
  return visibility<=5000?30:0;
 }
 if(kind==='restricted-visibility')return visibility<1000?68:30;
 return 0;
}

/**
 * Sichttrübungs-/Nebelrisiko für den 24-h-Ausblick.
 *
 * Ein angezeigtes Phänomen folgt dem WMO/DWD-Sichtvertrag. Sättigung, schwacher
 * Wind und Tageszeit dürfen zusätzlich ein zukünftiges Nebelrisiko erzeugen,
 * aber niemals bei Sicht >1 km einen bereits vorhandenen Nebel behaupten.
 */
export function shortTermFogRisk(point:ShortTermFogRiskPoint):ShortTermFogRiskResult{
 const visibility=Number(point.visibility),temperature=Number(point.temperature),dewPoint=Number(point.dewPoint),humidity=clamp(Number(point.humidity)||0,0,100),windKt=Math.max(0,Number(point.wind)||0),cloud=clamp(Number(point.cloud)||0,0,100),lowCloud=clamp(Number(point.lowCloud)||0,0,100),spread=Number.isFinite(temperature)&&Number.isFinite(dewPoint)?Math.max(0,temperature-dewPoint):99,month=new Date(Number(point.epoch)||Date.now()).getUTCMonth()+1,warmSeason=month>=5&&month<=9,specialReportedCode=[11,12,40,41].includes(Math.round(Number(point.code)));
 const phenomenon=classifyVisibilityPhenomenon({visibility,humidity,temperature,dewPoint,weatherCode:point.code,presentWeather:specialReportedCode?String(Math.round(Number(point.code))):undefined,trustPresentWeather:specialReportedCode});
 let score=visibilityScore(phenomenon.kind,visibility),reason=phenomenon.label,kind:ShortTermFogRiskResult['kind']=visibilityPhenomenonIsFog(phenomenon.kind)?'fog':phenomenon.kind==='mist'?'mist':phenomenon.kind==='haze'?'haze':phenomenon.kind==='restricted-visibility'?'restricted-visibility':'none';
 const calm=windKt<=5,veryCalm=windKt<=3,nearSaturated=humidity>=97&&spread<=.8,saturated=humidity>=95&&spread<=1.2,borderline=humidity>=92&&spread<=2;
 let saturationScore=0;
 if(kind==='none'){
  if(!point.isDay){
   if(nearSaturated&&veryCalm)saturationScore=warmSeason?64:72;
   else if(saturated&&calm)saturationScore=warmSeason?48:58;
   else if(borderline&&veryCalm)saturationScore=warmSeason?22:32;
  }else if(nearSaturated&&veryCalm)saturationScore=warmSeason?8:14;
  // Tiefer Stratus allein ist kein Nebel.
  if(cloud>=90||lowCloud>=90)saturationScore=Math.min(saturationScore,point.isDay?8:24);
  if(warmSeason&&borderline&&!nearSaturated)saturationScore=Math.min(saturationScore,point.isDay?8:22);
  if(saturationScore>score){score=saturationScore;reason='Nebelrisiko';kind='fog-risk'}
 }
 score=Math.round(clamp(score,0,100));
 if(score<20&&kind==='none')reason='Keine signifikante Sichttrübung';
 return{score,label:score>=60?'hoch':score>=38?'erhöht':score>=20?'gering':'kein signifikantes',reason,kind};
}

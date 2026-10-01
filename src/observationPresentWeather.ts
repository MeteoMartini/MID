export type ObservedPresentWeather={
  raw?:string;
  numericSynopWw?:number;
  textualPhenomenon?:string;
};

/**
 * Station present-weather values are not Open-Meteo forecast weather codes.
 * Numeric SYNOP ww values stay in their own code space and must never be
 * forwarded to forecast label/pictogram helpers as weather_code.
 */
export function parseObservedPresentWeather(value:unknown,visibilityReportPresent=false):ObservedPresentWeather{
  const raw=String(value??'').trim();
  if(!raw)return{};
  if(visibilityReportPresent)return{raw};
  if(/^\d{1,2}$/.test(raw)){
    const numericSynopWw=Number(raw);
    return Number.isInteger(numericSynopWw)&&numericSynopWw>=0&&numericSynopWw<=99?{raw,numericSynopWw}:{raw};
  }
  return{raw,textualPhenomenon:raw};
}


/**
 * Übersetzt eine vertrauenswürdige Stationsmeldung bewusst aus dem SYNOP-/METAR-
 * Beobachtungsraum in den kanonischen MID/WMO-Prognosecode. Numerische ww-Werte
 * werden dabei nicht blind weitergereicht, sondern explizit auf die in MID
 * unterstützten Niederschlagsklassen abgebildet.
 */
export function observedPrecipitationForecastCode(value:unknown):number|undefined{
 const raw=String(value??'').trim().toUpperCase();if(!raw)return undefined;
 const numeric=/^(?:WW)?(\d{1,2})$/.exec(raw);
 if(numeric){
  const ww=Number(numeric[1]),map:Record<number,number>={
   50:51,51:51,52:53,53:53,54:55,55:55,56:56,57:57,
   58:61,59:63,60:61,61:61,62:63,63:63,64:65,65:65,66:66,67:67,
   68:68,69:69,70:71,71:71,72:73,73:73,74:75,75:75,76:76,77:77,78:78,79:79,
   80:80,81:81,82:82,83:83,84:84,85:85,86:86,87:87,88:88,89:89,90:90,
   91:91,92:92,93:93,94:94,95:95,96:96,97:97,99:99
  };
  return map[ww];
 }
 const token=raw.replace(/\s+/g,''),light=token.startsWith('-'),heavy=token.startsWith('+'),code=(light||heavy)?token.slice(1):token,has=(part:string)=>code.includes(part);
 if(has('TS')&&(has('GR')||has('GS')))return heavy?99:96;
 if(has('TS'))return heavy?97:95;
 if(has('SH')&&has('GR'))return light?89:90;
 if(has('SH')&&has('GS'))return light?87:88;
 if(has('SH')&&((has('RA')&&has('SN'))||has('RASN')))return light?83:84;
 if(has('SH')&&has('SN'))return light?85:86;
 if(has('SH')&&has('RA'))return light?80:heavy?82:81;
 if(has('FZDZ'))return light?56:57;
 if(has('FZRA'))return light?66:67;
 if((has('RA')&&has('SN'))||has('RASN'))return light?68:69;
 if(has('DZ'))return light?51:heavy?55:53;
 if(has('RA'))return light?61:heavy?65:63;
 if(has('SN'))return light?71:heavy?75:73;
 if(has('SG'))return 77;
 if(has('IC'))return 76;
 if(has('PL'))return 79;
 return undefined;
}

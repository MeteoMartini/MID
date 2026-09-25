import {classifyVisibilityPhenomenon} from './visibilityPhenomena';
export type HyperlocalSkyCondition={code:number;label:string;cloudOktas?:number};

type HyperlocalSkyInput={
 fallbackCode:number;
 cloudCover?:number;
 visibility?:number;
 humidity?:number;
 temperature?:number;
 dewPoint?:number;
 cloudObserved:boolean;
 visibilityObserved:boolean;
};

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function skyLabelFromOktas(oktas:number){if(oktas===0)return'Wolkenlos';if(oktas<=2)return'Gering bewölkt';if(oktas<=4)return'Aufgelockert bewölkt';if(oktas<=7)return'Stark bewölkt';return'Bedeckt'}

export function cloudCoverSkyCondition(value:unknown):HyperlocalSkyCondition|undefined{
 const cloud=finite(value);if(cloud===undefined||cloud<0||cloud>100)return undefined;
 const cloudOktas=Math.max(0,Math.min(8,Math.round(cloud/12.5))),code=cloudOktas===0?0:cloudOktas<=2?1:cloudOktas<=4?2:3;
 return{code,label:skyLabelFromOktas(cloudOktas),cloudOktas};
}

export function modelCloudSkyCondition(modelCode:unknown,modelCloudCover:unknown):HyperlocalSkyCondition|undefined{
 const code=finite(modelCode);if(code===undefined||code<0||code>3)return undefined;
 return cloudCoverSkyCondition(modelCloudCover);
}

export function synopPresentWeatherNumber(value:unknown):number|undefined{
 if(value===null||value===undefined)return undefined;
 const match=/^(?:WW\s*[=:]?\s*)?(\d{1,2})$/i.exec(String(value).trim());
 return match?Number(match[1]):undefined;
}

export function synopPresentWeatherPhenomenon(value:unknown):string|undefined{
 const ww=synopPresentWeatherNumber(value);if(ww===undefined||ww<=3)return undefined;
 if(ww===4)return'FU';
 if(ww===6)return'DU';
 if(ww===7||ww===8||ww===9)return'SA';
 if(ww===13||ww===17)return'TS';
 if(ww===14||ww===15||ww===16)return'RA';
 if(ww===18)return'SQ';
 if(ww===19)return'FC';
 if(ww>=30&&ww<=35)return'DU';
 if(ww>=36&&ww<=39)return'SN';
 if(ww>=50&&ww<=55)return'DZ';
 if(ww===56||ww===57)return'FZDZ';
 if(ww===58)return'DZ';
 if(ww===59)return'RASN';
 if(ww>=60&&ww<=65)return'RA';
 if(ww===66||ww===67)return'FZRA';
 if(ww===68||ww===69)return'RASN';
 if(ww>=70&&ww<=75)return'SN';
 if(ww===76)return'IC';
 if(ww===77)return'SG';
 if(ww===78)return'SN';
 if(ww===79)return'PL';
 if(ww>=80&&ww<=82)return'SHRA';
 if(ww===83||ww===84)return'SHRASN';
 if(ww===85||ww===86)return'SHSN';
 if(ww===87)return'SHGS';
 if(ww===88)return'SHGR';
 if(ww===89||ww===90)return'SHGR';
 if(ww===91||ww===92)return'TSRA';
 if(ww===93||ww===94)return'TSSN';
 if(ww===95)return'TSRA';
 if(ww===96)return'TSGS';
 if(ww===97||ww===99)return'TSGR';
 if(ww===98)return'TS';
 return undefined;
}

/**
 * Leitet den sichtbaren aktuellen Himmelszustand ausschließlich aus frischen
 * lokal analysierten Beobachtungsfeldern ab. Niederschlag wird außerhalb
 * dieser Funktion priorisiert; Nebel kann bei belastbarer lokaler Sichtweite
 * den reinen Bewölkungszustand übersteuern.
 */
export function hyperlocalSkyCondition(input:HyperlocalSkyInput):HyperlocalSkyCondition|undefined{
 const fallbackCode=Math.round(Number(input.fallbackCode)||0),cloud=finite(input.cloudCover),visibility=finite(input.visibility),humidity=finite(input.humidity),temperature=finite(input.temperature),dewPoint=finite(input.dewPoint);
 if(input.visibilityObserved&&visibility!==undefined){const phenomenon=classifyVisibilityPhenomenon({weatherCode:fallbackCode,visibility,humidity,temperature,dewPoint});if(phenomenon.displayCode!==undefined)return{code:phenomenon.displayCode,label:phenomenon.label}}
 if(!input.cloudObserved||cloud===undefined)return undefined;
 return cloudCoverSkyCondition(cloud);
}

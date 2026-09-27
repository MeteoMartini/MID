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
function skyLabelFromOktas(oktas:number){if(oktas===0)return'Wolkenlos';if(oktas<=2)return'Gering bewölkt';if(oktas<=4)return'Aufgelockert bewölkt';if(oktas<=7)return'Stark bewölkt';return'Bedeckt'}\nexport function analysedCloudOktas(percent:number){const bounded=Math.max(0,Math.min(100,percent));if(bounded<=0)return 0;if(bounded>=100)return 8;return Math.max(1,Math.min(7,Math.round(bounded/12.5)))}

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
 // Der hyperlokale Wert kann ein kontinuierlicher Modell-/Stations-Fusionswert sein.\n // DWD 8/8 bedeutet eine vollständig geschlossene Wolkendecke; ein Wert knapp unter\n // 100 % darf deshalb nicht durch Rundung als diskrete 8/8-Beobachtung erscheinen.\n const oktas=analysedCloudOktas(cloud),code=oktas===0?0:oktas<=2?1:oktas<=4?2:3;
 return{code:Number.isFinite(code)?code:fallbackCode,label:skyLabelFromOktas(oktas),cloudOktas:oktas};
}

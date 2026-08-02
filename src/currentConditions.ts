export type HyperlocalSkyCondition={code:number;label:string;cloudOktas?:number};

type HyperlocalSkyInput={
 fallbackCode:number;
 cloudCover?:number;
 visibility?:number;
 humidity?:number;
 temperature?:number;
 cloudObserved:boolean;
 visibilityObserved:boolean;
};

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function skyLabelFromOktas(oktas:number){if(oktas===0)return'Wolkenlos';if(oktas<=2)return'Gering bewölkt';if(oktas<=4)return'Aufgelockert bewölkt';if(oktas<=7)return'Stark bewölkt';return'Bedeckt'}

/**
 * Leitet den sichtbaren aktuellen Himmelszustand ausschließlich aus frischen
 * lokal analysierten Beobachtungsfeldern ab. Niederschlag wird außerhalb
 * dieser Funktion priorisiert; Nebel kann bei belastbarer lokaler Sichtweite
 * den reinen Bewölkungszustand übersteuern.
 */
export function hyperlocalSkyCondition(input:HyperlocalSkyInput):HyperlocalSkyCondition|undefined{
 const fallbackCode=Math.round(Number(input.fallbackCode)||0),cloud=finite(input.cloudCover),visibility=finite(input.visibility),humidity=finite(input.humidity),temperature=finite(input.temperature);
 if(input.visibilityObserved&&visibility!==undefined&&visibility<=1000&&humidity!==undefined&&humidity>=92){const code=temperature!==undefined&&temperature<=0?48:45;return{code,label:code===48?'Reifnebel':'Nebel'}}
 if(!input.cloudObserved||cloud===undefined)return undefined;
 const oktas=Math.max(0,Math.min(8,Math.round(cloud/12.5))),code=oktas===0?0:oktas<=2?1:oktas<=4?2:3;
 return{code:Number.isFinite(code)?code:fallbackCode,label:skyLabelFromOktas(oktas),cloudOktas:oktas};
}

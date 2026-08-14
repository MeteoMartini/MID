export type ThermalSiteClass='urban'|'suburban'|'rural'|'unknown';

export type StableNightThermalSample={
 distanceKm:number;
 observedTemperature:number;
 backgroundTemperature:number;
 relevance:number;
 siteCompatibility:number;
 morphologyCompatibility:number;
 aviation:boolean;
};

export type StableNightThermalRegime={
 active:boolean;
 strength:number;
 localizationKm:number;
 observationSpreadK:number;
 residualSpreadK:number;
 windKt?:number;
 cloudCover?:number;
 sampleCount:number;
};

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function robustSpan(values:number[]){
 const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
 if(sorted.length<2)return 0;
 if(sorted.length<4)return sorted.at(-1)!-sorted[0];
 const percentile=(p:number)=>{const index=(sorted.length-1)*p,low=Math.floor(index),high=Math.ceil(index),fraction=index-low;return low===high?sorted[low]:sorted[low]*(1-fraction)+sorted[high]*fraction};
 return percentile(.85)-percentile(.15);
}

/**
 * Erkennt ausschließlich aus vorhandenen Beobachtungen und dem lokalen Modellhintergrund,
 * ob die 2-m-Temperatur nachts räumlich enger als üblich behandelt werden muss.
 * Es wird bewusst keine pauschale Nachtkorrektur erzeugt: Die Funktion entscheidet nur,
 * wie lokal die beobachteten Modellresiduen gewichtet werden sollen.
 */
export function detectStableNightThermalRegime(input:{isDay?:number;windKt?:number;cloudCover?:number;samples:StableNightThermalSample[]}):StableNightThermalRegime{
 const wind=Number(input.windKt),cloud=Number(input.cloudCover),isNight=Number.isFinite(Number(input.isDay))&&Number(input.isDay)<.5;
 const samples=input.samples.filter(sample=>Number.isFinite(sample.observedTemperature)&&Number.isFinite(sample.backgroundTemperature)&&Number.isFinite(sample.distanceKm)&&sample.distanceKm<=35&&sample.relevance>=.06);
 const observationSpreadK=robustSpan(samples.map(sample=>sample.observedTemperature)),residualSpreadK=robustSpan(samples.map(sample=>sample.observedTemperature-sample.backgroundTemperature)),thermalSpread=Math.max(observationSpreadK,residualSpreadK);
 const weakWind=Number.isFinite(wind)&&wind<=6.5,cloudCompatible=!Number.isFinite(cloud)||cloud<=78,spreadSupport=samples.length>=2&&thermalSpread>=1.35;
 const active=isNight&&weakWind&&cloudCompatible&&spreadSupport;
 if(!active)return{active:false,strength:0,localizationKm:18,observationSpreadK,residualSpreadK,windKt:Number.isFinite(wind)?wind:undefined,cloudCover:Number.isFinite(cloud)?cloud:undefined,sampleCount:samples.length};
 const calmSignal=clamp((6.5-wind)/5.5,0,1),clearSignal=Number.isFinite(cloud)?clamp((78-cloud)/78,0,1):.45,spreadSignal=clamp((thermalSpread-1.35)/2.65,0,1),strength=clamp(.38+.32*calmSignal+.12*clearSignal+.28*spreadSignal,.38,1),localizationKm=clamp(11.5-4.8*strength,6.7,9.7);
 return{active:true,strength,localizationKm,observationSpreadK,residualSpreadK,windKt:wind,cloudCover:Number.isFinite(cloud)?cloud:undefined,sampleCount:samples.length};
}

/**
 * Zusatzgewicht für die Temperatur-Restfeldanalyse in stabilen Nächten. Entfernte,
 * thermisch unähnliche Messpunkte werden stärker gedämpft; eine nahe geeignete Station
 * kann dagegen leicht gestärkt werden. Der Faktor enthält keinen festen Temperatur-Offset.
 */
export function stableNightThermalWeightFactor(sample:StableNightThermalSample,regime:StableNightThermalRegime,targetSite:ThermalSiteClass):number{
 if(!regime.active)return 1;
 const distance=Math.max(0,Number(sample.distanceKm)),radius=Math.max(5,regime.localizationKm),locality=.18+1.10*Math.exp(-Math.pow(distance/radius,1.55)),site=Math.pow(clamp(sample.siteCompatibility,.2,1.2),.55*regime.strength),morphology=Math.pow(clamp(sample.morphologyCompatibility,.1,1),.72*regime.strength),aviationPenalty=sample.aviation&&distance>7&&targetSite!=='rural'?1-.45*regime.strength:1;
 return clamp(locality*site*morphology*aviationPenalty,.08,1.35);
}

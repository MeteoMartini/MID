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


export type DirectTemperatureConstraintSample={
 temperature:number;
 weight:number;
 distanceKm:number;
 ageMinutes:number;
 aviation?:boolean;
};

export type DirectTemperatureConstraint={
 value?:number;
 correction:number;
 estimate?:number;
 applied:boolean;
 strength:number;
 sampleCount:number;
 effectiveN:number;
 weightedDistanceKm?:number;
 weightedAgeMinutes?:number;
 spreadK:number;
 acceptedIndexes:number[];
};

function medianValue(values:number[]){
 const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
 if(!sorted.length)return Number.NaN;
 const middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}

/**
 * Ergänzende direkte Beobachtungs-Stütze für 2-m-Temperatur.
 *
 * Die normale MID-Hyperlokalisierung arbeitet absichtlich mit Modellresiduen. Das ist
 * meteorologisch meist die sauberste Methode, kann aber einen Fehler im räumlichen
 * Modellgradienten am Zielpunkt nicht erkennen: Liegt das Modell an allen Stationen
 * nahe an deren Messungen, am Zielpunkt selbst aber zu warm/kalt, wäre das gemittelte
 * Residuum nahezu null. Diese Funktion darf in genau diesem Sonderfall einen robusten,
 * frischen und räumlich nahen Stationskonsens begrenzt auf den Zielwert zurückführen.
 *
 * Ein einzelner Flughafen oder eine einzelne Privatstation reicht ausdrücklich nicht.
 * Die Funktion erzeugt auch keinen pauschalen Nachtabschlag; Richtung und Höhe der
 * Zusatzkorrektur kommen ausschließlich aus den tatsächlichen Messungen.
 */
export function constrainTemperatureWithDirectObservations(input:{
 modelTarget?:number;
 residualValue?:number;
 isDay?:number;
 windKt?:number;
 samples:DirectTemperatureConstraintSample[];
}):DirectTemperatureConstraint{
 const model=Number(input.modelTarget),residual=Number(input.residualValue),isNight=Number.isFinite(Number(input.isDay))&&Number(input.isDay)<.5,wind=Number(input.windKt);
 const empty:DirectTemperatureConstraint={value:Number.isFinite(residual)?residual:undefined,correction:0,applied:false,strength:0,sampleCount:0,effectiveN:0,spreadK:0,acceptedIndexes:[]};
 if(!Number.isFinite(model)||!Number.isFinite(residual))return empty;
 const rows=input.samples.map((sample,index)=>({index,temperature:Number(sample.temperature),weight:Math.max(0,Number(sample.weight)||0),distanceKm:Math.max(0,Number(sample.distanceKm)||0),ageMinutes:Math.max(0,Number(sample.ageMinutes)||0),aviation:Boolean(sample.aviation)})).filter(row=>Number.isFinite(row.temperature)&&row.weight>.0001&&row.distanceKm<45&&row.ageMinutes<75);
 if(rows.length<2)return{...empty,sampleCount:rows.length};
 const med=medianValue(rows.map(row=>row.temperature)),mad=medianValue(rows.map(row=>Math.abs(row.temperature-med))),robustLimit=Math.max(1.35,Number.isFinite(mad)?mad*3.7:0),robust=rows.filter(row=>Math.abs(row.temperature-med)<=robustLimit),use=robust.length>=2?robust:rows;
 const sum=use.reduce((total,row)=>total+row.weight,0);if(sum<=0)return{...empty,sampleCount:use.length};
 const estimate=use.reduce((total,row)=>total+row.temperature*row.weight,0)/sum,effectiveN=sum*sum/Math.max(.0001,use.reduce((total,row)=>total+row.weight*row.weight,0)),variance=use.reduce((total,row)=>total+(row.temperature-estimate)**2*row.weight,0)/sum,spreadK=Math.sqrt(Math.max(0,variance)),spanK=robustSpan(use.map(row=>row.temperature)),weightedDistanceKm=use.reduce((total,row)=>total+row.distanceKm*row.weight,0)/sum,weightedAgeMinutes=use.reduce((total,row)=>total+row.ageMinutes*row.weight,0)/sum,acceptedIndexes=use.map(row=>row.index),sampleCount=use.length;
 const base={...empty,estimate,sampleCount,effectiveN,weightedDistanceKm,weightedAgeMinutes,spreadK,acceptedIndexes};
 // Mindestens zwei voneinander bereits deduplizierte Messorte mit realer effektiver
 // Stützung. Weit verteilte, alte oder stark widersprüchliche Messungen bleiben Diagnose.
 if(sampleCount<2||effectiveN<1.35||weightedDistanceKm>25||weightedAgeMinutes>48||spreadK>2.6||spanK>3.5)return base;
 const gap=estimate-residual,threshold=isNight?.70:.95;if(Math.abs(gap)<threshold)return base;
 const supportN=clamp((effectiveN-1.25)/1.9,0,1),supportDistance=clamp((27-weightedDistanceKm)/20,0,1),supportAge=clamp((50-weightedAgeMinutes)/38,0,1),coherence=clamp(1-spreadK/3,0,1),calm=Number.isFinite(wind)?clamp((8-wind)/7,0,1):.35,nightBonus=isNight?.12:0,evidence=clamp(.34*supportN+.24*supportDistance+.18*supportAge+.24*coherence,0,1),largeGradientSignal=clamp((Math.abs(gap)-1.45)/3.55,0,1),rawStrength=.22+.24*supportN+.18*supportDistance+.12*supportAge+.12*coherence+nightBonus+(isNight?.08*calm:.03*calm)+largeGradientSignal*evidence*(isNight?.16:.09),strength=clamp(rawStrength,isNight?.24:.20,isNight?.88:.64);
 // Die Korrekturgrenze wächst nur dann deutlich, wenn mehrere frische, nahe und
 // kohärente Messpunkte gemeinsam einen großen Zielpunkt-Gradientenfehler stützen.
 // Damit bleibt der Schutz bei schwacher Evidenz praktisch auf dem bisherigen Niveau,
 // während ein klarer Mehrstationskonsens mehrere Kelvin korrigieren darf. Selbst bei
 // sehr starker Evidenz wird der Messkonsens nicht vollständig übernommen.
 const adaptiveEligibility=clamp((Math.min(supportN,supportDistance,supportAge,coherence)-.18)/.62,0,1),baseCap=isNight?(Number.isFinite(wind)&&wind<=6.5?1.8:1.55):1.15,adaptiveExtra=(isNight?3.05:1.85)*Math.pow(evidence,1.45)*Math.pow(adaptiveEligibility,1.25)*largeGradientSignal*(isNight?(.78+.22*calm):1),evidenceCap=baseCap+adaptiveExtra,closureCap=Math.abs(gap)*(isNight?(.72+.14*evidence):(.58+.10*evidence)),maxCorrection=Math.max(baseCap,Math.min(isNight?4.65:3.0,evidenceCap,closureCap)),correction=clamp(gap*strength,-maxCorrection,maxCorrection),value=residual+correction;
 if(Math.abs(correction)<.15)return{...base,strength};
 return{...base,value,correction,applied:true,strength};
}

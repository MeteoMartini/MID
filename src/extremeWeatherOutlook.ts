import {fetchWorkerJson} from './workerClient';

export type ExtremeHazardKind='thunderstorm'|'rain'|'wind'|'snow'|'ice';
export type ExtremeHazardId='overall'|ExtremeHazardKind;

export type ExtremeOutlookSignal={
 intensity:1|2|3|4;
 intensityLabel:string;
 probability:number;
 probabilityBand:'P0'|'P1'|'P2'|'P3'|'P4';
 drivers:string[];
 subhazards:string[];
 metrics:Record<string,number|string|undefined>;
};

export type ExtremeOutlookCellPeriod={
 hazards:Partial<Record<ExtremeHazardKind,ExtremeOutlookSignal>>;
 dominant?:ExtremeHazardKind;
};

export type ExtremeOutlookCell={
 id:string;
 row:number;
 col:number;
 lat:number;
 lon:number;
 region:string;
 elevationM:number;
 periods:Record<string,ExtremeOutlookCellPeriod>;
};

export type ExtremeOutlookPeriod={
 id:string;
 label:string;
 startHour:number;
 endHour:number;
 start:string;
 end:string;
};

export type ExtremeOutlookThresholds={
 probability:{bands:Array<{id:string;min:number;max:number;label:string}>;overviewMin:number;hazardMin:number;extremeExceptionMin:number};
 intensity:{levels:Array<{id:number;label:string}>};
 rain:{unit:string;windows:number[];levels:Array<{intensity:number;values:Record<string,number>}>};
 wind:{unit:string;terrainBands:Array<{id:string;label:string;maxElevationM:number|null;levels:number[]}>};
 snow:{unit:string;windows:number[];terrainMultipliers:Record<string,number>;levels:Array<{intensity:number;values:Record<string,number>}>};
 ice:{unit:string;levels:Array<{intensity:number;value:number;durationHours?:number}>};
 thunderstorm:{capeJkg:number[];lapseRateKkm:number[];shearMs:number[];hailCm:number[];note:string};
};

export type ExtremeWeatherOutlook={
 scope:'DACH';
 provider:string;
 model:string;
 modelRun?:string;
 checkedAt:string;
 version?:string;
 stale?:boolean;
 staleReason?:string;
 officialWarning:false;
 periods:ExtremeOutlookPeriod[];
 cells:ExtremeOutlookCell[];
 grid:{rows:number;cols:number;latStep:number;lonStep:number;pointCount:number;bounds:{south:number;west:number;north:number;east:number}};
 thresholds:ExtremeOutlookThresholds;
 quality:{ensembleMembers:number;probabilityMethod:string;modelResolution:string;displayGrid:string;diagnosticCoveragePct:number;limitations:string[]};
 error?:string;
};

export type ResolvedExtremeSignal=ExtremeOutlookSignal&{hazard:ExtremeHazardKind};

export const EXTREME_HAZARDS:Array<{id:ExtremeHazardId;label:string;shortLabel:string;description:string}>=[
 {id:'overall',label:'Gesamtlage',shortLabel:'Gesamt',description:'Je Rasterfeld das stärkste Signal'},
 {id:'thunderstorm',label:'Gewitter',shortLabel:'Gewitter',description:'Konvektion, Hagel, Downburst und Gewitterregen'},
 {id:'rain',label:'Stark-/Dauerregen',shortLabel:'Regen',description:'1-, 6- und 24-Stunden-Niederschlag'},
 {id:'wind',label:'Sturm',shortLabel:'Sturm',description:'Böen mit höhenabhängiger Exposition'},
 {id:'snow',label:'Schnee',shortLabel:'Schnee',description:'Neuschnee in 6 und 24 Stunden'},
 {id:'ice',label:'Glätte/Eisregen',shortLabel:'Eisregen',description:'Gefrierender Niederschlag und Glatteiswirkung'}
];

export const EXTREME_INTENSITY_COLORS:Record<1|2|3|4,string>={1:'#269b83',2:'#e7b92f',3:'#e87824',4:'#bd2340'};
export const EXTREME_INTENSITY_LABELS:Record<1|2|3|4,string>={1:'markant',2:'stark',3:'schwer',4:'extrem'};

export function loadExtremeWeatherOutlook(signal?:AbortSignal){
 return fetchWorkerJson<ExtremeWeatherOutlook>('dach-extreme-outlook',{}, {purpose:'general',signal,timeoutMs:48000,maxAgeMs:10*60*1000,staleIfErrorMs:2*60*60*1000,cacheKey:'dach-extreme-outlook:v1'});
}

export function extremeSignalForCell(cell:ExtremeOutlookCell,periodId:string,hazard:ExtremeHazardId):ResolvedExtremeSignal|null{
 const period=cell.periods?.[periodId];if(!period)return null;
 if(hazard!=='overall'){const signal=period.hazards?.[hazard];return signal?{...signal,hazard}:null}
 const entries=Object.entries(period.hazards||{}) as Array<[ExtremeHazardKind,ExtremeOutlookSignal]>;
 const selected=entries.sort((a,b)=>b[1].intensity-a[1].intensity||b[1].probability-a[1].probability)[0];
 return selected?{...selected[1],hazard:selected[0]}:null;
}

export function extremeSignalVisible(signal:ResolvedExtremeSignal|null,hazard:ExtremeHazardId,thresholds:ExtremeOutlookThresholds){
 if(!signal)return false;
 const minimum=hazard==='overall'?thresholds.probability.overviewMin:thresholds.probability.hazardMin;
 return signal.probability>=minimum||signal.intensity===4&&signal.probability>=thresholds.probability.extremeExceptionMin;
}

export function extremeProbabilityOpacity(probability:number){return probability>=80?.82:probability>=60?.7:probability>=30?.54:probability>=10?.4:.3}

export function strongestExtremeRegions(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId,limit=8){
 const regions=new Map<string,{cell:ExtremeOutlookCell;signal:ResolvedExtremeSignal}>();
 for(const cell of data.cells){const signal=extremeSignalForCell(cell,periodId,hazard);if(!extremeSignalVisible(signal,hazard,data.thresholds)||!signal)continue;const current=regions.get(cell.region);if(!current||signal.intensity>current.signal.intensity||signal.intensity===current.signal.intensity&&signal.probability>current.signal.probability)regions.set(cell.region,{cell,signal})}
 return [...regions.values()].sort((a,b)=>b.signal.intensity-a.signal.intensity||b.signal.probability-a.signal.probability).slice(0,limit);
}

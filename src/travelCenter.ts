import type {Location} from './weather';
import type {TravelPreference,TravelWaterClimatology,TravelWindowResult} from './travelPlanner';
import type {TravelForecastSourceStatus} from './travelForecastFusion';
import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';

export type TravelPlannerMode='fixed'|'flexible';
export type TravelAnalysisSnapshot={
 windows:TravelWindowResult[];
 snowDepthIncluded:boolean;
 snowDepthWarning?:string;
 referencePeriod:string;
 source:string;
 /** Optional source-mix metadata; populated by the forecast/climatology fusion when available. */
 sourceMode?:string;
 sourceDetail?:string;
 modelSharePct?:number;
 modelFamilyCount?:number;
 modelCoveredDays?:number;
 modelSources?:string[];
 sourceStatuses?:TravelForecastSourceStatus[];
 sourceWarnings?:string[];
};
export type TravelConstraintInputs={
 minAvgMax:string;
 maxAvgMax:string;
 maxWetDays:string;
 minSunHours:string;
 maxWind:string;
 minSnowDepth:string;
};
export type TravelCenterRecord={
 id:string;
 title:string;
 location:Location;
 mode:TravelPlannerMode;
 start:string;
 end:string;
 tripDays:number;
 alternativeGapDays:number;
 preference:TravelPreference;
 constraintInputs:TravelConstraintInputs;
 activeIndex:number;
 createdAt:number;
 updatedAt:number;
 lastOpenedAt:number;
 analysis:TravelAnalysisSnapshot;
 waterInfo:TravelWaterClimatology|null;
};

export const TRAVEL_CENTER_STORAGE_KEY='mid:travel-center:v1';
export const TRAVEL_CENTER_UPDATED_EVENT='mid:travel-center-updated';
const MAX_TRAVEL_CENTER_RECORDS=24;

function isObject(value:unknown):value is Record<string,unknown>{return Boolean(value&&typeof value==='object'&&!Array.isArray(value))}
function finiteNumber(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function text(value:unknown){return typeof value==='string'?value:''}
function validDate(value:unknown){const string=text(value);return /^\d{4}-\d{2}-\d{2}$/.test(string)?string:''}
function clampIndex(value:unknown,length:number){return Math.max(0,Math.min(Math.max(0,length-1),Math.round(finiteNumber(value,0))))}

function sanitizeRecord(value:unknown):TravelCenterRecord|null{
 if(!isObject(value)||!isObject(value.location)||!isObject(value.analysis)||!Array.isArray(value.analysis.windows)||!value.analysis.windows.length)return null;
 const location=value.location as unknown as Location,start=validDate(value.start),end=validDate(value.end);if(!start||!end||!text(location.name))return null;
 const preference=text(value.preference) as TravelPreference,mode=value.mode==='flexible'?'flexible':'fixed',analysis=value.analysis as unknown as TravelAnalysisSnapshot,constraintInputs=isObject(value.constraintInputs)?value.constraintInputs:{};
 const createdAt=finiteNumber(value.createdAt,Date.now()),updatedAt=finiteNumber(value.updatedAt,createdAt),lastOpenedAt=finiteNumber(value.lastOpenedAt,updatedAt),id=text(value.id)||`travel-${createdAt}`;
 return{id,title:text(value.title)||text(location.name),location,mode,start,end,tripDays:Math.max(2,Math.min(42,Math.round(finiteNumber(value.tripDays,14)))),alternativeGapDays:Math.max(1,Math.min(120,Math.round(finiteNumber(value.alternativeGapDays,14)))),preference:['balanced','dry','warm','cold','sunny','snow','calm'].includes(preference)?preference:'balanced',constraintInputs:{minAvgMax:text(constraintInputs.minAvgMax),maxAvgMax:text(constraintInputs.maxAvgMax),maxWetDays:text(constraintInputs.maxWetDays),minSunHours:text(constraintInputs.minSunHours),maxWind:text(constraintInputs.maxWind),minSnowDepth:text(constraintInputs.minSnowDepth)},activeIndex:clampIndex(value.activeIndex,analysis.windows.length),createdAt,updatedAt,lastOpenedAt,analysis,waterInfo:isObject(value.waterInfo)?value.waterInfo as unknown as TravelWaterClimatology:null};
}

function notify(){try{window.dispatchEvent(new CustomEvent(TRAVEL_CENTER_UPDATED_EVENT))}catch{}}
export function readTravelCenterRecords():TravelCenterRecord[]{try{const raw=readDurableStorageValue(TRAVEL_CENTER_STORAGE_KEY);if(!raw)return[];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return[];return parsed.map(sanitizeRecord).filter((item):item is TravelCenterRecord=>Boolean(item)).sort((a,b)=>a.start.localeCompare(b.start)||b.updatedAt-a.updatedAt)}catch{return[]}}
export function writeTravelCenterRecords(records:TravelCenterRecord[]){const cleaned=records.map(sanitizeRecord).filter((item):item is TravelCenterRecord=>Boolean(item)).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,MAX_TRAVEL_CENTER_RECORDS);try{writeDurableStorageValue(TRAVEL_CENTER_STORAGE_KEY,JSON.stringify(cleaned));notify()}catch{}return cleaned}
export function upsertTravelCenterRecord(record:TravelCenterRecord){const current=readTravelCenterRecords(),index=current.findIndex(item=>item.id===record.id),next=index>=0?current.map(item=>item.id===record.id?record:item):[record,...current];return writeTravelCenterRecords(next)}
export function deleteTravelCenterRecord(id:string){return writeTravelCenterRecords(readTravelCenterRecords().filter(item=>item.id!==id))}
export function markTravelCenterOpened(id:string){return writeTravelCenterRecords(readTravelCenterRecords().map(item=>item.id===id?{...item,lastOpenedAt:Date.now()}:item))}
export function buildTravelCenterId(location:Location,start:string,end:string){const place=String(location.id||`${Number(location.latitude).toFixed(4)}:${Number(location.longitude).toFixed(4)}`).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,48);return`travel:${place}:${start}:${end}:${Date.now().toString(36)}`}

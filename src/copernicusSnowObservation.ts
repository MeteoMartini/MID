/**
 * Read-only Copernicus CLMS FSC/GFSC qualification for Alpine snow-cover maps.
 * No network calls, no licensing assumptions beyond linked official product docs.
 * This is fractional SURFACE SNOW COVER, never snow depth or a prediction.
 * The BYOC pixel is not production qualified before tile/provenance/QAFLAGS admission.
 * https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/snow/snow-cover-extent/clms_wsi_fractional-snow-cover_europe_utm_20m_daily_v2.html
 * https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/snow/snow-cover-extent/clms_wsi_gap-filled-fractional-snow-cover_europe_utm_60m_daily_v1.html
 */
export type CopernicusSnowKind='FSC-OG'|'FSC-TOC'|'GFSC';
export type CopernicusSnowStatus='observed'|'cloud-or-shadow'|'inland-water'|'no-data';
export const COPERNICUS_SNOW_COLLECTIONS={
 FSC:'2bb9974a-0eb8-484d-adf1-20cc307021b6',
 GFSC:'0b5265f5-3664-44c2-96ab-e91aba67b0c3'
} as const;
export const COPERNICUS_SNOW_MAX_PRODUCT_AGE_DAYS=3;
export type CopernicusSnowSample={
 kind:CopernicusSnowKind;
 // Actual satellite rasters are UINT8; fractions from different bands cannot be mixed.
 fractionRaw:unknown;
 qualityRaw:unknown;
 qaFlagsRaw?:unknown;
 cloudMaskRaw?:unknown; // FSC CLD: raw bitmask only; meaning not guessed.
 productDayUtc:string; // Exact YYYY-MM-DD (UTC product day, not pixel acquisition time).
 assetSha256?:string; // SHA only when independently verified against source bytes.
};
export type QualifiedCopernicusSnowSample={
 kind:CopernicusSnowKind;
 collectionId:string;
 fractionPercent:number|null;
 status:CopernicusSnowStatus;
 qualityClass:0|1|2|3|null;
 productDayUtc:string;
 productAgeDays:number;
 spatialResolutionM:20|60;
 compositeWindowDays:7|null;
 observationTimePrecision:'day-or-older';
 qaFlagsRaw:number|null;
 cloudMaskRaw:number|null;
 sourceSha256:string|null;
 provenance:'Copernicus Land Monitoring Service / Sentinel-1+2'|'Copernicus Land Monitoring Service / Sentinel-2';
 measurementKind:'satellite-fractional-snow-cover';
 snowDepthCm:null;
 newSnowCm:null;
 forecast:false;
 productionApproved:false;
};
const uint8=(raw:unknown):number|null=>
 typeof raw==='number'&&Number.isInteger(raw)&&raw>=0&&raw<=255?raw:null;
const dayTime=(day:string):number=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Copernicus product day must be ISO UTC calendar date');
 const time=Date.parse(day+'T00:00:00Z');
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==day)
  throw new Error('Invalid Copernicus UTC product date');
 return time;
};
export function qualifyCopernicusSnowSample(raw:CopernicusSnowSample,nowMs:number=Date.now()):QualifiedCopernicusSnowSample{
 if(!raw||!['FSC-OG','FSC-TOC','GFSC'].includes(raw.kind))throw new Error('Unknown Copernicus snow product');
 if(!Number.isFinite(nowMs))throw new Error('Invalid qualification clock');
 const observedDay=dayTime(raw.productDayUtc);
 const age=(nowMs-observedDay)/86_400_000;
 // Deliberately stricter than the source's 7-day GFSC pixel acquisition window.
 if(age<0||age>COPERNICUS_SNOW_MAX_PRODUCT_AGE_DAYS+1)
  throw new Error('Future or stale Copernicus snow PRODUCT DATE; no fake current image');
 const f=uint8(raw.fractionRaw),q=uint8(raw.qualityRaw);
 const flags=uint8(raw.qaFlagsRaw),cloud=uint8(raw.cloudMaskRaw);
 if(raw.assetSha256!==undefined&&!/^[a-f0-9]{64}$/i.test(raw.assetSha256))
  throw new Error('Unverified Copernicus source asset SHA-256 format');
 if(raw.fractionRaw!==null&&raw.fractionRaw!==undefined&&f===null)
  throw new Error('Copernicus snow fraction is not an original UINT8');
 const status:CopernicusSnowStatus=f===205?'cloud-or-shadow':f===210?'inland-water':
   f!==null&&f<=100&&q!==null&&q<=3&&flags!==null?'observed':'no-data';
 const valid=status==='observed';
 return {
  kind:raw.kind,
  collectionId:raw.kind==='GFSC'?COPERNICUS_SNOW_COLLECTIONS.GFSC:COPERNICUS_SNOW_COLLECTIONS.FSC,
  fractionPercent:valid?f:null,
  status,
  qualityClass:valid?q as 0|1|2|3:null,
  productDayUtc:raw.productDayUtc,
  productAgeDays:age,
  spatialResolutionM:raw.kind==='GFSC'?60:20,
  compositeWindowDays:raw.kind==='GFSC'?7:null,
  observationTimePrecision:'day-or-older',
  qaFlagsRaw:flags,
  cloudMaskRaw:cloud,
  sourceSha256:raw.assetSha256?.toLowerCase()??null,
  provenance:raw.kind==='GFSC'?'Copernicus Land Monitoring Service / Sentinel-1+2':'Copernicus Land Monitoring Service / Sentinel-2',
  measurementKind:'satellite-fractional-snow-cover',
  snowDepthCm:null,
  newSnowCm:null,
  forecast:false,
  productionApproved:false
 };
}

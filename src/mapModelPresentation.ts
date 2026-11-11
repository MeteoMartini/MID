/**
 * Display-only model identity for both MID map selectors.
 * Never changes model IDs, catalog eligibility, endpoints, source priority
 * or publication. Unknown providers receive no guessed country flag.
 *
 * Degree labels describe the DWD published map GRID, not atmospheric
 * effective native model resolution.
 */
export type MapModelChoice={id:string;label:string;resolutionKm?:number};
export type MapModelOption<T extends MapModelChoice>=T&{displayLabel:string};
export type MapModelGroup<T extends MapModelChoice>={id:string;label:string;models:MapModelOption<T>[]};

type KnownModel={
 family:string;familyRank:number;flag:string;resolutionOrderKm:number;
 displayResolution?:string;tieBreak:number;
};
const MODELS:Readonly<Record<string,KnownModel>>={
 'icon-d2-ruc':{family:'DWD · ICON',familyRank:0,flag:'🇩🇪',resolutionOrderKm:2.2,displayResolution:'ca. 2 km',tieBreak:0},
 'icon-d2':{family:'DWD · ICON',familyRank:0,flag:'🇩🇪',resolutionOrderKm:2.2,displayResolution:'ca. 2 km',tieBreak:1},
 'icon-eu':{family:'DWD · ICON',familyRank:0,flag:'🇩🇪',resolutionOrderKm:7,displayResolution:'0,0625° Kartenraster',tieBreak:2},
 'icon':{family:'DWD · ICON',familyRank:0,flag:'🇩🇪',resolutionOrderKm:28,displayResolution:'0,25° Kartenraster',tieBreak:3},
 'icon-eps':{family:'DWD · ICON',familyRank:0,flag:'🇩🇪',resolutionOrderKm:28,displayResolution:'0,25° Kartenraster',tieBreak:4},
 'aicon':{family:'DWD · AICON',familyRank:1,flag:'🇩🇪',resolutionOrderKm:28,displayResolution:'0,25° Kartenraster',tieBreak:0},
 'ifs':{family:'ECMWF · IFS',familyRank:2,flag:'🇪🇺',resolutionOrderKm:99,tieBreak:0},
 'gfs':{family:'NOAA · GFS',familyRank:3,flag:'🇺🇸',resolutionOrderKm:99,tieBreak:0},
 'gdps':{family:'ECCC · GDPS',familyRank:4,flag:'🇨🇦',resolutionOrderKm:15,displayResolution:'ca. 15 km',tieBreak:0},
 'radolan':{family:'DWD · Messdaten',familyRank:5,flag:'🇩🇪',resolutionOrderKm:999,tieBreak:0},
 'observations':{family:'DWD · Messdaten',familyRank:5,flag:'🇩🇪',resolutionOrderKm:999,tieBreak:1},
 'nowcastmix':{family:'DWD · Nowcasting',familyRank:6,flag:'🇩🇪',resolutionOrderKm:999,tieBreak:0},
};
const collator=new Intl.Collator('de-DE',{numeric:true,sensitivity:'base'});
const recognizedResolution=(value:unknown)=>
 typeof value==='number'&&Number.isFinite(value)&&value>=1&&value<=100?value:undefined;
function identityFor(id:string){
 return Object.prototype.hasOwnProperty.call(MODELS,id)?MODELS[id]:null;
}
export function mapModelDisplayLabel(choice:MapModelChoice):string{
 const known=identityFor(choice.id);
 if(!known)return choice.label; // Never claim a guessed nationality.
 const km=recognizedResolution(choice.resolutionKm);
 // Synoptic model resolution is read from verified index metadata. WMS-only
 // sources keep the distinct published grid label instead of claiming native.
 const res=km!==undefined?new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(km)+' km Raster':known.displayResolution;
 return known.flag+' '+choice.label+(res?' · '+res:'');
}
/** First: model family; inside family: finest verified/published map grid first. */
export function groupedMapModelOptions<T extends MapModelChoice>(choices:readonly T[]):MapModelGroup<T>[]{
 const sorted=[...choices].sort((a,b)=>{
  const x=identityFor(a.id),y=identityFor(b.id);
  const family=(x?.familyRank??999)-(y?.familyRank??999);
  if(family)return family;
  const ax=recognizedResolution(a.resolutionKm)??x?.resolutionOrderKm??Infinity;
  const by=recognizedResolution(b.resolutionKm)??y?.resolutionOrderKm??Infinity;
  return ax-by||(x?.tieBreak??999)-(y?.tieBreak??999)||
   collator.compare(a.label,b.label)||collator.compare(a.id,b.id);
 });
 const groups:MapModelGroup<T>[]=[];
 for(const item of sorted){
  const known=identityFor(item.id),id=known?.family??'Weitere Modelle';
  const previous=groups.at(-1);
  const group=previous?.id===id?previous:(()=>{const g:MapModelGroup<T>={id,label:id,models:[]};groups.push(g);return g})();
  group.models.push({...item,displayLabel:mapModelDisplayLabel(item)});
 }
 return groups;
}

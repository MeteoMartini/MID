export const MAP_BROWSER_WIDTHS=Object.freeze([320,390,412,844,1024,1440]);
/** Partition complete cases, keeping expensive desktop themes within the fixed job budget. */
export function mapBrowserCases(shard=''){
 const cases=MAP_BROWSER_WIDTHS.flatMap(width=>['light','dark'].flatMap(theme=>['next','classic'].map(design=>({width,theme,design}))));
 if(!shard)return cases;
 const match=/^([1-3])\/3$/.exec(shard);if(!match)throw Error('Invalid map browser shard: '+shard);
 const group=Number(match[1]);
 // Keep every 6x2x2 browser case; measured CI runtimes require balanced heavy shards.
 const caseGroup=row=>{
  if(row.width===844)return row.theme==='dark'&&row.design==='classic'?3:1;
  if(row.width===1024)return row.design==='next'?2:row.theme==='dark'?1:3;
  if(row.width===1440)return row.design==='next'?3:row.theme==='dark'?2:1;
  return MAP_BROWSER_WIDTHS.indexOf(row.width)%3+1;
 };
 return cases.filter(row=>caseGroup(row)===group);
}
/** Software-GPU browser fixtures are memory/renderer intensive.
 * Never run four mobile MapLibre contexts in a single process. Every case remains mandatory. */
export function mapBrowserCaseConcurrency(width){
 if(!Number.isInteger(width)||width<=0)throw new RangeError('Invalid map browser width: '+width);
 return width>=1024?1:2;
}
export function mapBrowserWidths(shard=''){return [...new Set(mapBrowserCases(shard).map(row=>row.width))]}

/** Unsharded revision keeps the full matrix through individually bounded existing shards. */
export function mapBrowserRunPlan(shard=''){
 const groups=shard?[shard]:['1/3','2/3','3/3'];
 const key=row=>`${row.width}/${row.theme}/${row.design}`;
 const assigned=groups.flatMap(mapBrowserCases).map(key),expected=mapBrowserCases(shard).map(key);
 if(assigned.length!==expected.length||new Set(assigned).size!==assigned.length||expected.some(k=>!assigned.includes(k)))throw Error('Map browser run plan must preserve every case exactly once');
 return groups;
}

/** Keep all original 20 memory cycles once in 2/3: the observed 3/3 eight-case workload
 * already needs almost the 13-minute CI step budget. No coverage or timeout changes. */
export function mapBrowserMemoryProbe(shard=''){
 mapBrowserCases(shard); // reject unknown groups before selecting any work
 return shard===''||shard==='2/3';
}

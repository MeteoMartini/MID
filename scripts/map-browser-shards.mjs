export const MAP_BROWSER_WIDTHS=Object.freeze([320,390,412,844,1024,1440]);
/** Partition complete cases, keeping expensive desktop themes within the fixed job budget. */
export function mapBrowserCases(shard=''){
 const cases=MAP_BROWSER_WIDTHS.flatMap(width=>['light','dark'].flatMap(theme=>['next','classic'].map(design=>({width,theme,design}))));
 if(!shard)return cases;
 const match=/^([1-3])\/3$/.exec(shard);if(!match)throw Error('Invalid map browser shard: '+shard);
 const group=Number(match[1]);
 return cases.filter(row=>row.width===1440?(row.design==='classic'?group===1:group===3):MAP_BROWSER_WIDTHS.indexOf(row.width)%3+1===group);
}
export function mapBrowserWidths(shard=''){return [...new Set(mapBrowserCases(shard).map(row=>row.width))]}

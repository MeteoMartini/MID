export const MAP_BROWSER_WIDTHS=Object.freeze([320,390,412,844,1024,1440]);
export function mapBrowserWidths(shard=''){
 if(!shard)return [...MAP_BROWSER_WIDTHS];
 const match=/^([1-3])\/3$/.exec(shard);if(!match)throw Error('Invalid map browser shard: '+shard);
 const index=Number(match[1])-1;return MAP_BROWSER_WIDTHS.filter((_,i)=>i%3===index);
}

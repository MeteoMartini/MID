import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
/** Location-independent source view for established static feature regressions.
 * The entry's lazy adapters are omitted, so each feature implementation occurs once.
 * Architecture/lazy-loading checks must read App.tsx itself rather than this view.
 */
export function readAppFeatureSources(){
 const entry=readFileSync(new URL('src/App.tsx',root),'utf8').replace(/^function (?:MountainSki|Widget)\(props:Parameters[^\n]*\n/gm,'');
 return [entry,...['ForecastDisplayPrimitives.tsx','MountainWeather.tsx','WidgetGenerator.tsx'].map(file=>readFileSync(new URL('src/'+file,root),'utf8'))].join('\n');
}

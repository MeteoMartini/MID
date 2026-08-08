import {readFile} from 'node:fs/promises';

const [cockpit,weather,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

need('WindUnit-Vertrag',weather,"export type WindUnit='kn'|'kmh'|'ms'|'mph'");
need('Windfieder',cockpit,'function SvgWindBarb(');
need('Windfieder-Speed',cockpit,'speed={item.point.wind}');
need('Windfieder-Farbe',cockpit,'color={windSignalColor(item.point.gust)}');
reject('Ungültige WindUnit',cockpit,"wind(point.point.wind,'kt')");
reject('Ungenutzter ForecastCockpit-Helfer',cockpit,'function SvgWindDirectionArrow(');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: package ${packageVersion}, baseline ${baselineVersion}`);

if(failures.length){
  console.error(`Windfieder-Buildfix fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Windfieder-Buildfix geprüft: gültige WindUnit und kein ungenutzter ForecastCockpit-Helfer.');

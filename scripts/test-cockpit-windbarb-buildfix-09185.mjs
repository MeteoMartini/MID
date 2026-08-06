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
need('Windformatierung in Knoten',cockpit,"wind(point.point.wind,'kn')");
reject('Ungültige WindUnit',cockpit,"wind(point.point.wind,'kt')");
reject('Ungenutzter ForecastCockpit-Helfer',cockpit,'function SvgWindDirectionArrow(');
need('Version',pkg,'"version": "0.9.18.7"');
need('Version',baseline,'"releaseVersion": "0.9.18.7"');

if(failures.length){
  console.error(`Windfieder-Buildfix fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Windfieder-Buildfix geprüft: gültige WindUnit und kein ungenutzter ForecastCockpit-Helfer.');

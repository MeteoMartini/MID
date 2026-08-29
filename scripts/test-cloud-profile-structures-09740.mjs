import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const token of [
 "type CloudProfileKey='cloud'|CloudProfileLayer",
 'function SvgProfileCloudStructure(',
 'value:number|undefined',
 "if(layer==='highCloud')",
 "if(layer==='midCloud')",
 'className="cloud-structure high"',
 'className="cloud-structure mid"',
 'className="cloud-structure low"',
 'className="cloud-total-cell"',
 'shortTermCloudCellGradient(item.point,chartPoints[index-1]?.point,chartPoints[index+1]?.point,\'cloud\')',
 'SvgProfileCloudStructure layer="highCloud" value={item.point.highCloud}',
 'SvgProfileCloudStructure layer="midCloud" value={item.point.midCloud}',
 'SvgProfileCloudStructure layer="lowCloud" value={item.point.lowCloud}',
 'Wolken Gesamt · H/M/L',
 'Wolken gesamt / hoch / mittel / tief + UVI'
])assert.ok(cockpit.includes(token),`24-h-Wolkenstruktur fehlt: ${token}`);

for(const token of [
 '--profile-cloud-total:',
 '--profile-cloud-high:',
 '--profile-cloud-mid:',
 '--profile-cloud-low:',
 '.cockpit-weather-profile .cloud-total-cell{',
 '.cockpit-weather-profile .cloud-structure-wisp{',
 '.cockpit-weather-profile .cloud-structure.high .primary{',
 '.cockpit-weather-profile .cloud-structure.mid .cloud-structure-lobe{',
 '.cockpit-weather-profile .cloud-structure.low .cloud-structure-lobe{'
])assert.ok(styles.includes(token),`Wolkenstruktur-CSS fehlt: ${token}`);

assert.ok(cockpit.includes('leftSource=previous?')&&cockpit.includes('rightSource=next?'),'H/M/L-Fading muss Nachbarstunden einbeziehen.');
assert.ok(cockpit.includes('const fraction=clamp(Number(value)||0,0,100)/100'),'Wolkenstruktur muss direkt aus 0..100-%-Bedeckung skaliert werden.');
assert.ok(cockpit.includes("const wisps=fraction>=.72?3:fraction>=.34?2:1"),'Hohe Wolken müssen mit zunehmender Bedeckung dichter/wispy werden.');
assert.ok(cockpit.includes("Math.round(1+fraction*3)"),'Mittlere/tiefe Wolken müssen mit zunehmender Bedeckung mehr Wolkenkörper erhalten.');
assert.equal(JSON.parse(pkg).version,JSON.parse(baseline).releaseVersion,'Release-/Baseline-Version müssen synchron sein.');
console.log('24-h-Wolkenprofil: Gesamt + höhentypische H/M/L-Strukturen, Intensität und Fading geprüft.');

import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

const failures=[];
for(const token of [
  'function windToDegrees',
  'function WindDirectionArrow',
  'function SvgWindDirectionArrow',
  'rotate(${to.toFixed(1)})',
  'windDirectionDescription'
]){
  if(!app.includes(token)) failures.push(`360-Grad-Windpfeil fehlt: ${token}`);
}
for(const forbidden of [
  'Math.round(to/45)',
  "const arrows=['↑','↗','→','↘','↓','↙','←','↖']",
  'dirArrow('
]){
  if(app.includes(forbidden)) failures.push(`Altes 45-Grad-Raster weiterhin vorhanden: ${forbidden}`);
}
for(const token of ['.wind-direction-arrow','.svg-wind-direction-arrow','transform-origin:50% 50%']){
  if(!styles.includes(token)) failures.push(`Windpfeil-Stil fehlt: ${token}`);
}
if(failures.length){
  console.error(`360-Grad-Windrichtungsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('360-Grad-Windrichtungsprüfung bestanden: HTML- und SVG-Pfeile verwenden den exakten Winkel ohne 45-Grad-Raster.');

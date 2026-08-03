import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function InlineWindArrow','cockpit-fourteen-heading','cockpit-fourteen-selected-summary','<WeatherPictogram code={item.weatherCode}','<InlineWindArrow direction={item.direction}','unit={unit}']){
 if(!source.includes(token))failures.push(`ForecastCockpit fehlt: ${token}`);
}
for(const token of ['.cockpit-inline-wind-arrow{','.cockpit-fourteen-heading{','.cockpit-fourteen-selected-summary{']){
 if(!styles.includes(token))failures.push(`Styles fehlen: ${token}`);
}
if(failures.length){
 console.error('Forecast-Cockpit-Piktogramm/Wind-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Forecast-Cockpit-Piktogramme und Windpfeile geprüft.');

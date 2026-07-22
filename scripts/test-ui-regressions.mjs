import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx'),ensemble=read('../src/EnsemblePanel.tsx'),weather=read('../src/weather.ts'),styles=read('../src/styles.css');
const failures=[];

for(const token of ['allowEscapeViewBox={{x:false,y:true}}',"maxWidth:'calc(100vw - 16px)'"])if(!ensemble.includes(token))failures.push(`Horizontal begrenzter Trend-Tooltip fehlt: ${token}`);
if(ensemble.includes('allowEscapeViewBox={{x:true,y:true}}'))failures.push('Trend-Tooltip darf horizontal nicht aus dem sichtbaren Bereich entweichen.');

for(const token of ["filter(layer=>['BKN','OVC','VV'].includes", "filter(layer=>['FEW','SCT'].includes", 'cloudBaseHft:metarCloudBaseHft(r)', 'cloudOktasValue>=5&&Number.isFinite(ceilingHft)', 'cloudOktasValue>=1&&cloudOktasValue<=4&&Number.isFinite(cloudBaseHft)'])if(!weather.includes(token)&&!app.includes(token))failures.push(`Wolkenuntergrenzenlogik fehlt: ${token}`);

for(const token of ['className="meteogram-day-jump"','Vorheriger Tag:','Nächster Tag:','@media(max-width:850px)','pointer-events:none','touch-action:manipulation'])if(!app.includes(token)&&!styles.includes(token))failures.push(`Mobile Tagesnavigation fehlt: ${token}`);

for(const token of ["matchMedia('(hover: hover) and (pointer: fine)')",'event.preventDefault();event.stopPropagation();onToggle()'])if(!ensemble.includes(token))failures.push(`Ein-Tap-Konsistenzsteuerung fehlt: ${token}`);
if(ensemble.includes('onFocus={onOpen}'))failures.push('Der Fokus öffnet den Konsistenzpunkt weiterhin vor dem Touch-Klick.');

if(failures.length){console.error('UI-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('UI-Regressionsprüfung bestanden: Tooltip-Randbegrenzung, wolkenabhängige Höhenbezeichnung, mobile Tagesnavigation und Ein-Tap-Konsistenzsteuerung sind vorhanden.');

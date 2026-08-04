import fs from 'node:fs';
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=fs.readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const required=[
 [app,/rgba\(\$\{channels\},\.17\)/,'ECMWF-Farbe muss transparent und dezent sein'],
 [app,/border:`rgba\(\$\{channels\},\.30\)`/,'ECMWF-Kontur muss dezent sein'],
 [ensemble,/const prepareHover=useCallback/,'Desktop-Hover-Reaktivierung fehlt'],
 [ensemble,/onMouseEnter=\{tooltip\.prepareHover\}/,'Temperatur-/Wind-Hover-Reaktivierung fehlt'],
 [ensemble,/onMouseEnter=\{rainTooltip\.prepareHover\}/,'Niederschlags-Hover-Reaktivierung fehlt'],
 [ensemble,/pointerEvents:compact\?'auto':'none'/,'Desktop-Tooltip darf Hover nicht abfangen'],
 [css,/grid-template-columns:36px minmax\(96px,1\.15fr\) 60px minmax\(0,1fr\)/,'Temperaturfeld ist nicht kompakt genug'],
 [css,/@media\(hover:hover\) and \(pointer:fine\)/,'Desktop-Pointer-Regel fehlt'],
 [css,/\.ensemble-chart-export \.recharts-tooltip-wrapper\{pointer-events:none!important\}/,'Recharts-Tooltip fängt Desktop-Hover weiterhin ab']
];
for(const [source,pattern,message] of required){if(!pattern.test(source))throw new Error(message)}
console.log('v0.9.15.2 Temperaturfeld- und Desktop-Ensemble-Tooltip-Vertrag bestanden.');

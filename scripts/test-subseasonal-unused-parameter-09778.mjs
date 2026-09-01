import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/SubseasonalTrendPanel.tsx',import.meta.url),'utf8');
const signature=source.match(/function pointsForMetric\(([^)]*)\)/)?.[1]??'';
if(!signature)throw new Error('pointsForMetric-Signatur nicht gefunden.');
if(/\bheight\s*:/.test(signature))throw new Error('Release-Blocker: pointsForMetric deklariert den ungenutzten Parameter height.');
if(/pointsForMetric\([^\n]*\bwidth\s*,\s*height\s*,\s*margin/.test(source))throw new Error('Release-Blocker: pointsForMetric-Aufruf übergibt weiterhin height.');
console.log('SubseasonalTrendPanel noUnusedParameters v0.9.77.8: PASS');

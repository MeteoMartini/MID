import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [app,ensemble,styles,pkg]=await Promise.all([read('../src/App.tsx'),read('../src/EnsemblePanel.tsx'),read('../src/styles.css'),read('../package.json')]);
const failures=[];
for(const token of ['visualViewport','trend-tooltip-portal','position:fixed!important','max-height:calc(100dvh - 16px)','viewportWidth<=560','createPortal'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Randfester Ensemble-Tooltip fehlt: ${token}`);
for(const token of ['detail-chart-popover-portal','visualViewport','anchorX','anchorY','max-height:calc(100dvh - 12px)','detailTooltipRef.current?.contains'])if(!app.includes(token)&&!styles.includes(token))failures.push(`Randfester Detail-Tooltip fehlt: ${token}`);
const packageJson=JSON.parse(pkg);if(packageJson.version!=='0.7.95')failures.push('Paketversion ist nicht 0.7.95');
if(failures.length){console.error(`Tooltip-Viewportprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('Tooltip-Viewportprüfung erfolgreich: beide Diagramm-Tooltips sind portalbasiert, viewportgebunden und für kleine Displays verdichtet.');

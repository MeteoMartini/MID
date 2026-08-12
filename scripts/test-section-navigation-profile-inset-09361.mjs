import {readFile} from 'node:fs/promises';
const [app,cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(source,label,token)=>{if(!source.includes(token))failures.push(`${label} fehlt: ${token}`)};
for(const token of [
 'const DASHBOARD_NAV_GROUPS:DashboardNavGroup[]=',
 "label:'Überblick'",
 "label:'Analyse & Trend'",
 "label:'Profile'",
 "label:'Planer'",
 "label:'Profi'",
 "label:'Werkzeuge'",
 'function DashboardSectionNavigation(',
 'className="dashboard-section-quick"',
 'className={`dashboard-section-rail${expanded?\' expanded\':\'\'}`}',
 'className="dashboard-section-drawer-backdrop"',
 "window.dispatchEvent(new CustomEvent('mid:open-module'",
 "history.pushState({midSection:id},'',`#mid-section-${id}`)",
 'id={`mid-section-${id}`}',
 'data-dashboard-section={id}',
 "window.addEventListener('mid:open-dashboard-settings'",
 "window.addEventListener('mid:forecast-horizon-active'"
]) need(app,'App',token);
for(const token of [
 "window.addEventListener('mid:navigate-forecast-horizon'",
 "window.dispatchEvent(new CustomEvent('mid:forecast-horizon-active'",
 'chartDataInset=22',
 'chartDataLeft=chartPaddingLeft+chartDataInset',
 'chartDataWidth=Math.max(1,chartPlotWidth-chartDataInset*2)',
 'chartDataLeft+((point.epoch-chartStartEpoch)/chartTimeSpan)*chartDataWidth'
]) need(cockpit,'ForecastCockpit',token);
for(const token of [
 '.dashboard-section-anchor{',
 '.dashboard-section-quick{',
 '.dashboard-section-rail{',
 '.dashboard-section-drawer-backdrop{',
 '@media(min-width:851px)',
 '@media(max-width:850px)'
]) need(styles,'Styles',token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
const parts=pv.split('.').map(Number),minimum=[0,9,36,1];const atLeast=parts.some((value,index)=>value>minimum[index])||parts.every((value,index)=>value===minimum[index]);if(!atLeast)failures.push(`Erwartet mindestens v0.9.36.1, erhalten ${pv}`);
if(failures.length){console.error(`MID Navigation/24-h-Inset-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`MID ${pv}: Sektionen-Drawer/Seitenleiste, Hash-Navigation, Auto-Expand und 24-h-Datenabstand geprüft.`);

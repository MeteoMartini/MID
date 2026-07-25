import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
  'const [selectedHour,setSelectedHour]=useState(0),[hourTooltipOpen,setHourTooltipOpen]=useState(false)',
  'const detailUsesDesktopTooltip=detailChartWidth>=900;',
  'const useTooltipOverlay=detailUsesDesktopTooltip,hourTooltipVisible=useTooltipOverlay&&hourTooltipOpen;',
  'onClick={()=>{setSelectedHour(i);if(useTooltipOverlay)setHourTooltipOpen(true)}}',
  '{hourTooltipVisible&&<div className={`hour-chart-tooltip detail-overlay ${tooltipPlacement}`}',
  'onClick={()=>setHourTooltipOpen(false)} aria-label="Stundendetails schließen"',
  '{!useTooltipOverlay&&<div className="hour-detail-panel mobile-cards" role="status" aria-live="polite" aria-label={`Details für ${currentHour.time.slice(11,16)} Uhr`}>',
  'className="hour-tooltip-actions"'
]) if(!app.includes(token)) failures.push(`Responsives Stunden-Detail fehlt: ${token}`);

for(const token of [
  '.hour-detail-panel.mobile-cards{',
  '.hour-chart-tooltip.detail-overlay .hour-tooltip-actions{display:flex;gap:6px;align-items:center}',
  '@media(min-width:900px){',
  '@media(max-width:899px){',
  '.hour-chart-tooltip.detail-overlay,.hour-chart-tooltip.detail-overlay.place-left,.hour-chart-tooltip.detail-overlay.place-right,.hour-chart-tooltip.detail-overlay.place-center{display:none}',
  '@media(max-width:390px){.hour-tooltip-grid.compact{grid-template-columns:1fr}}'
]) if(!styles.includes(token)) failures.push(`Responsives Tooltip-CSS fehlt: ${token}`);

if(app.includes('const useTooltipOverlay=detailUsesDesktopTooltip&&!narrowChart')) failures.push('narrowChart wird im Tooltip-Schalter erneut vor seiner Deklaration verwendet.');
const tooltipDeclaration=app.indexOf('const useTooltipOverlay=detailUsesDesktopTooltip,hourTooltipVisible=useTooltipOverlay&&hourTooltipOpen;');
const narrowDeclaration=app.indexOf('narrowChart=W<560');
if(tooltipDeclaration<0||narrowDeclaration<0) failures.push('Deklarationen für Tooltip oder Diagrammbreite konnten nicht geprüft werden.');

if(app.includes('hour-chart-tooltip persistent')) failures.push('Veraltete persistente Stunden-Tooltip-Variante ist noch vorhanden.');
if(app.includes('const useTooltipOverlay=detailUsesDesktopTooltip&&!narrowChart')) failures.push('narrowChart wird im Tooltip-Modus erneut vor seiner Deklaration verwendet.');


if(failures.length){
  console.error('Prüfung der responsiven Stunden-Details fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Responsives Stunden-Detail geprüft: Telefone nutzen Karten unter dem Diagramm, große Displays ein nur bei Bedarf sichtbares Overlay.');

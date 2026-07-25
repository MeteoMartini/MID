import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,ensemble,css]=await Promise.all([readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),readFile(path.join(root,'src','v078.css'),'utf8')]);
const failures=[];
for(const token of [
  "import {createPortal} from 'react-dom';",
  'function useEnsemblePortal(open:boolean',
  'refs.trigger.current?.contains(target)||refs.layer.current?.contains(target)',
  'aria-haspopup="dialog" aria-controls={open?id:undefined}',
  'createPortal(<div ref={layer} id={id} className="model-run-popover ensemble-portal-popover"',
  'createPortal(<div ref={layer} id={id} className="mode-info-popover ensemble-info-popover ensemble-portal-popover"',
  'function EnsembleHelpToolbar({runs}',
  '<EnsembleHelpToolbar runs={runs}/>',
  'Initialisierung {formatModelRunTime(row.initialisationTime)} · verfügbar seit {formatAvailabilityTime(row.availabilityTime)}'
])if(!ensemble.includes(token))failures.push(`Ensemble-Hilfe fehlt: ${token}`);
for(const token of ['.ensemble-help-toolbar{','.ensemble-portal-popover{position:fixed!important;right:auto!important;bottom:auto!important;z-index:6200!important','.ensemble-info-close{','.hero-day-range{'])if(!css.includes(token))failures.push(`Ensemble-/Hero-CSS fehlt: ${token}`);
for(const token of ['className="hero-kicker-row"','className="hero-day-range"','<small>Tmin</small>','<small>Tmax</small>'])if(!app.includes(token))failures.push(`Tages-Min/Max fehlt: ${token}`);
if(ensemble.includes('<details className="model-run-details"'))failures.push('Ensemble verwendet noch das problematische native details/summary-Element.');
if(failures.length){console.error('Modellstände-/Ensemble-Hilfe fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Hilfe geprüft: alle Info- und Modellstände-Popover werden über ein nicht clipbares Body-Portal geöffnet; Tages-Min/Max ist vorhanden.');

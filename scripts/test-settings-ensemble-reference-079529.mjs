import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,panel,styles,v078]=await Promise.all([read('src/App.tsx'),read('src/EnsemblePanel.tsx'),read('src/styles.css'),read('src/v078.css')]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};

requireTokens('Einstellungen-Struktur v0.7.95.26',app,[
 'className="settings-backdrop"',
 'className="settings-dialog"',
 'className="settings-layout"',
 'className="settings-nav"',
 "['view','Ansicht & Einheiten'",
 "['notifications','Benachrichtigungen'",
 "['favorites','Favoriten & Profile'",
 "['twin','Lokaler Wetterzwilling'",
 "['sync','Daten & Synchronisation'",
 "['system','System & Updates'",
 'className="settings-choice-grid three"',
 'className="settings-unit-grid"',
 'className="advanced-feature-settings"',
 'Änderungsradar für die nächsten drei Tage anzeigen',
 'DeviceSyncSettings',
 'Prognosegüte und Rückblick'
]);
requireTokens('Einstellungen-Design v0.7.95.26',styles,[
 '.settings-backdrop{position:fixed;z-index:5400;',
 '.settings-dialog{display:flex;flex-direction:column;width:min(1180px,100%);',
 '.settings-layout{display:grid;grid-template-columns:230px minmax(0,1fr);',
 '.settings-nav button.active{',
 '.settings-choice-grid button.active,.settings-unit-grid button.active{',
 '@media(max-width:700px){.settings-backdrop{padding:0}.settings-dialog{width:100%;height:100dvh;',
 ':root[data-theme=dark] select{color-scheme:dark}',
 '.advanced-feature-settings{display:grid;gap:9px;margin-top:14px;padding:13px;',
 '.advanced-feature-settings>.advanced-feature-group{overflow:hidden;border:1px solid var(--border);border-radius:13px;',
 '.advanced-feature-inline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}'
]);
requireTokens('Ensemble-Hilfe v0.7.95.26',panel,[
 'function useEnsemblePortal(open:boolean',
 'function EnsembleExplanation({advancedMode}',
 '<strong>14-Tage-Ensemble verstehen</strong>',
 '<b>P10–P90</b>',
 '<b>Prognosekonsistenz</b>',
 'ENS-Mittel, Klimamittel, Modellstände, Szenario-Cluster und das Änderungsradar',
 'function EnsembleHelpToolbar({runs,advancedMode}',
 '{advancedMode&&<ModelRunDetails runs={runs}/>',
 'className="model-run-popover ensemble-portal-popover"',
 'className="mode-info-popover ensemble-info-popover ensemble-portal-popover"'
]);
requireTokens('Ensemble-Konsistenz v0.7.95.26',panel,[
 'function ConsistencyControl',
 'className={`consistency-popover consistency-popover-portal',
 'buttonRef.current?.contains(target)||tooltipRef.current?.contains(target)',
 "document.addEventListener('pointerdown',dismiss,true)",
 "if(event.key==='Escape')onClose()",
 "fineHover()"
]);
requireTokens('Ensemble-Temperaturtooltip v0.7.95.26',panel,[
 "compact-trend-tooltip${alignRight?\' align-right\':\'\'}",
 'function TrendTooltip(',
 'className="trend-tooltip-matrix"',
 '>Tmin °C<',
 '>Tmax °C<',
 "position={compact?{x:0,y:6}:undefined}",
 "maxWidth:'calc(100vw - 12px)'"
]);
requireTokens('Ensemble-CSS v0.7.95.26',styles+v078,[
 '.ensemble-help-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:7px;',
 '.ensemble-portal-popover{position:fixed!important;right:auto!important;bottom:auto!important;z-index:6200!important;',
 '.ensemble-info-close{justify-self:end;',
 '.compact-trend-tooltip{',
 'width:min(336px,calc(100vw - 24px));',
 '@media(max-width:520px){',
 'width:min(286px,calc(100vw - 24px));'
]);

if(failures.length){console.error('Referenzdesign v0.7.95.26 verletzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Referenzdesign v0.7.95.26 geprüft: Einstellungsdialog, erweiterte Funktionskarten und sämtliche Ensemble-Hilfe-/Konsistenz-/Temperaturtooltips entsprechen der geschützten Referenz.');

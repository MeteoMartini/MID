import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const meteogram=readFileSync('src/MeteogramPanel.tsx','utf8');
const radar=readFileSync('src/RadarPanel.tsx','utf8');
const portal=readFileSync('src/AppPortalPopover.tsx','utf8');
const quality=readFileSync('scripts/test-code-quality-0783.mjs','utf8');
const mapFocus=readFileSync('scripts/test-modern-map-focus-09792.mjs','utf8');
const react19=readFileSync('scripts/test-react19-ref-climate-colors-09832.mjs','utf8');
const mapChart=readFileSync('scripts/test-map-chart-responsive-continuation-098482.mjs','utf8');

assert.ok(meteogram.includes("import {AppPortalPointTooltip} from './AppPortalPopover';"),'Meteogramm muss die gemeinsame MID-Portalprimitive nutzen.');
assert.ok(!meteogram.includes("import {createPortal} from 'react-dom';"),'Meteogramm darf kein eigenes react-dom-Portal mehr aufbauen.');
assert.ok(portal.includes('export function AppPortalPointTooltip'),'Gemeinsame Punkttooltip-Primitive fehlt.');
assert.ok(portal.includes('window.setTimeout(onClose,autoDismissMs)'),'Zentraler Touch-Auto-Dismiss fehlt.');
assert.ok(meteogram.includes('autoDismissMs={value.touch?4200:0}'),'Meteogramm muss Auto-Dismiss ausschließlich für Touch aktivieren.');

assert.ok(radar.includes('AppPortalPopover anchorRef={focusLayersButtonRef}'),'Komposit-Ebenenwahl muss die gemeinsame Portalprimitive verwenden.');
assert.ok(radar.includes('className="composite-focus-layer-popover composite-focus-layer-popover-portal"'),'Komposit-Ebenenportal braucht die aktuelle Portal-Klasse.');
assert.ok(!radar.includes('focusLayersRef=useRef'),'Veraltete lokale Ebenen-Layer-Verankerung darf nicht zurückkehren.');

for(const [name,source] of [['code-quality',quality],['modern-map',mapFocus],['react19',react19],['map-chart',mapChart]]){
 assert.ok(source.includes('AppPortalPopover')||source.includes('AppPortalPointTooltip'),`${name}: Regression muss die aktuelle gemeinsame Portalarchitektur schützen.`);
}
assert.ok(!react19.includes("radar.includes('useDismissibleLayer(focusLayersRef')"),'React-19-Regression darf die abgelöste Radar-Layer-Architektur nicht erzwingen.');
assert.ok(!mapChart.includes("import \\{createPortal\\} from 'react-dom'"),'Karten-/Diagrammvertrag darf kein direktes Meteogramm-Portal mehr erzwingen.');

console.log('MID v0.9.84.84 Release-Gate: gemeinsame Portalarchitektur und bereinigte Altverträge geprüft.');

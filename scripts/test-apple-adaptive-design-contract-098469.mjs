import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const modern=await readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');

assert.match(modern,/MID v0\.9\.84\.69 · Apple-2026-Vertrag für adaptive WebApp/,'Apple-2026-Vertrag fehlt');
assert.match(modern,/--mid-control-touch:44px/,'44px Touch-Zieltoken fehlt');
assert.match(modern,/--mid-text-micro:11px/,'semantische Mindesttypografie fehlt');
assert.match(modern,/@media \(hover:none\),\(pointer:coarse\)/,'Pointer-/Touch-Adaption fehlt');
assert.match(modern,/@media\(any-pointer:coarse\)/,'iPad-Touchreserve bei zusätzlichem Trackpad fehlt');
assert.match(modern,/min-block-size:var\(--mid-control-touch\)/,'Touch-Ziele werden nicht verbindlich angewendet');
assert.match(modern,/@media\(max-width:850px\) and \(max-height:520px\)/,'raumbezogener Compact-Height-Vertrag fehlt');
assert.match(modern,/dashboard-bottom-tabs button\{min-height:58px!important[\s\S]*font-size:11px!important/,'mobile Tab-Leiste bleibt zu klein');
assert.match(modern,/modern-planner-actions>button small\{font-size:11px/,'Planner-Untertexte bleiben unter Lesbarkeitsminimum');
assert.match(modern,/settings-dialog\{--settings-copy-title:14px;--settings-copy-caption:11\.5px\}/,'Einstellungs-Typografie nicht standardisiert');
assert.match(modern,/grid-auto-columns:196px!important/,'14-Tage-Karten werden auf kompakten Breiten nicht lesbar verbreitert');
assert.match(modern,/cockpit-fourteen-heading-copy>b\{font-size:12px!important/,'14-Tage-Kopf bleibt mikrotypografisch');
assert.match(modern,/cockpit-confidence-info>button\{width:44px!important;height:44px!important/,'14-Tage-Infoziel bleibt zu klein');
assert.match(index,/#mid-boot-recovery button\{min-height:44px/,'Boot-Recovery erfüllt die Touchgröße nicht');
assert.match(index,/viewport-fit=cover/,'Safe-Area-fähiger Viewport fehlt');

console.log('OK apple adaptive design contract 098469');

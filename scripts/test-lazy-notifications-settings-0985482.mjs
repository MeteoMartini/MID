import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8');
const lazy="const LazyPushSettingsPanel=lazy(()=>import('./PushSettingsPanel').then(module=>({default:module.PushSettingsPanel})));";
assert.ok(app.includes(lazy),'Notifications settings must have a real React.lazy boundary');
assert.ok(!/import\\s+(?:\\{[^}]*PushSettingsPanel[^}]*\\}|PushSettingsPanel)\\s+from\\s+['\"]\\.\\/PushSettingsPanel['\"]/.test(app),'No eager PushSettingsPanel import');
assert.ok(!/\\bvoid\\s+import\\(['\"]\\.\\/PushSettingsPanel/.test(app),'No unrequested startup import');
assert.ok(app.includes("function PushSettingsPanel(props:Parameters<typeof import('./PushSettingsPanel').PushSettingsPanel>[0])"),'Typed wrapper must preserve props and callsites');
assert.ok(app.includes('<LazyPushSettingsPanel {...props}/>'),'React.lazy wrapper must forward all original settings props');
assert.ok(app.includes('role="status" aria-live="polite">Benachrichtigungseinstellungen werden geladen …'),'Loading feedback must remain accessible');
assert.ok(app.includes("contentReady&&section==='notifications'&&<PushSettingsPanel"),'Notifications remain gated to the selected settings page');
assert.ok(panel.includes('export function PushSettingsPanel('),'Existing functionality and exporter preserved');
console.log('Notification settings: lazy import, section gate, typed props, fallback and unchanged panel checked.');

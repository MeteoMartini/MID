import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const pkg=JSON.parse(fs.readFileSync(new URL('package.json',root),'utf8'));
const lock=JSON.parse(fs.readFileSync(new URL('package-lock.json',root),'utf8'));
const policy=fs.readFileSync(new URL('MID_DEPENDENCY_UPGRADE_POLICY.md',root),'utf8');
for(const [name,version] of [['maplibre-gl','6.7.0'],['react','19.2.8'],['react-dom','19.2.8'],['react-is','19.2.8']]){assert.equal(pkg.dependencies?.[name],version,`${name} darf in J.5 nicht partiell aktualisiert werden.`);assert.equal(lock.packages?.[`node_modules/${name}`]?.version,version,`${name} Lockfile muss reproduzierbar bleiben.`)}
for(const [name,version] of [['@capacitor/core','8.5.1'],['@capacitor/ios','8.5.1']]){assert.equal(pkg.dependencies?.[name],version);assert.equal(lock.packages?.[`node_modules/${name}`]?.version,version)}
assert.equal(pkg.devDependencies?.['@capacitor/cli'],'8.5.1');assert.equal(lock.packages?.['node_modules/@capacitor/cli']?.version,'8.5.1');
assert.equal(pkg.devDependencies?.vite,'8.2.2');assert.equal(lock.packages?.['node_modules/vite']?.version,'8.2.2');
for(const token of ['MapLibre GL JS 6.11.1','Capacitor Core / iOS / CLI 8.5.2','Vite 8.3.0','React 19.3.0','keine package.json-only-Aktualisierung'])assert.ok(policy.includes(token),`Wartungsreview fehlt: ${token}`);
console.log('MID J.5 Dependency-Review: neuere Kandidaten dokumentiert, Stable-Lockfile bleibt ohne partielle Migration reproduzierbar.');

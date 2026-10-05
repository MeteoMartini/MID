import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8'),app=read('src/App.tsx'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
assert.ok(!existsSync('ios/App/App/Assets.xcassets/Splash.imageset/.splash-dark-2732x2732-1x.png.2iUdJG'));
const assets=JSON.parse(read('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'));for(const entry of assets.images??[])if(entry.filename)assert.ok(existsSync('ios/App/App/Assets.xcassets/Splash.imageset/'+entry.filename));
for(const name of ['AppleWidgetSettings','DashboardModuleSettings']){assert.ok(app.includes(`lazy(()=>import('./${name}')`));assert.ok(!new RegExp(`^import \\{[^}]*\\} from './${name}';`,'m').test(app));}
for(const name of ['@capacitor/core','@capacitor/ios','@capacitor/cli']){assert.equal((pkg.dependencies??{})[name]??pkg.devDependencies[name],'8.5.2');assert.equal(lock.packages['node_modules/'+name].version,'8.5.2')}
assert.equal(pkg.dependencies.jsfive,'0.4.2');assert.equal(pkg.dependencies['@capacitor/share'],'8.0.2');
if(existsSync('dist/assets')){const files=readdirSync('dist/assets');assert.ok(files.some(n=>/^AppleWidgetSettings-.*\.js$/.test(n)));assert.ok(files.some(n=>/^DashboardModuleSettings-.*\.js$/.test(n)));}
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-maintenance-browser-0985168.mjs'],{stdio:'inherit',timeout:360000});
console.log('Maintenance: referenced iOS assets intact, optional settings lazy, compatible exact patch versions and browser QA protected.');

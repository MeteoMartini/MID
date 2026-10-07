import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const script=await readFile(new URL('./verify-favorite-selection-browser-0985189.mjs',import.meta.url),'utf8');
assert.ok(script.includes("app.slice(app.indexOf('function FavoriteQuickStrip(')"),'Browser test must use the current real component');
assert.ok(script.includes('/src/midPresentation.css'),'Browser test must include production CSS cascade');
if(process.env.GITHUB_ACTIONS==='true'||process.env.MID_FAVORITE_BROWSER_QA==='1')execFileSync(process.execPath,[new URL('./verify-favorite-selection-browser-0985189.mjs',import.meta.url).pathname],{stdio:'inherit',timeout:240000});
else console.log('Favorite browser harness contract passed; real browser runs in CI or with MID_FAVORITE_BROWSER_QA=1.');

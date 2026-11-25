// Isolated real-browser regression for MID's existing dialog focus policy.
// Runs the source helper, not the production website or a React/iOS acceptance test.
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const policy=stripTypeScriptTypes(readFileSync(new URL('../../src/appLayerFocusEligibility.ts',import.meta.url),'utf8')).replace(/^export /gm,'');
test('dialog Tab skips hidden content, preserves radio groups and scrolls to focused controls',async({page})=>{
 await page.setContent('<style>#layer{max-height:240px;overflow:auto;border:1px solid}button,input{margin:3px}.collapsed{width:0;height:0;padding:0;border:0;overflow:hidden}</style><button id="before">before</button><div id="layer" role="dialog" aria-modal="true"><h2 id="heading" tabindex="-1">heading</h2><button id="a">A</button><div aria-hidden="true"><button id="hidden">hidden</button></div><fieldset disabled><button id="disabled">disabled</button></fieldset><div inert><button id="inert">inert</button></div><button id="collapsed" class="collapsed"></button><button id="negative" tabindex="-2">negative</button><label><input id="r1" name="x" type="radio">1</label><label><input id="r2" name="x" type="radio" checked>2</label><label><input id="r3" name="x" type="radio">3</label><form><input id="other" name="x" type="radio" checked></form><button id="last">last</button></div><button id="outside">outside</button>');
 await page.addScriptTag({content:policy+'\nconst layer=document.getElementById("layer");document.addEventListener("keydown",event=>{if(event.key==="Tab"&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!event.defaultPrevented){event.preventDefault();moveTab(layer,event.shiftKey)}},true);'});
 const key=async(k,id)=>{await page.keyboard.press(k);await expect(page.locator('#'+id)).toBeFocused()};
 const focus=async(id)=>page.locator('#'+id).focus();
 await focus('a');await key('Tab','r2');await key('Tab','other');await key('Tab','last');await key('Tab','a');await key('Shift+Tab','last');await key('Shift+Tab','other');await key('Shift+Tab','r2');await key('Shift+Tab','a');
 await focus('heading');await key('Tab','a');await focus('heading');await key('Shift+Tab','last');
 await focus('r2');await key('ArrowRight','r3');await key('Tab','other');await key('Shift+Tab','r3');
 await page.evaluate(()=>document.querySelectorAll('#layer > label input').forEach(e=>e.checked=false));
 await focus('a');await key('Tab','r1');await key('Tab','other');await key('Shift+Tab','r3');await key('Shift+Tab','a');
 await page.evaluate(()=>{document.getElementById('a').tabIndex=2;document.getElementById('last').tabIndex=1});
 await focus('last');await key('Tab','a');await key('Shift+Tab','last');
 await focus('outside');await key('Tab','last');await focus('outside');await key('Shift+Tab','other');
 await page.evaluate(()=>document.querySelectorAll('#layer button,#layer input').forEach(e=>e.disabled=true));
 await focus('outside');await key('Tab','layer');await key('Shift+Tab','layer');
 await page.evaluate(()=>{document.getElementById('layer').innerHTML='<details><summary id="summary">summary</summary><button id="closed">closed</button></details><div id="edit" contenteditable="plaintext-only">edit</div><button id="top">top</button><div style="height:1200px"></div><button id="bottom">bottom</button>'});
 await focus('summary');await key('Tab','edit');await key('Tab','top');await key('Tab','bottom');
 expect(await page.evaluate(()=>document.getElementById('bottom').getBoundingClientRect().bottom<=document.getElementById('layer').getBoundingClientRect().bottom+2)).toBe(true);
 await key('Shift+Tab','top');await key('Shift+Tab','edit');await key('Shift+Tab','summary');
 await page.evaluate(()=>document.querySelector('details').open=true);await key('Tab','closed');await key('Tab','edit');
});

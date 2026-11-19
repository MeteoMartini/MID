/** MID Design 1.12: lines and 24h-detail legends share an identical dash contract.
 * Static parity only; real CSSOM, colour contrast and browser screenshots are separate gates.
 */
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parameterLineStyle} from '../../src/parameterLineStyle';

const modern=readFileSync(new URL('../../src/styles-src/30-modern.css',import.meta.url),'utf8');
const generated=readFileSync(new URL('../../src/midPresentation.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
const roles=['apparent','dewpoint','probability','gust'] as const;
const legendClass={apparent:'apparent',dewpoint:'dewpoint',probability:'probability',gust:'gustline'} as const;

function finalLegendRule(css:string,cssClass:string){
 const escaped=cssClass.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=[...css.matchAll(new RegExp('\\.detaillegend i\\.'+escaped+'\\s*\\{([^}]*)\\}','g'))];
 return matches.at(-1)?.[1]??'';
}
describe('MID 1.12 actual 24h SVG line and CSS legend dash parity',()=>{
 it.each(roles)('%s dash period and current theme token match the final legend rule',role=>{
  const line=parameterLineStyle(role);
  const dash=String(line.strokeDasharray);
  const [draw,gap]=dash.split(' ').map(Number);
  expect(Number.isFinite(draw)&&draw>0&&Number.isFinite(gap)&&gap>0).toBe(true);
  const token=String(line.stroke);
  expect(token).toMatch(/^var\(--[a-z-]+\)$/);
  const expected='background:repeating-linear-gradient(90deg,'+token+' 0 '+draw+'px,transparent '+draw+'px '+(draw+gap)+'px)!important';
  for(const css of [modern,generated])expect(finalLegendRule(css,legendClass[role])).toContain(expected);
  expect(app).toContain("data-parameter-line=\""+role+"\" style={parameterLineStyle('"+role+"')}");
 });
 it('preserves the original foundation opacity without hiding the new fine-dot legend',()=>{
  expect(generated).toContain('.detaillegend i.dewpoint{background:var(--param-dewpoint)!important;opacity:.72}');
  expect(finalLegendRule(generated,'dewpoint')).toContain('var(--param-dewpoint) 0 2px,transparent 2px 7px');
  expect(finalLegendRule(generated,'dewpoint')).not.toBe('background:var(--param-dewpoint)!important');
 });
});

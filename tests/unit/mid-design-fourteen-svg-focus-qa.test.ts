import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import postcss from 'postcss';
import {describe,expect,it} from 'vitest';
import {HorizonSignalChart} from '../../src/HorizonSignalChart';

const css=readFileSync(new URL('../../src/midDesignWeFourteen.css',import.meta.url),'utf8');
const root=postcss.parse(css,{from:'midDesignWeFourteen.css'});
const selector='html:root .app [data-fourteen-development] .long-range-chart[data-horizon-signal="period-intervals"] svg g[role="button"]:focus-visible>circle:first-of-type';
function focusRules(){
 const rules:postcss.Rule[]=[];
 root.walkRules(rule=>{if(rule.selector===selector)rules.push(rule)});
 return rules;
}
function declarations(rule:postcss.Rule){
 return Object.fromEntries(rule.nodes.filter((node):node is postcss.Declaration=>node.type==='decl').map(node=>[node.prop,node.value]));
}
describe('MID Design20 · fourteen-day keyboard focus without extra render work',()=>{
 it('draws a visible non-scaling outer ring on the existing SVG hit target',()=>{
  const rules=focusRules();
  expect(rules).toHaveLength(2);
  const regular=rules.find(rule=>rule.parent?.type!=='atrule');
  expect(regular).toBeDefined();
  const styles=declarations(regular!);
  expect(styles.stroke).toBe('var(--primary)');
  expect(styles['stroke-width']).toBe('3px');
  expect(styles['vector-effect']).toBe('non-scaling-stroke');
  expect(styles).not.toHaveProperty('fill');
  expect(styles).not.toHaveProperty('display');
  expect(styles).not.toHaveProperty('pointer-events');
 });
 it('uses a system highlight ring in forced-color mode, not theme-only color',()=>{
  const contrast=focusRules().find(rule=>rule.parent?.type==='atrule');
  expect(contrast?.parent?.type).toBe('atrule');
  const media=contrast?.parent as postcss.AtRule;
  expect(media.name).toBe('media');
  expect(media.params).toBe('(forced-colors:active)');
  expect(declarations(contrast!).stroke).toBe('Highlight');
  expect(declarations(contrast!)['stroke-width']).toBe('4px');
 });
 it('preserves 320px/390px responsive layout and current keyboard focus rules',()=>{
  expect(css).toContain('@media(max-width:620px)');
  expect(css).toContain('@media(max-width:820px)');
  expect(css).toContain('.mid-we-fourteen-daytile:focus-visible');
  expect(css).toContain('.mid-we-fourteen-weekscroll:focus-visible');
  expect(css).toContain('.mid-we-fourteen-switch button:focus-visible');
  expect(css).toContain('min-height:44px');
 });
 it('uses existing focusable interactive SVG points and preserves NoData gap in React SSR',()=>{
  const html=renderToStaticMarkup(createElement(HorizonSignalChart,{
   label:'14-Tage-Prognose',unit:'°C',connectDaily:true,
   series:[{id:'tmax',label:'Höchsttemperatur',color:'var(--param-temperature)',points:[
    {id:'2026-11-17',label:'17.11.',mean:12},
    {id:'2026-11-18',label:'18.11.',mean:null},
    {id:'2026-11-19',label:'19.11.',mean:9},
   ]}],
  }));
  expect(html).toContain('data-horizon-signal="period-intervals"');
  expect((html.match(/role="button"/g)||[])).toHaveLength(2);
  expect((html.match(/tabindex="0"/g)||[])).toHaveLength(2);
  expect((html.match(/r="12" fill="transparent"/g)||[])).toHaveLength(2);
  expect(html).not.toContain('NaN');
 });
});

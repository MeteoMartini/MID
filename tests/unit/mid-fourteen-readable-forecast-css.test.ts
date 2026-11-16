import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import postcss from 'postcss';

const stylesheet=fileURLToPath(new URL('../../src/midC18FourteenReplitFluidGrid.css',import.meta.url));
const css=await readFile(stylesheet,'utf8');
const root=postcss.parse(css,{from:stylesheet});
const findRules=(selector:string)=>root.nodes.flatMap(function walk(node:any):any[]{
 const entries=node.type==='rule'&&node.selector===selector?[node]:[];
 return node.nodes?[...entries,...node.nodes.flatMap(walk)]:entries;
});
const declarations=(rule:any)=>Object.fromEntries(rule.nodes.filter((node:any)=>node.type==='decl').map((node:any)=>[node.prop,node.value]));

describe('MID 14-day forecast: readable responsive CSS',()=>{
 it('never introduces sub-10.5px font declarations in the dense 14-day stylesheet',()=>{
  const fontSizes:number[]=[];
  root.walkDecls('font-size',decl=>{
   const match=/^([0-9]+(?:\.[0-9]+)?)px$/.exec(decl.value);
   if(match)fontSizes.push(Number(match[1]));
  });
  expect(fontSizes.length).toBeGreaterThan(15);
  expect(fontSizes.every(value=>value>=10.5)).toBe(true);
 });
 it('preserves the complete weather label instead of a one-line ellipsis',()=>{
  const selector="html[data-mid-design='next'] .cockpit-fourteen-weather-label";
  const rules=findRules(selector);
  expect(rules).toHaveLength(2);
  const [base,mobile]=rules.map(declarations);
  expect(base['white-space']).toBe('normal');
  expect(base.overflow).toBe('visible');
  expect(base['text-overflow']).toBe('clip');
  expect(base['overflow-wrap']).toBe('anywhere');
  expect(base['font-size']).toBe('11px');
  expect(mobile['font-size']).toBe('11px');
  expect(mobile['max-width']).toBe('28ch');
  expect(mobile['white-space']).toBeUndefined();
  expect(mobile['overflow']).toBeUndefined();
  expect(mobile['text-overflow']).toBeUndefined();
  expect(mobile['overflow-wrap']).toBeUndefined();
  expect(mobile && rules[1].parent?.name).toBe('media');
  expect(rules[1].parent?.params).toBe('(max-width:720px)');
 });
 it('retains the shared mobile navigation safe-area and mountain touch rules',()=>{
  const navigation=root.toString();
  expect(navigation).toContain('.navigation-bottom-tabs .modern-forecast-horizons');
  expect(navigation).toContain('scroll-margin-top:calc(max(var(--mid-safe-top),env(safe-area-inset-top,0px)) + 12px)!important');
  expect(navigation).toContain('.mountain-ski :is(');
  expect(navigation).toContain('min-width:44px!important');
  expect(navigation).toContain('min-height:44px!important');
 });
});

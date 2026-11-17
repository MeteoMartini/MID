import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import * as ts from 'typescript-strada';
import {HorizonSignalChart,signalChartInnerWidth} from '../../src/HorizonSignalChart';

const source=readFileSync(new URL('../../src/HorizonSignalChart.tsx',import.meta.url),'utf8');

describe('MID Design · responsive signal-chart ResizeObserver lifecycle',()=>{
 it('retains pixel-correct chart geometry across small phone, phone, tablet, and desktop',()=>{
  for(const [clientWidth,left,right,expected] of [
   [320,'12px','12px',296],
   [390,'18px','18px',354],
   [834,'20px','16px',798],
   [1440,'32px','24px',1384],
   [120,'24px','24px',120],
  ] as const){
   expect(signalChartInnerWidth(clientWidth,left,right)).toBe(expected);
  }
 });
 it('never sends non-finite or negative CSS-padded widths into SVG calculations',()=>{
  expect(signalChartInnerWidth(Number.NaN,'12px','12px')).toBe(120);
  expect(signalChartInnerWidth(320,'auto','12px')).toBe(120);
  expect(signalChartInnerWidth(320,'12px','unset')).toBe(120);
  expect(signalChartInnerWidth(50,'50px','50px')).toBe(120);
 });
 it('binds only one native ResizeObserver per mounted chart, with unmount cleanup',()=>{
  const tree=ts.createSourceFile('HorizonSignalChart.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  expect(tree.parseDiagnostics.map(issue=>ts.flattenDiagnosticMessageText(issue.messageText,' '))).toEqual([]);
  const hook=source.slice(source.indexOf('export function useSignalChartWidth(){'),source.indexOf('export type SignalPoint='));
  expect(hook).toContain('useLayoutEffect(()=>{');
  expect(hook).toContain('const observer=new ResizeObserver(update)');
  expect(hook).toContain('observer.observe(node)');
  expect(hook).toContain('return()=>observer.disconnect()');
  expect(hook).toContain('},[]);');
  expect(hook).toContain('const style=getComputedStyle(node)');
  expect(hook).toContain('setWidth(previous=>previous===next?previous:next)');
  expect(hook.split('new ResizeObserver(')).toHaveLength(2);
 });
 it('retains SSR chart semantic elements and missing-data discontinuity without DOM access',()=>{
  const html=renderToStaticMarkup(createElement(HorizonSignalChart,{
   label:'MID 14-Tage-Temperatur',unit:'°C',connectDaily:true,
   series:[{id:'tmax',label:'Tmax',color:'var(--param-temperature)',points:[
    {id:'2026-11-17',label:'17.11.',mean:8},
    {id:'2026-11-18',label:'18.11.',mean:null},
    {id:'2026-11-19',label:'19.11.',mean:11},
   ]}],
  }));
  expect(html).toContain('data-signal-series="tmax"');
  expect(html).toContain('MID 14-Tage-Temperatur');
  expect(html).toContain('17.11.');
  expect(html).toContain('19.11.');
  expect(html).not.toContain('NaN');
 });
});

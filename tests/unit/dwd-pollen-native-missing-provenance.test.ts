import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const paths=['worker-src/00-core-observations.js','worker.js','worker/metar-proxy.js'];
const texts=paths.map(path=>readFileSync(path,'utf8'));
const functionSource=texts[0].match(/function dwdPollenNativeIndex\(value\)\{[^}]*\}/)?.[0];
if(!functionSource)throw Error('Original DWD pollen NoData parser missing in worker source');
const pollenIndex=Function(functionSource+';return dwdPollenNativeIndex;')() as (value:unknown)=>number;

describe('DWD Pollenflug WFS native numeric NoData stays unknown in all worker mirrors',()=>{
 it('keeps generated workers identical and never converts null/blank/native zero to each other',()=>{
  expect(texts[1]).toBe(texts[2]);
  for(const source of texts){
   expect(source).toContain('pollenInt=dwdPollenNativeIndex(props.POLLENINT)');
   expect(source).toContain("pollenValue=String(props.PARAMETER_VALUE??'')");
   expect(source).toContain(functionSource);
   expect(source).not.toContain('Number(props.POLLENINT||0)');
  }
 });
 it('distinguishes native missing values from genuine 0 and preserves legal range',()=>{
  const cases:[unknown,number][]= [
   [undefined,-1],[null,-1],['',-1],['   ',-1],
   [false,-1],[true,-1],[NaN,-1],[Infinity,-1],[-Infinity,-1],
   ['unbekannt',-1],['0-1',-1],[-2,-1],[4,-1],['4',-1],
   [-1,-1],['-1',-1],[0,0],['0',0],[' 0 ',0],[0.5,0.5],[3,3],['3',3]
  ];
  for(const [value,expected] of cases)expect(pollenIndex(value),String(value)).toBe(expected);
 });
 it('preserves a numeric native 0 in its textual source instead of manufacturing missingness',()=>{
  expect(String(0??'')).toBe('0');
  expect(String(null??'')).toBe('');
 });
});

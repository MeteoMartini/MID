import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {rainBrierPresentation} from '../../src/rainBrierPresentation';

const source=readFileSync(new URL('../../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8');

describe('MID Audit 1.0 · Brier Score ohne unbelegte Skill-Einstufung',()=>{
 it('retains true perfect and worst binary Brier scores without qualitative labels',()=>{
  expect(rainBrierPresentation(0,30)).toEqual({value:'Brier 0,00',detail:'30 unabhängige Vergleichstage · kein Referenz-Skill belegt'});
  expect(rainBrierPresentation(1,30)).toEqual({value:'Brier 1,00',detail:'30 unabhängige Vergleichstage · kein Referenz-Skill belegt'});
 });
 it('does not interpret a low absolute Brier score as empirically demonstrated high skill',()=>{
  const display=rainBrierPresentation(.03,60);
  expect(display.value).toBe('Brier 0,03');
  expect(display.detail).toContain('kein Referenz-Skill belegt');
  expect(display.detail).not.toMatch(/hoch|mittel|gering|kalibriert/);
 });
 it('discloses single-day and multiple-day independent sample sizes accurately',()=>{
  expect(rainBrierPresentation(.25,1).detail).toMatch(/^1 unabhängiger Vergleichstag/);
  expect(rainBrierPresentation(.25,13).detail).toMatch(/^13 unabhängige Vergleichstage/);
 });
 it('treats missing and physically impossible score inputs as unavailable, never zero',()=>{
  for(const value of [undefined,null,Number.NaN,Infinity,-Infinity,-.01,1.01]){
   expect(rainBrierPresentation(value,10).value).toBe('–');
  }
  for(const size of [undefined,null,0,-2,1.3,Infinity,Number.NaN]){
   expect(rainBrierPresentation(.2,size).value).toBe('–');
  }
 });
 it('formats the descriptive statistic concisely in German without rendering misleading probability percent',()=>{
  expect(rainBrierPresentation(.235,10).value).toBe('Brier 0,23');
  expect(rainBrierPresentation(.8,10).value).toBe('Brier 0,80');
  expect(rainBrierPresentation(.8,10).value).not.toContain('%');
 });
 it('wires the actual React KPI to the immutable best-match independent case count',()=>{
  expect(source).toContain('rainBrierPresentation(report.rainBrier,report.models.find(row=>row.id===\'best_match\')?.parameterMetrics.probability?.samples)');
  expect(source).toContain('Güte der Regenwahrscheinlichkeit');
  expect(source).toContain('{rainVerification.value}');
  expect(source).toContain('{rainVerification.detail}');
  expect(source).not.toContain('rainReliability=');
  expect(source).toContain('kein Vorhersage-Skill');
 });
});

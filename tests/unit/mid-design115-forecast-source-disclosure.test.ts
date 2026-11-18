import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=(path:string)=>readFileSync(fileURLToPath(new URL('../../'+path,import.meta.url)),'utf8');
const styles=read('src/midC18SecondarySurfaceRefinement.css');
const diagnostic=read('src/ForecastSourceDiagnostics.tsx');
const summaryCss="html[data-mid-design='next'] .forecast-source-diagnostics>summary";

describe('MID Design 115 · readable and accessible forecast source details',()=>{
 it('preserves the native disclosure and meteorological provenance',()=>{
  expect(diagnostic).toContain('<details className="forecast-source-diagnostics">');
  expect(diagnostic).toContain('Quellen &amp; Gewichtung</span></summary>');
  expect(diagnostic).toContain('forecast-source-weight-list');
  expect(diagnostic).toContain('Niederschlagsmenge, -art, Wahrscheinlichkeit');
 });
 it('keeps plain-language canonical forecast time series',()=>{
  expect(diagnostic).toContain('die finale Stundenprognose und die 15-Minuten-Wetter- und Niederschlagsreihe');
  expect(diagnostic).not.toContain('<code>displayHours</code>');
  expect(diagnostic).not.toContain('<code>displayMinutes15</code>');
  expect(diagnostic).toContain('Kanonischer Ablauf:');
 });
 it('adds effective 44px min touch height without editing the fingerprint-protected CSS cascade',()=>{
  expect(styles.split(summaryCss)).toHaveLength(2);
  const marker=styles.indexOf(summaryCss);
  const rule=styles.slice(marker,styles.indexOf('}',marker)+1);
  const padding=/padding:(\d+)px 9px!important;/.exec(rule);
  const child=/<summary><span style=\{\{display:'inline-flex',alignItems:'center',minHeight:(\d+)\}\}>/.exec(diagnostic);
  expect(rule).toContain('min-height:36px!important;');
  expect(rule).toContain('var(--mid-surface-raised)');
  expect(padding).not.toBeNull();
  expect(child).not.toBeNull();
  expect(Number(child?.[1])+2*Number(padding?.[1])).toBeGreaterThanOrEqual(44);
 });
});

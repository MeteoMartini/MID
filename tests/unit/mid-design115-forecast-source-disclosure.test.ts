import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=(path:string)=>readFileSync(fileURLToPath(new URL('../../'+path,import.meta.url)),'utf8');
const styles=read('src/midC18SecondarySurfaceRefinement.css');
const diagnostic=read('src/ForecastSourceDiagnostics.tsx');
const name='html[data-mid-design=\'next\'] .forecast-source-diagnostics>summary';

describe('MID Design 115 · readable and accessible forecast source details',()=>{
 it('preserves the existing native disclosure and source-level details',()=>{
  expect(diagnostic).toContain('<details className="forecast-source-diagnostics">');
  expect(diagnostic).toContain('<summary>Quellen &amp; Gewichtung</summary>');
  expect(diagnostic).toContain('forecast-source-weight-list');
  expect(diagnostic).toContain('Niederschlagsmenge, -art, Wahrscheinlichkeit');
 });
 it('explains forecast timelines without user-facing internal variable names',()=>{
  expect(diagnostic).toContain('die finale Stundenprognose und die 15-Minuten-Wetter- und Niederschlagsreihe');
  expect(diagnostic).not.toContain('<code>displayHours</code>');
  expect(diagnostic).not.toContain('<code>displayMinutes15</code>');
  expect(diagnostic).toContain('Kanonischer Ablauf:');
 });
 it('enforces at least 44px for the modern source disclosure summary',()=>{
  expect(styles.split(name)).toHaveLength(2);
  const marker=styles.indexOf(name);
  const target=styles.slice(marker,styles.indexOf('}',marker)+1);
  expect(target).toContain('min-height:44px!important;');
  expect(target).not.toContain('min-height:36px!important;');
  expect(target).toContain('padding:6px 9px!important;');
  expect(target).toContain('var(--mid-surface-raised)');
 });
});

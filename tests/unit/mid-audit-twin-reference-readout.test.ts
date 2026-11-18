import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {formatTwinReferenceReadout} from '../../src/twinReferenceReadout';

describe('MID PDF Audit · independent observed reference does not display NaN or fictitious zero',()=>{
 it('renders a gust-only archived observation day explicitly as two measurement gaps',()=>{
  expect(formatTwinReferenceReadout({max:NaN,min:NaN,precipitation:NaN}))
   .toBe('Temperatur nicht gemessen · Niederschlag nicht gemessen');
 });
 it('distinguishes a genuinely observed 0 mm from missing precipitation',()=>{
  expect(formatTwinReferenceReadout({max:14,min:5,precipitation:0}))
   .toBe('5–14 °C · 0 mm');
  expect(formatTwinReferenceReadout({max:14,min:5,precipitation:null}))
   .toBe('5–14 °C · Niederschlag nicht gemessen');
 });
 it('keeps real rain visible when minimum or maximum temperature is missing',()=>{
  expect(formatTwinReferenceReadout({max:null,min:4,precipitation:2}))
   .toBe('Temperatur nicht gemessen · 2 mm');
  expect(formatTwinReferenceReadout({max:11,min:null,precipitation:0}))
   .toBe('Temperatur nicht gemessen · 0 mm');
 });
 it('rejects unphysical and JavaScript-coercible strings without inventing observations',()=>{
  expect(formatTwinReferenceReadout({max:2,min:12,precipitation:-1}))
   .toBe('Temperatur nicht gemessen · Niederschlag nicht gemessen');
  expect(formatTwinReferenceReadout({max:'15',min:5,precipitation:'0'}))
   .toBe('Temperatur nicht gemessen · Niederschlag nicht gemessen');
 });
 it('preserves valid temperature and extreme precipitation readings unmodified',()=>{
  const result=formatTwinReferenceReadout({max:46,min:-28.5,precipitation:250});
  expect(result).toContain('-29–46 °C');
  expect(result).toContain('250 mm');
  expect(result).not.toContain('nicht gemessen');
 });
 it('uses the formatter on the existing responsive React surface and keeps source provenance',()=>{
  const code=readFileSync(new URL('../../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8');
  expect(code).toContain("import {formatTwinReferenceReadout} from './twinReferenceReadout'");
  expect(code).toContain('{formatTwinReferenceReadout(latest.reference)}<small>{latest.reference.source}</small>');
  expect(code).not.toContain('Math.round(latest.reference.min)');
  expect(code).not.toContain("formatWeatherValue(latest.reference.precipitation,'precipitation')");
 });
});

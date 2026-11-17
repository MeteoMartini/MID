/**
 * Source-level reflow contract for the ensemble parameter detail rows.
 * Live viewport, text zoom, WebKit and VoiceOver still require separate QA.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const source=readFileSync(fileURLToPath(new URL('../../src/ForecastConfidence.tsx',import.meta.url)),'utf8');
const details=source.split('export function EnsembleAssessmentDetails(')[1]
 ?.split('export function ForecastConfidenceInfoHint(')[0]??'';
const rows=details.match(/<dt style=\{\{[^]*?<\/dt>/g)??[];

describe('MID Design 1.10 ensemble detail reflow',()=>{
 it('keeps the canonical source and parameter assessment labels',()=>{
  expect(details).not.toBe('');
  expect(details).toContain('parameter.label');
  expect(details).toContain("parameter.agreement==='unknown'?'nicht bewertbar'");
  expect(details).toContain('Datenabdeckung unbekannt');
  expect(details).toContain('AGREEMENT_COLOR[parameter.agreement]');
 });
 it('allows long names and confidence values to reflow instead of widening a mobile panel',()=>{
  expect(rows).toHaveLength(1);
  const row=rows[0];
  expect(row).toContain("flexWrap:'wrap'");
  expect(row).toContain('minWidth:0');
  expect(row).toContain("alignItems:'baseline'");
  expect(row.match(/overflowWrap:'anywhere'/g)).toHaveLength(2);
  expect(row.match(/maxWidth:'100%'/g)).toHaveLength(2);
  expect(row).not.toContain("whiteSpace:'nowrap'");
  expect(row).not.toContain('textOverflow');
 });
 it('scales detail text with the root preference instead of fixing it to 12px',()=>{
  expect(details).toContain("fontSize:'0.875rem'");
  expect(details).not.toContain('fontSize:12');
  expect(details).toContain("lineHeight:1.45");
 });
 it('exposes a 44px methodology disclosure target without changing its content',()=>{
  expect(details).toContain("<details><summary style={{minHeight:44,display:'flex',alignItems:'center',cursor:'pointer'}}>");
  expect(details).toContain('Methodik, Datenstand und Kalibrierung');
  expect(details).toContain('Die Gesamtbewertung ist eine gewichtete robuste Aggregation');
 });
});

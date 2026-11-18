/**
 * MID Design114: model-map scale layout changes must never alter numeric values,
 * units, mode selection or disabled-state handling.
 * Chromium container-width proof is separate from these SSR/style contracts.
 */
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';
import ModelMapScaleLegend from '../../src/ModelMapScaleLegend';
import type {MapColorScale} from '../../src/modelMapColorScale';

const css=readFileSync(fileURLToPath(new URL('../../src/modelMapScaleLegend.css',import.meta.url)),'utf8');
const scale:MapColorScale={mode:'absolute',stops:[[0,'#0055ff'],[100,'#ff3300']],minimum:0,maximum:100,categorical:false};
const range:MapColorScale={...scale,mode:'field'};
const settings=(overrides:Record<string,unknown>={})=>({
 label:'Niederschlagsintensität und Modellkartenwert',unit:'mm/1 h',scale,range,
 format:(value:number)=>value.toFixed(1),onModeChange:(_mode:'field'|'absolute')=>undefined,...overrides
});
const render=(overrides:Record<string,unknown>={})=>renderToStaticMarkup(createElement(ModelMapScaleLegend,settings(overrides)));

describe('MID Design114 container-reflowed map-scale mode controls',()=>{
 it('uses a named inline-size component container and preserves the mobile viewport fallback',()=>{
  expect(css).toContain('container:mid-model-map-legend/inline-size');
  expect(css).toContain('@container mid-model-map-legend (max-width:460px)');
  expect(css).toContain('.mid-model-map-legend__header{flex-direction:column;align-items:stretch;gap:8px}');
  expect(css).toContain('.mid-model-map-legend__modes{flex:0 0 auto;width:100%}');
  expect(css).toContain('@media(max-width:560px)');
 });
 it('keeps legible mode words at 200 percent root text scale without changing touch sizing',()=>{
  expect(css).toContain('font-size:.75rem');
  expect(css).toContain('white-space:normal;overflow-wrap:anywhere;text-align:center;touch-action:manipulation');
  expect(css).toContain('min-height:44px!important');
  expect(css).not.toContain('white-space:nowrap;touch-action:manipulation;cursor:pointer');
 });
 it('preserves the real two-button switch with pressed state, label, unit and numeric scale',()=>{
  const html=render();
  expect(html).toContain('Niederschlagsintensität und Modellkartenwert');
  expect(html).toContain('Einheit <b class="mid-model-map-legend__unit-value">mm/1 h</b>');
  expect(html).toContain('role="group" aria-label="Skalenmodus"');
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('Wertebereich');
  expect(html).toContain('Feste Skala');
  expect(html).toContain('0.0');
  expect(html).toContain('50.0');
  expect(html).toContain('100.0');
  expect(html).toContain('Feste Skala · gleiche Farben entsprechen gleichen Werten.');
 });
 it('keeps user selection state and disables inappropriate modes without rewriting map values',()=>{
  const field=render({scale:range});
  expect(field).toContain('Wertebereich · gerundete Grenzen umfassen das gesamte Rasterfeld.');
  expect((field.match(/aria-pressed="true"/g)||[])).toHaveLength(1);
  const locked=render({locked:true});
  expect((locked.match(/disabled=""/g)||[])).toHaveLength(2);
  expect(locked).toContain('Animation: feste Skala für vergleichbare Farben.');
  const unavailable=render({range:scale});
  expect(unavailable).toContain('Keine räumlichen Wertunterschiede · feste Skala.');
  expect((unavailable.match(/disabled=""/g)||[])).toHaveLength(1);
 });
 it('retains source hierarchy and canonical tokens, without alternate weather or color logic',()=>{
  expect(css).toContain('background:var(--surface)');
  expect(css).toContain('color:var(--text)');
  expect(css).toContain('border-color:var(--primary)');
  expect(css).toContain('.mid-model-map-legend__mode:focus-visible{outline:2px solid var(--primary)');
  const html=render();
  expect(html).toContain('role="img"');
  expect(html).toContain('aria-label="Farbskala für Niederschlagsintensität und Modellkartenwert, Werte in mm/1 h"');
  expect(html).toContain('linear-gradient');
 });
});

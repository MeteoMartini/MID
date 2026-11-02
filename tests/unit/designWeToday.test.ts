import {readFileSync} from 'node:fs';
// MID uses TypeScript 7 to typecheck; the legacy compiler AST remains in the pinned TS6 Strada alias.
import * as ts from 'typescript-strada';
import postcss from 'postcss';
import {execFileSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

const cockpit=readFileSync(new URL('../../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../../src/midDesignWeToday.css',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../../src/styles-src/presentation-order.json',import.meta.url),'utf8')) as {sources:string[]};

describe('Design-WE Heute (read-only source assertions)',()=>{
 it('parses the complete real TSX chart source and the active CSS layer without syntax errors',()=>{
  const tree=ts.createSourceFile('ForecastCockpit.tsx',cockpit,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  expect(tree.parseDiagnostics.map(issue=>ts.flattenDiagnosticMessageText(issue.messageText,' '))).toEqual([]);
  expect(()=>postcss.parse(css,{from:'midDesignWeToday.css'})).not.toThrow();
 });

 it('executes the mandatory release regression without bypassing its baseline checks',()=>{
  const output=execFileSync(process.execPath,['scripts/test-design-we-today-compact-0985412.mjs'],{cwd:process.cwd(),encoding:'utf8',timeout:12000});
  expect(output).toContain('MID Design-WE Heute:');
 });

 it('keeps skybar and cloud lanes physically above temperature, without replacing the shared time axis',()=>{
  const ordered=['skyBandTop=profileY(50)','cloudTop=profileY(101)','tempTop=profileY(150)','precipTop=profileY(321)','windTop=profileY(406)','pressureTop=profileY(498)'].map(token=>cockpit.indexOf(token));
  expect(ordered.every((index)=>index>=0)).toBe(true);
  expect(ordered).toEqual([...ordered].sort((a,b)=>a-b));
  expect(cockpit).toContain('data-mid-skybar="profile"');
  expect(cockpit).toContain('profileXForEpoch(point.epoch)');
  expect(cockpit).toContain('shortTermCloudLayerTriplet(selectedPoint)');
 });
 it('highlights parameter lanes without hiding source weather/cloud/hazard content',()=>{
  expect(cockpit).toContain('data-mid-chart-focus={profileFocus}');
  expect(cockpit).toContain('aria-pressed={profileFocus===option.key}');
  expect(css).toContain(".cockpit-meteogram-pro__canvas[data-mid-chart-focus='temperature']");
  expect(css).toContain(".cockpit-meteogram-pro__canvas[data-mid-chart-focus='precipitation']");
  expect(css).toContain(".cockpit-meteogram-pro__canvas[data-mid-chart-focus='wind']");
  expect(css).toContain('.mid-we-focus-indicator');
  expect(css).toContain("opacity:.20!important;");
  expect(css).toContain(".mid-we-parameter-controls>button[aria-pressed='true']");
  expect(css).toContain('.profile-sky-strip');
  expect(css).toContain('.cloud-opacity-band');
  expect(css).not.toMatch(/\.profile-sky-strip\s*\{\s*display\s*:\s*none/);
 });
 it('keeps missing numeric values distinct from true zero in the selected-hour preview',()=>{
  expect(cockpit).toContain('shortTermKnownPrecipitationLabel(selectedPoint)');
  expect(cockpit).toContain('shortTermKnownProbabilityLabel(selectedPoint.probability)');
  expect(cockpit).toContain('Number.isFinite(selectedPoint.pressure)');
  expect(cockpit).toContain('Number.isFinite(selectedPoint.wind)');
  expect(cockpit).toContain('Number.isFinite(selectedPoint.apparent)');
  expect(cockpit).toContain('Number.isFinite(selectedPoint.temperature)');
  expect(cockpit).not.toContain('selectedPoint.pressure||0');
 });
 it('exposes the selected 15-minute precipitation, probability and wind on compact phones without fabricating zeros',()=>{
  expect(cockpit).toContain('const selectedNow90Point=now90.find(point=>point.id===now90ExpandedId)??null');
  expect(cockpit).toContain('if(now90ExpandedId===item.id){setNow90ExpandedId(null)}');
  expect(cockpit).toContain('aria-expanded={now90ExpandedId===item.id}');
  expect(cockpit).toContain('aria-label="Details zum ausgewählten Viertelstundenpunkt"');
  expect(cockpit).toContain('shortTermKnownPrecipitationLabel(selectedNow90Point)');
  expect(cockpit).toContain('shortTermKnownProbabilityLabel(selectedNow90Point.probability)');
  expect(cockpit).toContain("Number.isFinite(selectedNow90Point.wind)?wind(selectedNow90Point.wind,unit):'n. v.'");
  expect(cockpit).toContain("Number.isFinite(selectedNow90Point.gust)?wind(selectedNow90Point.gust,unit):'n. v.'");
  expect(css).toContain('.mid-we-now90-selected');
  expect(css).toContain('@media(max-width:620px)');
 });
 it('keeps complete hourly detail behind an operable, local persistence-safe disclosure',()=>{
  expect(cockpit).toContain("useDisplayPreference('ForecastCockpit.profileFullDetails'");
  expect(cockpit).toContain('aria-expanded={profileFullDetails}');
  expect(cockpit).toContain('className="cockpit-meteogram-pro__tooltip-content" hidden={!profileFullDetails}');
  expect(css).toContain('.cockpit-meteogram-pro__tooltip-content[hidden]{display:none!important}');
  expect(cockpit).toContain('className={`cockpit-hourly-preview');
  expect(cockpit).toContain('setHourlyExpanded(value=>!value)');
 });
 it('registers the responsive stylesheet last and provides a small-screen accessible control layer',()=>{
  expect(manifest.sources.at(-1)).toBe('src/midC48TabletTimeline.css');
  expect(cockpit).toContain("import('./midDesignWeToday.css')");
  expect(manifest.sources).not.toContain('src/midDesignWeToday.css');
  expect(css).toContain("html[data-mid-design='next']:root .forecast-cockpit .cockpit-weather-profile[data-mid-we-today='true']>.cockpit-meteogram-pro__head>.cockpit-weather-profile__toolbar");
  expect(css).toContain('width:100%!important;max-width:100%!important;min-width:0!important;');
  for(const part of ['@media(max-width:959px)','@media(max-width:620px)','@media(max-width:350px)','@media(prefers-reduced-motion:reduce)','min-height:44px',':focus-visible','--mid-we-focus'])expect(css).toContain(part);
 });
});

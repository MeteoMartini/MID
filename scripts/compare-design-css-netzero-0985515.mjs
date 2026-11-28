#!/usr/bin/env node
/**
 * MID CSS-net-zero preflight for the Design Evolution project.
 *
 * Reads two REAL artifacts/build-budget.json (schema 2) emitted by the existing
 * scripts/check-build-budget.mjs. This check is intentionally read-only.
 * Source SHA, lockfile/toolchain equality and browser parity MUST be proven by
 * the caller/CI; arbitrary JSON files are not provenance attestations.
 *
 * Run: node scripts/compare-design-css-netzero-0985515.mjs \
 *        <stable-build-budget.json> <candidate-build-budget.json>
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const METRICS=[
 ['initialCssBytes','Start-CSS raw'],
 ['initialCssGzipBytes','Start-CSS gzip'],
 ['initialCssBrotliBytes','Start-CSS Brotli'],
 ['cssRawBytes','Gesamt-CSS raw'],
 ['cssGzipBytes','Gesamt-CSS gzip'],
 ['cssBrotliBytes','Gesamt-CSS Brotli'],
 ['cssFileCount','CSS-Asset-Anzahl'],
 ['initialCssFileCount','Start-CSS-Asset-Anzahl'],
 ['maxCssFileBytes','Groesstes CSS-Asset raw'],
 ['maxCssFileGzipBytes','Groesstes CSS-Asset gzip'],
];

function nonnegative(value,description){
 if(!Number.isSafeInteger(value)||value<0)throw Error(`Ungueltiges ${description}: erwartete nichtnegative ganze Zahl`);
 return value;
}
function total(rows,field){return rows.reduce((sum,row)=>sum+nonnegative(row[field],`${field} of ${row.file}`),0)}
export function cssBuildEvidence(report){
 if(!report||report.schema!==2||report.ok!==true||!report.totals||!Array.isArray(report.assets)||!Array.isArray(report.initialCssAssets)){
  throw Error('Build-Evidence ungueltig: benoetigt erfolgreichen check-build-budget schema 2 mit CSS-Assets');
 }
 const assets=report.assets.filter(item=>item.extension==='.css');
 if(!assets.length||assets.some(x=>typeof x.file!=='string'||!x.file.endsWith('.css'))){
  throw Error('CSS-Asset-Inventar fehlt oder enthaelt ungueltige Namen');
 }
 const byName=new Map();
 for(const a of assets){
  if(byName.has(a.file))throw Error('Doppeltes CSS-Asset: '+a.file);
  byName.set(a.file,a);
 }
 const startFiles=new Set();
 for(const a of report.initialCssAssets){
  if(typeof a.file!=='string'||startFiles.has(a.file)||!byName.has(a.file)){
   throw Error('Start-CSS-Inventar ungueltig oder nicht im Gesamt-CSS enthalten');
  }
  startFiles.add(a.file);
  const full=byName.get(a.file);
  for(const p of ['bytes','gzipBytes','brotliBytes']){
   if(nonnegative(a[p],`Start-CSS ${p}`)!==nonnegative(full[p],`CSS ${p}`)){
    throw Error(`Start-CSS-Asset-Drift in ${a.file}: ${p}`);
   }
  }
 }
 if(!startFiles.size)throw Error('Keine Start-CSS-Assets: Build nicht nachweisbar');
 const t=report.totals;
 const actual={
  initialCssBytes:total(report.initialCssAssets,'bytes'),
  initialCssGzipBytes:total(report.initialCssAssets,'gzipBytes'),
  initialCssBrotliBytes:total(report.initialCssAssets,'brotliBytes'),
  cssRawBytes:total(assets,'bytes'),
  cssGzipBytes:total(assets,'gzipBytes'),
  cssBrotliBytes:total(assets,'brotliBytes'),
  cssFileCount:assets.length,
  initialCssFileCount:startFiles.size,
  maxCssFileBytes:Math.max(...assets.map(x=>x.bytes)),
  maxCssFileGzipBytes:Math.max(...assets.map(x=>x.gzipBytes)),
 };
 for(const k of ['initialCssBytes','initialCssGzipBytes','initialCssBrotliBytes','cssGzipBytes','initialCssFileCount']){
  if(nonnegative(t[k],`totals.${k}`)!==actual[k])throw Error(`Inkonsequente Build-Evidence: totals.${k} stimmt nicht mit Asset-Inventar ueberein`);
 }
 return actual;
}

export function compareCssNetZero(stable,candidate){
 const base=cssBuildEvidence(stable),head=cssBuildEvidence(candidate);
 const rows=METRICS.map(([key,label])=>({key,label,stable:base[key],candidate:head[key],delta:head[key]-base[key],ok:head[key]<=base[key]}));
 return {
  schema:'mid.design-css-netzero-qa.v1',
  status:rows.every(row=>row.ok)?'PASS_CSS_NET_ZERO_ARTIFACTS':'FAIL_CSS_GROWTH',
  rows,
  proven:'Nur korrekte, vergleichbare Build-Budget-JSON-Struktur und CSS-Byte-Nichtwachstum',
  notProven:'Stable-/Head-SHA, identische Toolchain/Lockfile, CSS-Kaskade, Lazy-Ladeverhalten, Offline, visueller Browser-/iOS-Befund, LCP/INP, Style-Recalc',
 };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length!==4)throw Error('Verwendung: node scripts/compare-design-css-netzero-0985515.mjs <stable-budget.json> <candidate-budget.json>');
  const stable=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const candidate=JSON.parse(readFileSync(process.argv[3],'utf8'));
  const result=compareCssNetZero(stable,candidate);
  for(const row of result.rows)console.log(`${row.ok?'PASS':'FAIL'} ${row.label}: ${row.stable} -> ${row.candidate} (${row.delta>=0?'+':''}${row.delta})`);
  console.log(result.status);
  console.log('HINWEIS: ',result.notProven);
  if(result.status!=='PASS_CSS_NET_ZERO_ARTIFACTS')process.exitCode=1;
 }catch(error){console.error('FAIL_CSS_EVIDENCE: '+(error instanceof Error?error.message:String(error)));process.exitCode=1}
}

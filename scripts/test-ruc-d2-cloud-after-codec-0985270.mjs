import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync('python3',['-m','unittest','test_augment_compressed_synoptic'],{cwd:'tools/ruc',stdio:'inherit',timeout:120000});
const script=readFileSync('tools/ruc/augment_compressed_synoptic.py','utf8');
const workflow=readFileSync('ci/github/workflows/mid-ruc-preprocess.yml','utf8');
const mirror=readFileSync('.github/workflows/mid-ruc-preprocess.yml','utf8');
assert.equal(workflow,mirror,'Producer and controlled mirror must be byte-identical');
assert.ok(script.includes("pages-lossless-v1")&&script.includes("sourceRawUnchanged"),'Only explicitly active compressed snapshots receive optional frames');
const preparer=readFileSync('tools/ruc/prepare_ruc_pages.py','utf8');
const save=preparer.indexOf("full_index.write_bytes(fields_index.read_bytes())");
const projection=preparer.indexOf("fit_synoptic_budget(payload,PAGES_RUC_BUDGET_BYTES");
const raw=workflow.indexOf('python tools/ruc/prepare_ruc_pages.py --source .ruc-out --output .ruc-pages');
const activate=workflow.indexOf('python tools/ruc/activate_lossless_snapshot.py');
const extra=workflow.indexOf('python tools/ruc/augment_compressed_synoptic.py');
const deploy=workflow.indexOf('mv .ruc-compressed/ruc .ruc-pages/ruc');
assert.ok(save>=0&&projection>save&&raw>=0&&raw<activate&&activate<extra&&extra<deploy,'The full source index must be saved immediately before raw budget projection; extras may only be admitted after complete codec proof');
assert.ok(workflow.includes("mid-ruc-rollback-")&&workflow.includes('RUC-Rohsnapshot bei Codec-Ausfall wiederherstellen'),'Immutable raw rollback remains mandatory');
const browser=readFileSync('src/nativeSynopticFields.ts','utf8');
const cache=readFileSync('tools/ruc/build_synoptic_fields.py','utf8');
const browserPointer=String.raw`key.match(/^runs\/[a-zA-Z0-9_-]+__synoptic_(?:optional_d2_)?([a-f0-9]{16})\/synoptic-fields\/index.json$/)`;
const cachedPointer=String.raw`re.fullmatch(r'runs/[a-zA-Z0-9_-]+__synoptic_(?:optional_d2_)?([a-f0-9]{16})/synoptic-fields/index.json',key)`;
assert.ok(browser.includes(browserPointer),'Browser must SHA-verify standard immutable synoptic index');
assert.ok(cache.includes(cachedPointer),'DWD native synoptic cache must SHA-verify matching index');
assert.ok(script.includes("prefix=f'runs/{clean_run}__synoptic_{sha(index_bytes)[:16]}/synoptic-fields'"),'Optional index must follow identical browser/cache path namespace');
assert.ok(script.includes('pointer_match.group(1)!=sha(index_bytes)[:16]'),'Publisher must reject mismatching 16-hex index digest');
const generated=JSON.parse(execFileSync('python3',['-c',[
 'import json, tempfile',
 'from pathlib import Path',
 'from test_augment_compressed_synoptic import setup',
 'from augment_compressed_synoptic import augment,sha',
 'with tempfile.TemporaryDirectory() as td:',
 '  root=Path(td); snap,index,source,_=setup(root); proof=augment(snap,index,source)',
 "  key=json.loads((snap/'latest.json').read_text())['synopticFields']['key']",
 "  print(json.dumps({'key':key,'digest':sha((snap/key).read_bytes()),'hours':proof['admittedHours']}))"
 ].join('\n')],{cwd:'tools/ruc',encoding:'utf8',timeout:60000}));
const pointer=/^runs\/[a-zA-Z0-9_-]+__synoptic_(?:optional_d2_)?([a-f0-9]{16})\/synoptic-fields\/index\.json$/;
const match=generated.key.match(pointer);
assert.ok(match,'Real augmented manifest URL would be rejected by browser');
assert.equal(match[1],generated.digest.slice(0,16),'Real augmented SHA digest is not the URL');
assert.deepEqual(generated.hours,[13,14,16,17],'No native optional D2 terms in golden index');
const legacyKey=generated.key.replace('__synoptic_', '__synoptic_optional_d2_');
const legacy=legacyKey.match(pointer);
assert.ok(legacy,'Existing .271 optional D2 index must remain readable by browser/GRIB cache');
assert.equal(legacy[1],generated.digest.slice(0,16),'Legacy index path must retain exact content digest');
assert.ok(!pointer.test(generated.key.replace('__synoptic_', '__synoptic_unverified_')),'Unknown index namespaces must remain rejected');

console.log('MID .270 additional ICON-D2 terms after complete compression, source provenance, immutable index and rollback gates OK');

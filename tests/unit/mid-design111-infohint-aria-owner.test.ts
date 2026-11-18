import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {AppInfoHint} from '../../src/AppInfoPopover';

const source=readFileSync(fileURLToPath(new URL('../../src/AppInfoPopover.tsx',import.meta.url)),'utf8');
const sample=(name:string)=>createElement(AppInfoHint,{label:name,showClose:true,touchTargetSize:44},
 createElement('p',null,'Synthetischer QA-Inhalt – keine Wetter- oder Warnmeldung'));

describe('MID shared AppInfoHint portal ownership and accessibility',()=>{
 it('keeps two independent closed info buttons without stale ID references',()=>{
  const html=renderToStaticMarkup(createElement('main',null,sample('Hinweis A'),sample('Hinweis B')));
  expect((html.match(/aria-expanded="false"/g)||[])).toHaveLength(2);
  expect((html.match(/aria-haspopup="dialog"/g)||[])).toHaveLength(2);
  expect((html.match(/aria-label="Hinweis [AB]"/g)||[])).toHaveLength(2);
  expect(html).not.toContain('aria-controls=');
  expect(html).not.toContain('role="dialog"');
  expect(html).toContain('width:44px;height:44px');
 });
 it('binds a unique React useId to the mounted portal only while open',()=>{
  expect(source).toContain('popoverId=useId()');
  expect(source).toContain('aria-controls={open?popoverId:undefined}');
  expect(source).toContain('id={popoverId}');
  expect(source).toContain('role="dialog" ariaLabel={label}');
  expect(source).toContain('aria-expanded={open} aria-haspopup="dialog"');
 });
 it('keeps stable dismiss callback identity and all canonical closure paths',()=>{
  expect(source).toContain('const close=useCallback(()=>setOpen(false),[])');
  expect(source).toContain('onClose={close}');
  expect(source).toContain('className="thunder-info-close" onClick={close}');
  expect(source).toContain('setOpen(value=>!value)');
  expect(source).not.toContain('onClose={()=>setOpen(false)}');
  expect(source).not.toContain('onClick={()=>setOpen(false)}');
 });
 it('keeps the opt-in actual-component browser runner syntactically valid and explicitly non-gating',()=>{
  const runnerPath=fileURLToPath(new URL('../../scripts/qa/verifyDesign111InfoHintBrowser.mjs',import.meta.url));
  execFileSync(process.execPath,['--check',runnerPath],{stdio:'pipe',timeout:10000});
  const runner=readFileSync(runnerPath,'utf8');
  const fixture=readFileSync(fileURLToPath(new URL('../../tests/visual/design111-infohint-qa.tsx',import.meta.url)),'utf8');
  expect(fixture).toContain("import {AppInfoHint} from '../../src/AppInfoPopover'");
  expect(fixture).toContain('Info-Test eins');
  expect(fixture).toContain('Info-Test zwei');
  expect(runner).toContain('aria-controls');
  expect(runner).toContain("page.keyboard.press('Escape')");
  expect(runner).toContain("page.keyboard.press('Enter')");
  expect(runner).toContain('report.ready=true');
  expect(runner).not.toContain('process.exit(0)');
  expect(runner).not.toContain('test.skip');
 });
});

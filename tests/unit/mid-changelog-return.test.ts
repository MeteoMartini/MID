import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const entry=read('src/main.tsx'),overlay=read('src/changelogOverlay.ts'),css=read('src/changelogOverlay.css');
describe('MID changelog return navigation',()=>{
 it('intercepts the bundled changelog instead of opening a second PWA tab',()=>{
  expect(entry).toContain("link.removeAttribute('target')");
  expect(entry).toContain("link.removeAttribute('rel')");
  expect(entry).toContain('event.preventDefault()');
  expect(entry).toContain("import('./changelogOverlay')");
  expect(entry).toContain('openMidChangelog(target)');
  expect(entry).not.toContain("link.target='_blank'");
 });
 it('has a close button and native modal Escape behavior with focus restoration',()=>{
  expect(overlay).toContain('dialog.showModal()');
  expect(overlay).toContain('Zurück zu MID');
  expect(overlay).toContain("returnButton.addEventListener('click',close)");
  expect(overlay).toContain("dialog.addEventListener('close'");
  expect(overlay).toContain('previousFocus.focus({preventScroll:true})');
  expect(overlay).toContain('controller.abort()');
 });
 it('keeps remote Markdown untrusted and handles offline errors',()=>{
  expect(overlay).toContain('element.textContent=match[1]');
  expect(overlay).toContain("pre.textContent=code.join");
  expect(overlay).toContain('response.ok');
  expect(overlay).toContain('Unerwartetes Changelog-Format');
  expect(overlay).toContain('Der Changelog ist momentan nicht verfügbar.');
  expect(overlay).toContain('processed<160');
  expect(overlay).toContain('Ältere Änderungen laden');
  expect(overlay).not.toMatch(/innerHTML\s*=\s*markdown/);
 });
 it('respects small screens, 44px touch targets, dark mode and safe areas',()=>{
  expect(css).toContain('min-height:44px');
  expect(css).toContain('100dvh');
  expect(css).toContain('safe-area-inset-bottom');
  expect(css).toContain(':root[data-theme=dark]');
  expect(css).toContain('focus-visible');
 });
});

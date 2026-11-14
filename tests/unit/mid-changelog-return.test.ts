import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const app=read('src/App.tsx'),overlay=read('src/changelogOverlay.ts'),css=read('src/changelogOverlay.css'),main=read('src/main.tsx');
describe('MID changelog return navigation',()=>{
 it('uses a direct React link instead of a time-limited DOM observer',()=>{
  expect(app).toContain('CHANGELOG.md');
  expect(app).toContain('href={');
  expect(app).toContain('event.preventDefault()');
  expect(app).toContain("import('./changelogOverlay')");
  expect(app).toContain('openMidChangelog(');
  expect(app).not.toContain('target="_blank" rel="noreferrer">Changelog');
  expect(main).not.toContain('pointChangelogLinkToBundledRelease');
 });
 it('provides a close button, Escape and focus restoration',()=>{
  expect(overlay).toContain('dialog.showModal()');
  expect(overlay).toContain('Zurück zu MID');
  expect(overlay).toContain("returnButton.addEventListener('click',close)");
  expect(overlay).toContain("dialog.addEventListener('close'");
  expect(overlay).toContain('previousFocus.focus({preventScroll:true})');
  expect(overlay).toContain('controller.abort()');
 });
 it('does not run downloaded Markdown as HTML and handles loading errors',()=>{
  expect(overlay).toContain('element.textContent=match[1]');
  expect(overlay).toContain("pre.textContent=code.join");
  expect(overlay).toContain('response.ok');
  expect(overlay).toContain('Unerwartetes Changelog-Format');
  expect(overlay).toContain('Der Changelog ist momentan nicht verfügbar.');
  expect(overlay).toContain('processed<160');
  expect(overlay).toContain('Ältere Änderungen laden');
  expect(overlay).not.toMatch(/innerHTML\s*=\s*markdown/);
 });
 it('respects small screens, 44px touch targets, dark theme and safe areas',()=>{
  expect(css).toContain('min-height:44px');
  expect(css).toContain('100dvh');
  expect(css).toContain('safe-area-inset-bottom');
  expect(css).toContain(':root[data-theme=dark]');
  expect(css).toContain('focus-visible');
 });
});

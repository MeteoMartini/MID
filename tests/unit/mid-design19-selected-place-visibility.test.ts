import {describe,expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SelectedPlaceBar} from '../../src/SelectedPlaceBar';

const render=(name:string,tracked=false,hidden=false)=>
 renderToStaticMarkup(createElement(SelectedPlaceBar,{name,tracked,hidden}));

describe('MID Design19 – selected-place bar, full location/alias label across workspaces',()=>{
 it('keeps the original full name, title and polite status without truncation',()=>{
  const name='Nordrhein-Westfalen, Niederkassel-Rheidt, sehr ausführlich bezeichnetes Wetterbeobachtungsgebiet';
  const html=render(name);
  expect(html).toContain(name);
  expect(html).toContain('title="'+name+'"');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-label="Ausgewählter Ort"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toContain('…');
 });
 it('permits one arbitrarily long unbreakable place-name token to wrap within its own track',()=>{
  const name='SehrLangerUntrennbarerFavoritenName'.repeat(14);
  const html=render(name);
  expect(html).toContain(name);
  expect(html).toContain('min-width:0');
  expect(html).toContain('max-width:100%');
  expect(html).toContain('overflow-wrap:anywhere');
  expect(html).toContain('white-space:normal');
  expect(html).toContain('text-overflow:clip');
  expect(html).not.toContain('text-overflow:ellipsis');
 });
 it('retains full non-ASCII names, including accented and non-Latin place labels',()=>{
  const name='Łódź – Zürich – Reykjavík – 東京 – São Tomé';
  const html=render(name);
  expect(html).toContain(name);
  expect(html).toContain('title="'+name+'"');
 });
 it('preserves tracked-location status without inserting synthetic weather values',()=>{
  const html=render('Rheidt',true);
  expect(html).toMatch(/<strong[^>]+>Rheidt<\/strong><span>Standort<\/span>/);
  const visibleText=html.replace(/<[^>]*>/g,'');
  expect(visibleText).not.toMatch(/°C|mm\/h|0\s*%/);
 });
 it('omits the complete status region for hidden/search or absent location state',()=>{
  expect(render('Rheidt',false,true)).toBe('');
  expect(render('',false,false)).toBe('');
 });
 it('escapes hostile favorite aliases rather than allowing injected layout/markup',()=>{
  const name='<img src=x onerror=alert(1)> & "Ort"';
  const html=render(name);
  expect(html).not.toContain('<img');
  expect(html).not.toContain('<img src=x');
  expect(html).toContain('&lt;img');
  expect(html).toContain('&amp;');
  expect(html).toContain('&quot;');
 });
 it('renders a read-only location status in both tracking modes',()=>{
  for(const tracked of [false,true]){
   const html=render('Rheidt',tracked);
   expect(html).not.toMatch(/<(?:button|input|a|select)\b|\btabindex=/i);
  }
  expect(render('Rheidt',false)).not.toContain('<span>Standort</span>');
 });
 it('does not add JS listeners, timers, new network requests or a second favorite-state owner',()=>{
  const src=SelectedPlaceBar.toString();
  expect(src).not.toMatch(/setInterval|setTimeout|fetch\(|addEventListener|useEffect|useState|localStorage|scrollIntoView/);
 });
});

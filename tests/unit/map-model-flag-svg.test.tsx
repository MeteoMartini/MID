import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MapModelPicker,MapModelFlag} from '../../src/MapModelPicker';
import {groupedMapModelOptions,mapModelFlagCode} from '../../src/mapModelPresentation';

describe('MID country/EU flag pictograms: browser SVG, no OS emoji required',()=>{
 const examples=[
  ['icon-d2','DE'],['icon-d2-ruc','DE'],['icon-eu','DE'],['icon','DE'],
  ['aicon','DE'],['ifs','EU'],['gfs','US'],['gdps','CA']
 ] as const;
 it('assigns only confirmed source IDs, never guesses unknown nationalities',()=>{
  for(const [id,country] of examples)expect(mapModelFlagCode(id)).toBe(country);
  expect(mapModelFlagCode('unexpected-local-model')).toBeNull();
 });
 it('renders locally drawn vector graphics, not external images or emoji',()=>{
  for(const [id] of examples){
   const html=renderToStaticMarkup(<MapModelFlag modelId={id}/>);
   expect(html).toContain('<svg');
   expect(html).toContain('viewBox="0 0 30 20"');
   expect(html).toContain('aria-hidden="true"');
   expect(html).not.toContain('<img');
   expect(html).not.toContain('🇩🇪');
  }
  expect(renderToStaticMarkup(<MapModelFlag modelId="unknown"/>)).toBe('');
 });
 it('renders selected ID and visible SVG in both light/dark-neutral markup',()=>{
  const groups=groupedMapModelOptions([
   {id:'icon-d2',label:'DWD ICON-D2'},
   {id:'ifs',label:'ECMWF IFS'}
  ]);
  const html=renderToStaticMarkup(<MapModelPicker value="ifs" label="Modell für Parameter"
   groups={groups} onChange={()=>{}}/>);
  expect(html).toContain('aria-label="Modell für Parameter"');
  expect(html).toContain('data-model-id="ifs"');
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('ECMWF IFS');
  expect(html).toContain('mid-map-model-flag');
  expect(html).not.toContain('🇪🇺 ECMWF IFS');
 });
});

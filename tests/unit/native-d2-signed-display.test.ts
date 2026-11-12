import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const legacy=readFileSync(root+'src/NativeModelMap.tsx','utf8');
const unified=readFileSync(root+'src/UnifiedWeatherMap.tsx','utf8');
const index=readFileSync(root+'src/nativeD2FullDomain.ts','utf8');

describe('signed original ICON-D2 full-area display with existing native clients',()=>{
 it('retains field-derived map bounds and image quad instead of Germany cutout',()=>{
  expect(legacy).toContain('MapFitBounds south={field.lats[0]} west={field.lons[0]}');
  expect(legacy).toContain('bounds={[[field.lats[0],field.lons[0]],[field.lats.at(-1)!,field.lons.at(-1)!]]}');
  expect(unified).toContain('field?[[field.lats[0],field.lons[0]],[field.lats.at(-1)!,field.lons.at(-1)!]]');
  expect(index).toContain('D2_FULL_DOMAIN_SOURCE_CELLS=542040');
 });
 it('never mislabels unapproved regular remap as 542040-cell native release',()=>{
  expect(legacy).toContain("catalog?.index.schema==='mid.icon-d2.native-fields.v2'");
  expect(legacy).toContain('catalog.index.productionApproved===true');
  expect(legacy).toContain("field?.schema==='mid.icon-d2.native-field.v2'");
  expect(legacy).toContain('kryptografisch freigegebenes natives Vollgebiet');
  expect(legacy).toContain('DWD-Regular-Raster (Anbieter-Remapping), kein natives Vollgebiet');
 });
 it('does not fabricate gust accumulation duration for original v2 instant statistics',()=>{
  expect(legacy).toContain('Number.isFinite(ref?.intervalHours??NaN)');
  expect(legacy).toContain('Bezugsintervall ist aus dem veröffentlichten Originalfeld nicht ausgewiesen');
  expect(legacy).toContain('fehlende Zellen bleiben transparent');
 });
});

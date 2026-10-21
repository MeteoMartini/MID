import {describe,expect,it} from 'vitest';
import {requiresExtremeOutlookCanvasFallback} from '../../src/extremeOutlookRenderHealth';

const good={contourCount:3,polygonCount:3,hasFillLayer:true,hasSource:true,sourceLoaded:true,labelInView:true,renderedFeatureCount:2};
describe('Extremwetter-Kartenebene: modellierte Konturen erhalten',()=>{
 it('bevorzugt die vollständige native Ebene',()=>expect(requiresExtremeOutlookCanvasFallback(good)).toBe(false));
 it('erfindet bei null echten Konturen keine Ersatzfläche',()=>expect(requiresExtremeOutlookCanvasFallback({...good,contourCount:0,polygonCount:0,renderedFeatureCount:0})).toBe(false));
 it('erkennt auch teilweise leere GeoJSON-MultiPolygone',()=>expect(requiresExtremeOutlookCanvasFallback({...good,polygonCount:2})).toBe(true));
 it('unterscheidet fehlenden Layer und fehlende Quelle',()=>{
  expect(requiresExtremeOutlookCanvasFallback({...good,hasFillLayer:false})).toBe(true);
  expect(requiresExtremeOutlookCanvasFallback({...good,hasSource:false})).toBe(true);
 });
 it('schaltet bei ausstehender nativer Workerquelle in den Ersatzmodus',()=>expect(requiresExtremeOutlookCanvasFallback({...good,sourceLoaded:false})).toBe(true));
 it('nimmt einen leeren Paint-Query bei sichtbar projizierten Modelllabels ernst',()=>expect(requiresExtremeOutlookCanvasFallback({...good,renderedFeatureCount:0})).toBe(true));
 it('vermeidet Fehlalarm bei außerhalb des Bildausschnitts liegenden Konturen',()=>expect(requiresExtremeOutlookCanvasFallback({...good,labelInView:false,renderedFeatureCount:0})).toBe(false));
});

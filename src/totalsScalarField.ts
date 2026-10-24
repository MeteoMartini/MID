import type {ScalarRaster} from './nativeScalarAnnotations';
import type {TotalsData,TotalsFrame} from './precipitationTotals';

/** Adapt a verified total/observation frame without inventing a forecast identity.
 * All valid zeros remain dry zeros; only the published -1 observation sentinel
 * becomes non-finite, so contour cells touching NoData are never bridged.
 * The validity stamp is the actual end of the corresponding accumulation.
 */
export function totalsScalarField(data:TotalsData,frame:TotalsFrame):ScalarRaster{
 if(frame.values.length!==data.lats.length*data.lons.length||!Number.isFinite(data.scale)||data.scale<=0)
  throw new Error('Ungültige Niederschlagssummen-Geometrie');
 return {kind:'precipitation',unit:'mm',time:frame.validTo,scale:data.scale,
  lats:data.lats,lons:data.lons,values:frame.values.map(v=>v<0?NaN:v)};
}

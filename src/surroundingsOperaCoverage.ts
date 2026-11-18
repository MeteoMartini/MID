/** Coverage is the count of OPERA cells with actual source validity,
 * including valid 'undetect' cells. It is NOT the fraction of rainy pixels,
 * a precipitation probability, or proof of a complete regional raster.
 */
export type SurroundingsOperaCoverage={
 validPixels:number;
 totalPixels:number;
 fraction:number;
 kind:'none'|'partial'|'complete';
 percentageLabel:string;
};

/** Preserve even tiny positive source coverage as a visible partial warning.
 * Never render '0 %' for a partially covered scene or round 99.99 % to 100 %.
 */
export function summarizeSurroundingsOperaCoverage(
 validPixels:number,totalPixels:number
):SurroundingsOperaCoverage|undefined{
 if(!Number.isSafeInteger(validPixels)||!Number.isSafeInteger(totalPixels)||
    totalPixels<1||validPixels<0||validPixels>totalPixels)return undefined;
 const fraction=validPixels/totalPixels;
 const kind=validPixels===0?'none':validPixels===totalPixels?'complete':'partial';
 const percentageLabel=kind==='none'?'0 %':
  kind==='complete'?'100 %':
  fraction<.001?'< 0,1 %':
  `${(Math.floor(fraction*1000)/10).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})} %`;
 return {validPixels,totalPixels,fraction,kind,percentageLabel};
}

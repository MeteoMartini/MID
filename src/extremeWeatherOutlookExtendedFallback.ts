import {loadExtendedExtremeWeatherOutlook,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

/** Compatibility wrapper for callers of the previous lazy fallback module. */
export function loadExtendedExtremeWeatherOutlookFallback(signal?:AbortSignal):Promise<ExtremeWeatherOutlook>{
 return loadExtendedExtremeWeatherOutlook(signal);
}

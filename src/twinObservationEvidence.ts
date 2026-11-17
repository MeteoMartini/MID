/**
 * Archived independent observation evidence must be a genuine finite number.
 * JavaScript otherwise coerces JSON null and numeric strings to zero in the
 * event threshold / absolute-error paths. This would invent dry events.
 * No cap is imposed on legitimate extreme rain or temperature readings.
 */
export function isTwinVerifiedNonnegative(value:unknown):value is number{
 return typeof value==='number'&&Number.isFinite(value)&&value>=0;
}
export function isTwinVerifiedTemperaturePair(max:unknown,min:unknown):max is number{
 return typeof max==='number'&&typeof min==='number'&&
  Number.isFinite(max)&&Number.isFinite(min)&&max>=min;
}

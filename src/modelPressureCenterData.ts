export type ModelPressureCenter={type:'H'|'T';lat:number;lon:number;value:number;prominence:number};
export function validModelPressureCenters(value:unknown,lats:number[],lons:number[]):value is ModelPressureCenter[]{
 return Array.isArray(value)&&value.length<=16&&value.every(c=>c&&(c.type==='H'||c.type==='T')&&typeof c.lat==='number'&&typeof c.lon==='number'&&typeof c.value==='number'&&typeof c.prominence==='number'&&Number.isFinite(c.lat)&&Number.isFinite(c.lon)&&c.lat>=lats[0]&&c.lat<=lats.at(-1)!&&c.lon>=lons[0]&&c.lon<=lons.at(-1)!&&c.value>=850&&c.value<=1100&&c.prominence>=1.2&&c.prominence<=250);
}

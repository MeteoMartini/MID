import {describe,it,expect} from 'vitest';
import {createOperaLaeaProjector,createOperaRasterPointSampler,operaRasterPoint,type OperaProjection,type OperaRaster} from '../../src/OperaRasterSource';
// Frozen pre-optimization reference (Stable .528). Do not use the candidate as its own oracle.
function q(phi:number,e2:number){if(e2<=0)return 2*Math.sin(phi);const e=Math.sqrt(e2),sin=Math.sin(phi),denominator=1-e2*sin*sin;return(1-e2)*(sin/denominator-(1/(2*e))*Math.log((1-e*sin)/(1+e*sin)))}
function legacy(latDegrees:number,lonDegrees:number,projection:OperaProjection):[number,number]|null{
 const radians=Math.PI/180,phi=latDegrees*radians,lambda=lonDegrees*radians,phi0=projection.lat0*radians,lambda0=projection.lon0*radians,delta=lambda-lambda0;
 if(Number.isFinite(projection.authalicRadius)){const radius=projection.authalicRadius!,denominator=1+Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(delta);if(denominator<=1e-12)return null;const k=Math.sqrt(2/denominator);return[projection.x0+radius*k*Math.cos(phi)*Math.sin(delta),projection.y0+radius*k*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(delta))]}
 const qp=q(Math.PI/2,projection.e2),beta=Math.asin(Math.max(-1,Math.min(1,q(phi,projection.e2)/qp))),beta0=Math.asin(Math.max(-1,Math.min(1,q(phi0,projection.e2)/qp))),rq=projection.a*Math.sqrt(qp/2),m0=Math.cos(phi0)/Math.sqrt(1-projection.e2*Math.sin(phi0)**2),d=projection.a*m0/(rq*Math.cos(beta0)),denominator=1+Math.sin(beta0)*Math.sin(beta)+Math.cos(beta0)*Math.cos(beta)*Math.cos(delta);
 if(denominator<=1e-12)return null;const b=rq*Math.sqrt(2/denominator);return[projection.x0+b*d*Math.cos(beta)*Math.sin(delta),projection.y0+(b/d)*(Math.cos(beta0)*Math.sin(beta)-Math.sin(beta0)*Math.cos(beta)*Math.cos(delta))];
}
const base:OperaProjection={lat0:55,lon0:10,x0:1950000,y0:-2100000,a:6378137,e2:0.0066943799901413165};
describe('prepared original OPERA projection – exact operation preservation',()=>{
 it('matches the independent legacy coordinate oracle, including antipodes and both ellipsoidal/spherical branches',()=>{
  const projections=[base,{...base,e2:0.00669438002290},{...base,e2:0,authalicRadius:6371007.181},{...base,lat0:0,lon0:0,e2:0}];
  for(const p of projections){const project=createOperaLaeaProjector(p);for(let lat=-90;lat<=90;lat+=2)for(let lon=-180;lon<=180;lon+=3){const old=legacy(lat,lon,p),next=project(lat,lon);if(old===null||next===null){if(old!==next)throw Error('null mismatch')}else if(!Object.is(old[0],next[0])||!Object.is(old[1],next[1]))throw Error('coordinate mismatch '+lat+'/'+lon)}expect(project(-p.lat0,p.lon0+180)).toEqual(legacy(-p.lat0,p.lon0+180,p))}
 });
 it('preserves nodata, undetect, wet original cells and outside coverage',()=>{
  const projection={...base,lat0:0,lon0:0,x0:0,y0:0,e2:0,authalicRadius:6371000};
  const raster:OperaRaster={values:Uint8Array.from([255,0,80,100]),width:2,height:2,gain:.5,offset:-32,nodata:255,undetect:0,quantity:'DBZH',projection,minX:-1000,maxY:1000,xScale:1000,yScale:1000};
  const sample=createOperaRasterPointSampler(raster);
  for(const [lat,lon] of [[.004,-.004],[.004,.004],[-.004,-.004],[-.004,.004],[2,2]])expect(sample(lat,lon)).toEqual(operaRasterPoint(raster,lat,lon));
  expect(sample(.004,-.004).covered).toBe(false);expect(sample(.004,.004)).toMatchObject({covered:true,rate:0});expect(sample(-.004,-.004)).toMatchObject({covered:true,dbz:8});expect(sample(-.004,.004)).toMatchObject({covered:true,dbz:18});expect(sample(2,2).covered).toBe(false);
 });
});

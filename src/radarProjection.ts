export type RadarProjection={
 kind:'stere'|'laea';
 lat0:number;
 latTs:number;
 lon0:number;
 x0:number;
 y0:number;
 a:number;
 b:number;
 eccentricity:number;
 stereographicFactor:number;
};

const RAD=Math.PI/180;
const HALF_PI=Math.PI/2;

function parameter(definition:string,name:string,fallback:number):number{
 const match=definition.match(new RegExp(`(?:^|\\s)\\+${name}=([^\\s]+)`,'i'));
 const value=match?Number(match[1]):Number.NaN;
 return Number.isFinite(value)?value:fallback;
}

export function projectionFromDefinition(definition:string):RadarProjection|null{
 const normalized=String(definition||'').trim();
 if(!normalized)return null;
 const kind=/\+proj=laea\b/i.test(normalized)?'laea':/\+proj=stere\b/i.test(normalized)?'stere':null;
 if(!kind)return null;
 const a=parameter(normalized,'a',parameter(normalized,'R',6378137));
 const b=parameter(normalized,'b',a);
 const eccentricity=Math.sqrt(Math.max(0,1-(b*b)/(a*a)));
 const latTs=parameter(normalized,'lat_ts',60);
 const phiC=latTs*RAD;
 const sinPhiC=Math.sin(phiC);
 const e2=eccentricity*eccentricity;
 const mC=Math.cos(phiC)/Math.sqrt(1-e2*sinPhiC*sinPhiC);
 const tC=stereographicT(phiC,eccentricity);
 const stereographicFactor=kind==='stere'?a*mC/tC:0;
 return{
  kind,
  lat0:parameter(normalized,'lat_0',kind==='stere'?90:52),
  latTs,
  lon0:parameter(normalized,'lon_0',10),
  x0:parameter(normalized,'x_0',kind==='stere'?0:4321000),
  y0:parameter(normalized,'y_0',kind==='stere'?0:3210000),
  a,
  b,
  eccentricity,
  stereographicFactor,
 };
}

function stereographicT(phi:number,eccentricity:number):number{
 const sinPhi=Math.sin(phi);
 const ratio=(1-eccentricity*sinPhi)/(1+eccentricity*sinPhi);
 return Math.tan(Math.PI/4-phi/2)/Math.pow(Math.max(Number.EPSILON,ratio),eccentricity/2);
}


export function stereographicRadius(latitude:number,projection:RadarProjection):number|null{
 if(projection.kind!=='stere'||!Number.isFinite(latitude))return null;
 const phi=Math.max(-89.999999,Math.min(89.999999,latitude))*RAD;
 return projection.stereographicFactor*stereographicT(phi,projection.eccentricity);
}

export function projectWgs84(latitude:number,longitude:number,projection:RadarProjection):[number,number]|null{
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
 const phi=Math.max(-89.999999,Math.min(89.999999,latitude))*RAD;
 const lambda=longitude*RAD;
 const lambda0=projection.lon0*RAD;
 const deltaLambda=lambda-lambda0;
 if(projection.kind==='stere'){
  const rho=projection.stereographicFactor*stereographicT(phi,projection.eccentricity);
  return[
   projection.x0+rho*Math.sin(deltaLambda),
   projection.y0-rho*Math.cos(deltaLambda),
  ];
 }
 const phi0=projection.lat0*RAD;
 const denominator=1+Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(deltaLambda);
 if(denominator<=0)return null;
 const k=Math.sqrt(2/denominator);
 return[
  projection.x0+projection.a*k*Math.cos(phi)*Math.sin(deltaLambda),
  projection.y0+projection.a*k*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(deltaLambda)),
 ];
}

export function inverseProjectedPoint(x:number,y:number,projection:RadarProjection):[number,number]|null{
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 const dx=x-projection.x0;
 const dy=y-projection.y0;
 const rho=Math.hypot(dx,dy);
 const lambda0=projection.lon0*RAD;
 if(projection.kind==='stere'){
  if(rho<1e-9)return[90,projection.lon0];
  const t=rho/projection.stereographicFactor;
  let phi=HALF_PI-2*Math.atan(t);
  for(let iteration=0;iteration<12;iteration++){
   const sinPhi=Math.sin(phi);
   const ratio=(1-projection.eccentricity*sinPhi)/(1+projection.eccentricity*sinPhi);
   const next=HALF_PI-2*Math.atan(t*Math.pow(Math.max(Number.EPSILON,ratio),projection.eccentricity/2));
   if(Math.abs(next-phi)<1e-13){phi=next;break}
   phi=next;
  }
  const lambda=lambda0+Math.atan2(dx,-dy);
  return[phi/RAD,((lambda/RAD+540)%360)-180];
 }
 if(rho<1e-9)return[projection.lat0,projection.lon0];
 const phi0=projection.lat0*RAD;
 const c=2*Math.asin(Math.min(1,rho/(2*projection.a)));
 const sinC=Math.sin(c);
 const cosC=Math.cos(c);
 const phi=Math.asin(cosC*Math.sin(phi0)+(dy*sinC*Math.cos(phi0))/rho);
 const lambda=lambda0+Math.atan2(dx*sinC,rho*Math.cos(phi0)*cosC-dy*Math.sin(phi0)*sinC);
 return[phi/RAD,((lambda/RAD+540)%360)-180];
}

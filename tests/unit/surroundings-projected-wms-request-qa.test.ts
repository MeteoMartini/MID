import {describe,expect,it} from 'vitest';
import {planSurroundingsMercatorWms} from '../../scripts/qa/surroundingsMercatorWmsPlan';
import {buildSurroundingsProjectedWmsRequest} from '../../scripts/qa/surroundingsProjectedWmsRequest';

const plan=planSurroundingsMercatorWms({west:5.7,south:50.17,east:8.5,north:51.47})!;
const date=Date.parse('2026-11-16T19:00:00.000Z');
const dwd='https://worker.mid.test/?mode=composite-wms&provider=dwd';
const eumetsat='https://worker.mid.test/?mode=composite-wms&provider=eumetsat';

describe('MID #853: EPSG:3857 original WMS routing contract (inactive QA)',()=>{
  it('DWD RV uses WMS 1.1.1 + srs, original UTC timestamp and exact projected source dimensions',()=>{
    const request=buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan)!;
    expect(request).toBeDefined();
    const url=new URL(request.url);
    expect(url.searchParams.get('mode')).toBe('composite-wms');
    expect(url.searchParams.get('provider')).toBe('dwd');
    expect(url.searchParams.get('version')).toBe('1.1.1');
    expect(url.searchParams.get('srs')).toBe('EPSG:3857');
    expect(url.searchParams.has('crs')).toBe(false);
    expect(url.searchParams.get('layers')).toBe('dwd:Radar_rv_product_1x1km_ger');
    expect(url.searchParams.get('bbox')).toBe(plan.bbox);
    expect(url.searchParams.get('width')).toBe(String(plan.width));
    expect(url.searchParams.get('height')).toBe(String(plan.height));
    expect(url.searchParams.get('time')).toBe('2026-11-16T19:00:00.000Z');
    expect(url.searchParams.get('format')).toBe('image/png');
    expect(url.searchParams.get('transparent')).toBe('true');
    expect(request.requestKey).toBe(request.url);
    expect(request.geographicBounds).toEqual(plan.imageBounds);
  });

  it('EUMETSAT MTG RGB/IR use WMS 1.3.0 + crs; each actual original time stays independent',()=>{
    const a=buildSurroundingsProjectedWmsRequest(eumetsat,'eumetsat','mtg_fd:rgb_geocolour',date,plan)!;
    const b=buildSurroundingsProjectedWmsRequest(eumetsat,'eumetsat','mtg_fd:ir105_hrfi',date+600000,plan)!;
    expect(a).toBeDefined();expect(b).toBeDefined();
    for(const request of [a,b]){
      const url=new URL(request.url);
      expect(url.searchParams.get('version')).toBe('1.3.0');
      expect(url.searchParams.get('crs')).toBe('EPSG:3857');
      expect(url.searchParams.has('srs')).toBe(false);
      expect(url.searchParams.get('bbox')).toBe(plan.bbox);
      expect(request.projectionParameter).toBe('crs');
    }
    expect(new URL(b.url).searchParams.get('time')).toBe('2026-11-16T19:10:00.000Z');
    expect(a.requestKey).not.toBe(b.requestKey);
    expect(a.geographicBounds).toEqual(b.geographicBounds);
  });

  it('removes stale case-variant CRS, timing, bbox and dimensions without changing Worker identity',()=>{
    const old=dwd+'&CRS=EPSG%3A4326&srs=EPSG%3A4326&BBOX=1%2C2%2C3%2C4&time=2020&width=1';
    const request=buildSurroundingsProjectedWmsRequest(old,'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan)!;
    const url=new URL(request.url),keys=[...url.searchParams.keys()].map(key=>key.toLowerCase());
    for(const field of ['crs','bbox','width','time'])expect(keys.filter(key=>key===field).length).toBe(field==='crs'?0:1);
    expect(keys.filter(key=>key==='srs')).toHaveLength(1);
    expect(url.searchParams.get('srs')).toBe('EPSG:3857');
    expect(url.searchParams.get('bbox')).toBe(plan.bbox);
    expect(url.searchParams.get('provider')).toBe('dwd');
  });

  it('refuses invalid provider, arbitrary proxy host protocol, unapproved mode, layer injection and unverified timing',()=>{
    const invalid=[
      ['', 'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan],
      ['javascript:alert(1)?mode=composite-wms&provider=dwd','dwd','dwd:Radar_rv_product_1x1km_ger',date,plan],
      ['http://public.mid.test/?mode=composite-wms&provider=dwd','dwd','dwd:Radar_rv_product_1x1km_ger',date,plan],
      ['https://worker.mid.test/?mode=weather-map-wms&provider=dwd','dwd','dwd:Radar_rv_product_1x1km_ger',date,plan],
      [eumetsat,'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan],
      [dwd,'dwd','dwd:Radar_rv_product_1x1km_ger,untrusted:layer',date,plan],
      [dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',Number.NaN,plan],
      [dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date/1000,plan],
      [dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',Date.UTC(2200,0,1),plan],
      [dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,undefined]
    ] as const;
    for(const [proxy,provider,layer,time,geometry] of invalid){
      expect(buildSurroundingsProjectedWmsRequest(proxy,provider,layer,time,geometry)).toBeUndefined();
    }
  });

  it('does not allow a geographic EPSG:4326 bbox, polar rectangle, mismatched pixel ratio or oversize image',()=>{
    expect(buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,{...plan,crs:'EPSG:4326'} as never)).toBeUndefined();
    expect(buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,{...plan,bbox:'5.700,50.170,8.500,51.470'})).toBeUndefined();
    expect(buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,{...plan,height:512})).toBeUndefined();
    expect(buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,{...plan,imageBounds:{west:6,east:8,north:87,south:50}})).toBeUndefined();
  });

  it('rejects matching-looking but geographically inconsistent projected source footprints',()=>{
    const slightlyShifted={...plan,imageBounds:{...plan.imageBounds,north:plan.imageBounds.north+0.1}};
    const shiftedBBox={...plan,bbox:['123000.000',...plan.bbox.split(',').slice(1)].join(',')};
    const onePixelShift={...plan,width:plan.width-1};
    for(const wrong of [slightlyShifted,shiftedBBox,onePixelShift]){
      expect(buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,wrong)).toBeUndefined();
    }
  });

  it('is deterministic and only constructs URL/geometry – never declares source coverage, weather or warnings',()=>{
    const a=buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan)!;
    const b=buildSurroundingsProjectedWmsRequest(dwd,'dwd','dwd:Radar_rv_product_1x1km_ger',date,plan)!;
    expect(a).toEqual(b);
    expect(Object.keys(a).sort()).toEqual(['geographicBounds','projectionParameter','requestKey','url','version']);
    for(const key of ['coverage','rainRate','isDry','timeVerified','sourceValid','officialWarning']){
      expect((a as unknown as Record<string,unknown>)[key]).toBeUndefined();
    }
  });
});

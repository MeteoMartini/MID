import {describe, expect, it} from 'vitest';
import {inspectSurroundingsWmsAlpha} from '../helpers/surroundingsWmsPixelEvidence';

const px=(r:number,g:number,b:number,a:number)=>[r,g,b,a];

describe('MID #853 – decoded WMS pixel QA never treats alpha as meteorological truth',()=>{
  it('rejects a missing decoded image instead of inventing zero precipitation',()=>{
    expect(inspectSurroundingsWmsAlpha(undefined)).toBeUndefined();
  });

  it('treats a fully transparent source as visual absence, not verified dry weather',()=>{
    const evidence=inspectSurroundingsWmsAlpha({
      width:2,height:2,data:new Uint8Array(16)
    })!;
    expect(evidence.alphaStatus).toBe('fully-transparent');
    expect(evidence.transparentPixels).toBe(4);
    expect(evidence.visiblePixels).toBe(0);
    expect(evidence.meteorologicalCoverage).toBeNull();
    expect(evidence.precipitationRate).toBeNull();
    expect(evidence.meteorologicalValidity).toBe('unverified');
  });

  it('does not regard 100% opaque black imagery or static GeoColour background as validated coverage',()=>{
    const evidence=inspectSurroundingsWmsAlpha({
      width:2,height:1,data:new Uint8ClampedArray([...px(0,0,0,255),...px(0,0,0,255)])
    })!;
    expect(evidence.alphaStatus).toBe('fully-opaque');
    expect(evidence.visibleFraction).toBe(1);
    expect(evidence.meteorologicalCoverage).toBeNull();
    expect(evidence.meteorologicalValidity).toBe('unverified');
    expect(evidence.precipitationRate).toBeNull();
  });

  it('one visible pixel never certifies complete radar regional coverage',()=>{
    const evidence=inspectSurroundingsWmsAlpha({
      width:4,height:2,data:new Uint8Array([
        ...px(5,6,7,255),...px(0,0,0,0),...px(0,0,0,0),...px(0,0,0,0),
        ...px(0,0,0,0),...px(0,0,0,0),...px(0,0,0,0),...px(0,0,0,0)
      ])
    })!;
    expect(evidence.visiblePixels).toBe(1);
    expect(evidence.transparentPixels).toBe(7);
    expect(evidence.visibleFraction).toBe(1/8);
    expect(evidence.alphaStatus).toBe('partially-visible');
    expect(evidence.meteorologicalCoverage).toBeNull();
  });

  it('separates transparent/translucent/opaque alpha counts including partial images',()=>{
    const evidence=inspectSurroundingsWmsAlpha({
      width:2,height:2,data:new Uint8Array([
        ...px(1,2,3,0),...px(1,2,3,1),
        ...px(1,2,3,254),...px(1,2,3,255)
      ])
    })!;
    expect(evidence).toMatchObject({
      pixelCount:4,transparentPixels:1,translucentPixels:2,
      opaquePixels:1,visiblePixels:3,visibleFraction:.75,
      alphaStatus:'partially-visible',meteorologicalValidity:'unverified',
    });
  });

  it('RGB changes do not alter the visual-alpha/NoData uncertainty assessment',()=>{
    const a=inspectSurroundingsWmsAlpha({
      width:1,height:2,data:new Uint8Array([...px(0,0,0,0),...px(0,0,0,255)])
    })!;
    const b=inspectSurroundingsWmsAlpha({
      width:1,height:2,data:new Uint8Array([...px(255,255,255,0),...px(43,92,197,255)])
    })!;
    expect(a).toEqual(b);
    expect(a.precipitationRate).toBeNull();
  });

  it.each([
    {width:0,height:1,data:new Uint8Array(0)},
    {width:-1,height:1,data:new Uint8Array(4)},
    {width:1.5,height:1,data:new Uint8Array(8)},
    {width:513,height:1,data:new Uint8Array(513*4)},
    {width:1,height:257,data:new Uint8Array(257*4)},
    {width:1,height:1,data:new Uint8Array(3)},
    {width:1,height:1,data:new Uint8Array(5)},
    {width:Number.NaN,height:1,data:new Uint8Array(4)},
    {width:Infinity,height:1,data:new Uint8Array(4)}
  ])('fails closed on malformed geometry or byte length: %o',(frame)=>{
    expect(inspectSurroundingsWmsAlpha(frame)).toBeUndefined();
  });

  it('rejects non-byte floating-point raster data instead of interpreting values',()=>{
    expect(inspectSurroundingsWmsAlpha({
      width:1,height:1,data:new Float32Array(4) as unknown as Uint8Array
    })).toBeUndefined();
  });

  it('does not mutate original provider-decoded pixel values',()=>{
    const original=new Uint8Array([...px(1,2,3,0),...px(10,20,30,255)]);
    const before=original.slice();
    inspectSurroundingsWmsAlpha({width:2,height:1,data:original});
    expect(original).toEqual(before);
  });

  it('emits no source timestamp, radar amount, dry flag or officially-verified availability',()=>{
    const evidence=inspectSurroundingsWmsAlpha({
      width:1,height:1,data:new Uint8Array([2,40,10,255])
    })! as unknown as Record<string,unknown>;
    expect(Object.keys(evidence).sort()).toEqual([
      'alphaStatus','height','meteorologicalCoverage','meteorologicalValidity',
      'opaquePixels','pixelCount','precipitationRate','provenance','schema',
      'translucentPixels','transparentPixels','visibleFraction','visiblePixels','width'
    ]);
    for(const key of ['sourceTime','observedAt','isDry','validPixels','noDataFraction','validCoverage'])
      expect(evidence[key]).toBeUndefined();
  });
});

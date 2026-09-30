import {describe,expect,it} from 'vitest';
import {calculateUtci,estimateTmrt,utciCategory,utciFromHour,vaporPressureKpa} from '../../src/utci';

describe('UTCI reference implementation',()=>{
  it('matches the neutral reference case used by MID',()=>{
    expect(calculateUtci(25,25,1,50)).toBeCloseTo(24.6,1);
  });

  it('computes plausible vapor pressure and thermal categories',()=>{
    expect(vaporPressureKpa(25,50)).toBeCloseTo(1.58,2);
    expect(utciCategory(9).shortLabel).toBe('behaglich');
    expect(utciCategory(32).shortLabel).toBe('warm');
  });

  it('keeps day/night radiant-temperature behavior explicit',()=>{
    expect(estimateTmrt(10,0,0,false,0)).toBeCloseTo(2,6);
    expect(estimateTmrt(20,0,5,true,0)).toBeGreaterThan(20);
  });

  it('returns null/NaN for unusable inputs instead of inventing a value',()=>{
    expect(calculateUtci(Number.NaN,20,1,50)).toBeNaN();
    expect(utciFromHour(20,Number.NaN,50,4,2,true,0)).toBeNull();
  });

  it('provides a complete convenience result for valid hourly input',()=>{
    const result=utciFromHour(25,1,50,4,5,true,100);
    expect(result).not.toBeNull();
    expect(result!.utci).toBeTypeOf('number');
    expect(result!.tmrt).toBeGreaterThan(25);
    expect(result!.category.shortLabel.length).toBeGreaterThan(0);
  });
});

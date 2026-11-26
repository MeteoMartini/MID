import {describe,expect,it} from 'vitest';
import {twinArchiveEvidence as evidence,twinLearningPresentation as presentation} from '../../src/twinHealthPresentation';

const row=(date:string,kind='measured',label='DWD')=>({date,kind,sources:[{label}]});
const independent=(r:ReturnType<typeof row>)=>r.kind==='measured'||r.kind==='private-sensor';
const today='2026-11-26';

describe('Audit 1.5: independent archive evidence is not forecast skill',()=>{
 it('fails closed without data',()=>expect(evidence([],today,independent)).toEqual({independentDays:0,latestDate:undefined,sources:[]}));
 it('excludes reanalysis and model fallback from independent source chips',()=>expect(evidence([row('2026-11-25','reanalysis','ERA5'),row('2026-11-24','model-fallback','Best Match')],today,independent).sources).toEqual([]));
 it('excludes today, future and impossible calendar dates',()=>expect(evidence([row(today),row('2026-11-27'),row('2026-02-30'),row('2026-2-02')],today,independent).independentDays).toBe(0));
 it('counts distinct days and finds latest independently of input order',()=>expect(evidence([row('2026-11-25'),row('2026-11-20'),row('2026-11-25','private-sensor','Sensor')],today,independent)).toEqual({independentDays:2,latestDate:'2026-11-25',sources:['DWD','Sensor']}));
 it('never refreshes an old independent date with a new fallback',()=>expect(evidence([row('2026-11-10'),row('2026-11-25','reanalysis')],today,independent).latestDate).toBe('2026-11-10'));
 it('bounds chips at six and trims labels',()=>{const result=evidence(Array.from({length:10},(_,i)=>row('2026-11-25','measured',' Station '+i+' ')),today,independent);expect(result.sources).toHaveLength(6);expect(result.sources[0]).toBe('Station 0')});
 it('rejects invalid current date',()=>expect(evidence([row('2026-11-25')],'2026-11-31',independent).independentDays).toBe(0));
 it('does not claim complete readiness with an open issue',()=>expect(presentation('ready',1,5).status).toBe('learning'));
 it('labels complete readiness without claiming accuracy',()=>expect(presentation('ready',0,5).label).toBe('Lernvoraussetzungen erfüllt'));
 it('formats zero, singular and unavailable comparison counts',()=>{expect(presentation('limited',4,0).comparisonText).toBe('0 unabhängige Vergleichstage');expect(presentation('learning',1,1).comparisonText).toBe('1 unabhängiger Vergleichstag');expect(presentation('ready',0,NaN).comparisonText).toBe('Vergleichstage nicht verfügbar')});
 it('does not crash on a malformed legacy source label',()=>expect(evidence([{date:'2026-11-25',kind:'measured',sources:[{label:null as unknown as string}]}],today,independent).sources).toEqual([]));
});

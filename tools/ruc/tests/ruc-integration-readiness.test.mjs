import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRucPilot,REQUIRED_DWD_RUC_FIELDS} from '../ruc_integration_gate.mjs';

function fixture(){
 const runs=['2026-10-20T04:00','2026-10-20T05:00','2026-10-20T06:00'];
 const dwd=runs.flatMap(run=>REQUIRED_DWD_RUC_FIELDS.map(field=>({
  run,field,http:200,inventory:{filesListed:field==='TOT_PREC'?325:['CAPE_ML','CIN_ML'].includes(field)?109:28,
  missingHourlyLeads:[],plus27Listed:true,fiveMinuteSlotsMissing:0}
 })));
 const headers={schema:'mid.ruc.grib-header-sample.v1',headerTimeGate:true,
  samples:[['T_2M',1620],['PMSL',1620],['CLCL',1620],['TOT_PREC',1615],['TOT_PREC',1620]].map(([field,leadMinutes])=>({
   field,leadMinutes,validityMatched:true,grib:{edition:2,bitmapPresent:1,numberOfDataPoints:542040,
    stepType:field==='TOT_PREC'?'accum':'instant',units:field==='TOT_PREC'?'kg m**-2':'K'}
  }))};
 const numeric={schema:'mid.ruc.numeric-pilot.v1',numericSampleGate:true,
  files:[['T_2M',1620],['CLCL',1620],['TOT_PREC',1610],['TOT_PREC',1615],['TOT_PREC',1620]].map(([field,leadMinutes])=>({
   field,leadMinutes,valid:true,pointCount:542040,finitePoints:525072,missingPoints:16968,min:0,max:5
  })),
  increments:[[1610,1615],[1615,1620]].map(([startLeadMinutes,endLeadMinutes])=>({
   startLeadMinutes,endLeadMinutes,validPairedCells:525072,missingPairedCells:16968,negativeBelowToleranceCount:0,minMm:0,maxMm:7.9
  }))};
 const provider={schema:'mid.ruc.provider.readonly.v1',dwdListingGate:true,
  runDiscovery:{runs},dwd,
  openMeteo:{http:400,model:'dwd_icon_d2_ruc_native',usable:false}};
 return {provider,headers,numeric};
}
test('native pilot is separate from Open-Meteo 400 and never authorizes release',()=>{
 const v=evaluateRucPilot(fixture());assert.equal(v.sources.nativeDwd.pilotVerified,true);
 assert.equal(v.sources.openMeteo.pilotVerified,false);
 assert.equal(v.integration.nativeDwd.readyForProduction,false);
 assert.equal(v.integration.activationAuthorized,false);
});
test('open-meteo 200 is still not a release',()=>{
 const f=fixture();f.provider.openMeteo={http:200,model:'dwd_icon_d2_ruc_native',usable:true,
  hourlyTimeStepValid:true,unit:'°C',finite:28,timeCount:28,temperatureCount:28};
 const v=evaluateRucPilot(f);
 assert.equal(v.sources.openMeteo.pilotVerified,true);
 assert.equal(v.integration.openMeteo.readyForProduction,false);
 assert.equal(v.integration.automatedPromotionAllowed,false);
});
test('incomplete native run matrix does not masquerade as full 27h',()=>{
 const f=fixture();f.provider.dwd.pop();
 assert.equal(evaluateRucPilot(f).sources.nativeDwd.pilotVerified,false);
});
test('hourly holes and missing 5-minute slots block readiness',()=>{
 const a=fixture();a.provider.dwd[0].inventory.missingHourlyLeads=[16];
 assert.equal(evaluateRucPilot(a).sources.nativeDwd.pilotVerified,false);
 const b=fixture();b.provider.dwd.find(x=>x.field==='TOT_PREC').inventory.fiveMinuteSlotsMissing=1;
 assert.equal(evaluateRucPilot(b).sources.nativeDwd.pilotVerified,false);
});
test('bad reference time or GRIB accumulation processing block pilot',()=>{
 const f=fixture();f.headers.samples[4].grib.stepType='instant';
 assert.equal(evaluateRucPilot(f).sources.nativeDwd.pilotVerified,false);
});
test('bitmap/NoData loss and negative cumulative differences block pilot',()=>{
 const f=fixture();f.numeric.files[0].missingPoints=0;
 assert.equal(evaluateRucPilot(f).sources.nativeDwd.pilotVerified,false);
 const g=fixture();g.numeric.increments[1].negativeBelowToleranceCount=1;
 assert.equal(evaluateRucPilot(g).sources.nativeDwd.pilotVerified,false);
});
test('null and incomplete artifacts fail closed',()=>{
 assert.equal(evaluateRucPilot({}).sources.nativeDwd.pilotVerified,false);
 const f=fixture();f.provider.openMeteo={http:200,usable:true,finite:null,timeCount:28};
 assert.equal(evaluateRucPilot(f).sources.openMeteo.pilotVerified,false);
});

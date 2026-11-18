/** Render the actual MID EnsembleAssessmentDetails with deterministic non-weather QA data. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {EnsembleAssessmentDetails} from '../../src/ForecastConfidence';
import type {DayAssessment,ParameterAssessment} from '../../src/ensembleAssessment';
const param=(label:string,agreement:ParameterAssessment['agreement'],quality:ParameterAssessment['quality']):ParameterAssessment=>({
 key:'temperature',label,agreement,spreadAgreement:agreement,quality,score:null,rawScore:null,
 detail:'Synthetischer Layouttest – keine offizielle Prognose, keine Modelllaufbehauptung.',
 coverage:null,leadFactor:1,calibrationAdjustment:0
});
const assessment:DayAssessment={
 date:'2026-11-17',agreement:'unknown',confidenceScore:null,dataQuality:'missing',
 parameters:[param('ExtremLangeTemperaturKonfidenzBezeichnungOhneTrennstellenFürKleineBildschirmeUndHoheTextskalierung','unknown','missing')],
 limiting:[],complete:false,leadHours:0,leadFactor:1,calibrationApplied:false,calibrationSampleDays:0
};
document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
createRoot(document.getElementById('root')!).render(<div className="qa-shell"><section className="qa-panel" aria-label="MID Ensemble-Detail Layouttest"><EnsembleAssessmentDetails assessment={assessment}/></section><p className="qa-note">Synthetische Daten · nur Layouttest · keine amtliche Warnung</p></div>);

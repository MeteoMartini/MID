/** Source-bound interpretation of map types, not an image classifier.
 * Never infer precipitation intensity, dryness, storm motion/ETA, probabilities
 * or official warnings from WMS transport, alpha, or raster color alone.
 */
export type SurroundingsMapEvidence=
 |{mode:'cloud';cloudOriginalAvailable:boolean}
 |{mode:'radar';radar?:
   |{source:'opera';kind:'Beobachtung';time:number;coverage:'complete'|'partial'|'unknown'}
   |{source:'dwd';kind:'Beobachtung'|'Nowcast';time:number;coverage:'unknown'};
  satelliteTime?:number;phaseAvailable?:boolean};

export function interpretSurroundingsMap(evidence:SurroundingsMapEvidence):string|null{
 if(evidence.mode==='cloud')return evidence.cloudOriginalAvailable
  ?'Schematische Modellwolken und SigWx: keine Satellitenbeobachtung und kein Nachweis von Niederschlag am Boden.'
  :null;
 const radar=evidence.radar&&Number.isFinite(evidence.radar.time)?evidence.radar:undefined;
 const satelliteTime=Number.isFinite(evidence.satelliteTime)?evidence.satelliteTime:undefined;
 if(!radar&&satelliteTime===undefined)return null;
 const parts:string[]=[];
 if(radar){
  parts.push(radar.kind==='Nowcast'
   ?'Radar-Nowcast ist eine Fortschreibung, keine Messung am Zukunftstermin; Ankunftszeit und Eintrittswahrscheinlichkeit sind hier nicht verifiziert.'
   :'Radar-Echos sind kein sicherer Nachweis für Niederschlag am Boden.');
  if(radar.coverage==='partial')parts.push('Nicht erfasste Radarflächen sind NoData, nicht trocken.');
  else if(radar.coverage==='unknown')parts.push('Die meteorologische Pixelabdeckung ist nicht bestätigt.');
 }
 if(satelliteTime!==undefined){
  parts.push('Ein Satellitenbild allein belegt keinen Niederschlag am Boden.');
  if(radar){
   const gap=Math.abs(satelliteTime-radar.time);
   parts.push(gap>=60_000
    ?`Radar und Satellit haben verschiedene Bildzeiten (rund ${Math.round(gap/60_000)} Min. Unterschied).`
    :'Radar und Satellit bleiben unabhängige Beobachtungsquellen.');
  }
 }
 if(evidence.phaseAvailable&&radar?.source==='opera'&&radar.kind==='Beobachtung')
  parts.push('Niederschlagsart ist eine MID-Radar-/Modellableitung, keine amtliche Warnung.');
 return parts.join(' ');
}

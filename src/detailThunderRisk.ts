export type DetailThunderRiskLevel='elevated'|'high';
export type DetailThunderRisk={level:DetailThunderRiskLevel;shortLabel:string;label:string;score:number;percent:number;signals:string[]};
export type DetailThunderRiskSample={
 code?:number;
 cape?:number;
 liftedIndex?:number;
 convectiveInhibition?:number;
 columnWaterVapour?:number;
 temperature?:number;
 dewPoint?:number;
 humidity?:number;
 precipitation?:number;
 rain?:number;
 showers?:number;
 probability?:number;
};

function finite(value:unknown,fallback=Number.NaN){const number=Number(value);return Number.isFinite(number)?number:fallback}
function points(value:number,thresholds:[number,number][],descending=false){if(!Number.isFinite(value))return 0;for(const [threshold,score] of thresholds){if(descending?value<=threshold:value>=threshold)return score}return 0}
function cinMagnitude(value:number){return Number.isFinite(value)?Math.abs(value):Number.NaN}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function thunderRiskPercent(level:DetailThunderRiskLevel,score:number,directThunder:boolean,hailThunder:boolean){
 if(hailThunder)return 95;
 if(directThunder&&level==='high')return clamp(Math.round(82+score*1.15),85,93);
 if(directThunder)return clamp(Math.round(62+score*1.2),65,82);
 if(level==='high')return clamp(Math.round(56+score*3.1),72,88);
 return clamp(Math.round(27+score*5.2),35,69);
}

/**
 * Best-Match thunderstorm diagnostic for a single forecast hour.
 *
 * It deliberately requires a combination of instability, moisture and a trigger
 * instead of treating CAPE alone as a thunderstorm forecast. WMO thunderstorm
 * codes remain the strongest direct signal. Missing model indices are ignored,
 * so models without LI/CIN/IWV continue to receive a conservative fallback.
 */
export function significantHourlyThunderRisk(sample:DetailThunderRiskSample):DetailThunderRisk|null{
 const code=Math.round(finite(sample.code,-1));
 const cape=Math.max(0,finite(sample.cape,0));
 const liftedIndex=finite(sample.liftedIndex);
 const cin=cinMagnitude(finite(sample.convectiveInhibition));
 const columnWater=Math.max(0,finite(sample.columnWaterVapour,0));
 const temperature=finite(sample.temperature);
 const dewPoint=finite(sample.dewPoint);
 const humidity=Math.max(0,finite(sample.humidity,0));
 const probability=Math.max(0,finite(sample.probability,0));
 const showers=Math.max(0,finite(sample.showers,0));
 const rain=Math.max(0,finite(sample.rain,0));
 const precipitation=Math.max(0,finite(sample.precipitation,0));

 const directThunder=[95,96,97,99].includes(code),hailThunder=[96,99].includes(code);
 const capePoints=points(cape,[[2000,4],[1200,3],[600,2],[300,1]]);
 const liPoints=points(liftedIndex,[[-6,4],[-4,3],[-2,2],[0,1]],true);
 const instability=Math.max(capePoints,liPoints)+Math.min(capePoints,liPoints)*.5;

 const dewPointPoints=points(dewPoint,[[20,3],[16,2],[13,1]]);
 const humidityPoints=points(humidity,[[75,2],[60,1]]);
 const columnWaterPoints=points(columnWater,[[40,3],[30,2],[22,1]]);
 const dewPointSpread=Number.isFinite(temperature)&&Number.isFinite(dewPoint)?temperature-dewPoint:Number.NaN;
 const nearSaturation=Number.isFinite(dewPointSpread)&&dewPointSpread<=6?1:0;
 const moisture=Math.max(dewPointPoints,columnWaterPoints,humidityPoints+nearSaturation);

 const convectiveCode=[80,81,82,95,96,97,99].includes(code);
 const showerPoints=points(showers,[[1,3],[.2,2],[.05,1]]);
 const probabilityPoints=points(probability,[[70,2],[45,1]]);
 const precipitationPoints=precipitation>=1||rain>=1?1:0;
 const trigger=(convectiveCode?2:0)+Math.max(showerPoints,probabilityPoints)+precipitationPoints;

 const inhibitionPenalty=!Number.isFinite(cin)?0:cin<=25?1:cin<=75?0:cin<=150?-1:-2;
 const stronglyCapped=Number.isFinite(cin)&&cin>=200&&trigger<3;
 const score=instability+moisture+trigger+inhibitionPenalty;
 const signals:string[]=[];
 if(capePoints>=2)signals.push('CAPE');
 if(liPoints>=2)signals.push('Lifted Index');
 if(Number.isFinite(cin))signals.push('CIN');
 if(moisture>=2)signals.push('Feuchte');
 if(trigger>=2)signals.push('Schauer/Trigger');

 if(hailThunder){const normalizedScore=Math.max(score,10);return{level:'high',shortLabel:'hoch',label:'Hohes Gewitterrisiko – direktes Best-Match-Gewittersignal mit Hagel',score:normalizedScore,percent:thunderRiskPercent('high',normalizedScore,true,true),signals:['WMO-Gewittercode',...signals]};}
 if(code===97){const normalizedScore=Math.max(score,9);return{level:'high',shortLabel:'hoch',label:'Hohes Gewitterrisiko – direktes Best-Match-Gewittersignal',score:normalizedScore,percent:thunderRiskPercent('high',normalizedScore,true,false),signals:['WMO-Gewittercode',...signals]};}
 if(code===95&&((instability>=3.5&&moisture>=1)||score>=7)){const normalizedScore=Math.max(score,8);return{level:'high',shortLabel:'hoch',label:'Hohes Gewitterrisiko – Gewittersignal durch mehrere Modellindizes gestützt',score:normalizedScore,percent:thunderRiskPercent('high',normalizedScore,true,false),signals:['WMO-Gewittercode',...signals]};}
 if(directThunder){const normalizedScore=Math.max(score,6);return{level:'elevated',shortLabel:'erhöht',label:'Erhöhtes Gewitterrisiko – direktes Best-Match-Gewittersignal',score:normalizedScore,percent:thunderRiskPercent('elevated',normalizedScore,true,false),signals:['WMO-Gewittercode',...signals]};}

 if(!stronglyCapped&&instability>=4.5&&moisture>=2&&trigger>=2&&score>=8)return{level:'high',shortLabel:'hoch',label:'Hohes Gewitterrisiko aus CAPE, Lifted Index, CIN sowie Feuchte- und Schauersignalen',score,percent:thunderRiskPercent('high',score,false,false),signals};
 if(!stronglyCapped&&instability>=2.5&&moisture>=1&&trigger>=1&&score>=5.5)return{level:'elevated',shortLabel:'erhöht',label:'Erhöhtes Gewitterrisiko aus mehreren Best-Match-Stabilitäts- und Feuchteparametern',score,percent:thunderRiskPercent('elevated',score,false,false),signals};
 return null;
}

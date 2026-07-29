import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "type UvIndexBand={key:'low'|'moderate'|'high'|'very-high'|'extreme'",
  "{key:'low',label:'Keine bis gering',range:'0–2'",
  "{key:'moderate',label:'Mittel',range:'3–5'",
  "{key:'high',label:'Hoch',range:'6–7'",
  "{key:'very-high',label:'Sehr hoch',range:'8–10'",
  "{key:'extreme',label:'Extrem',range:'ab 11'",
  'function classifyUvIndex(value:number):UvIndexBand|null',
  'function UviIndicator({band}',
  'function UvIndexExplanation({value,band,advanced,elevation,altitudeBonus}',
  "label:'UVI',value:uvClassification?uvClassification.label:'–'",
  'info:<UvIndexExplanation value={actualCurrentUv}',
  "uviCard=x.label==='UVI'",
  'uviCard&&<UviIndicator band={uvClassification}/>'
])need('UVI-Kartenlogik',app,token);

for(const recommendation of [
  'Schatten bevorzugen',
  'Mittags Schatten suchen',
  'Zwischen 11 und 16 Uhr möglichst nicht in der direkten Sonne aufhalten',
  'Zwischen 11 und 16 Uhr möglichst im Schutz eines Gebäudes bleiben'
])need('UVI-Handlungsempfehlungen',app,recommendation);

for(const token of [
  '.metrics .uvi-card header>.mode-info,',
  '.metrics .uvi-card header>.mode-info>button,',
  '.metrics .uvi-card header>.mode-info svg,',
  '.uvi-indicator{',
  '.uvi-segments{',
  '.uvi-popover-content{',
  '.uvi-band-list{'
])need('UVI-Kartenstyling',styles,token);

if(!styles.includes('width:22px;')||!styles.includes('height:22px;'))failures.push('Die UVI-Info-Schaltfläche ist nicht an die 22-px-Größe der anderen Karten gebunden.');
if(app.includes("label:'UVI',value:Number.isFinite(actualCurrentUv)?formatDecimal(actualCurrentUv,1):'–'"))failures.push('Die alte UVI-Darstellung ohne offizielle Gefahrenstufe ist weiterhin aktiv.');

if(failures.length){console.error('UVI-Kartenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('UVI-Kachel geprüft: offizielle DWD-/WHO-Stufen, farbiger Stufenindikator, gleich große Info-Schaltfläche und stufengerechte Handlungsempfehlungen vorhanden.');

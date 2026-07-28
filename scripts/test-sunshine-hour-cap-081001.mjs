import {readFile} from 'node:fs/promises';
const [weather,app]=await Promise.all([readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),readFile(new URL('../src/App.tsx',import.meta.url),'utf8')]);
const failures=[];
const need=(token,message)=>{if(!weather.includes(token))failures.push(message)};
need('intervalCount=Math.max(1,Math.floor(60/intervalMinutes))','Die Zahl der Sonnenscheinintervalle ist nicht auf maximal 60 Minuten begrenzt.');
need('selectedRows=rows.slice(-intervalCount)','Die Aggregation verwendet weiterhin mehr als die letzten vier 15-Minuten-Intervalle.');
need('Math.min(intervalSeconds,Math.max(0,row.value))','Ein einzelnes Sonnenscheinintervall wird nicht auf seine physikalisch mögliche Länge begrenzt.');
need('Math.min(coverageMinutes*60,Math.max(0,seconds))','Die aggregierte Sonnenscheindauer kann weiterhin länger als der ausgewiesene Zeitraum sein.');
need('Math.min(3600,Math.max(0,n(hourlyValues[best],0)))','Der Stunden-Fallback ist nicht auf 60 Minuten begrenzt.');
if(!app.includes("minutes?`${hours} h ${String(minutes).padStart(2,'0')} min`:`${hours} h`"))failures.push('Eine volle Stunde wird weiterhin unnötig als „1 h 00 min“ ausgegeben.');
const intervalMinutes=15,rows=[900,900,900,900,900],intervalCount=Math.max(1,Math.floor(60/intervalMinutes)),selectedRows=rows.slice(-intervalCount),coverageMinutes=Math.min(60,selectedRows.length*intervalMinutes),seconds=Math.min(coverageMinutes*60,selectedRows.reduce((sum,value)=>sum+Math.min(intervalMinutes*60,Math.max(0,value)),0));
if(selectedRows.length!==4||coverageMinutes!==60||seconds!==3600)failures.push(`Funktionale 60-Minuten-Begrenzung fehlgeschlagen: ${selectedRows.length} Intervalle, ${coverageMinutes} min, ${seconds}s.`);
if(failures.length){console.error('Sonnenschein-60-Minuten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonnenscheindauer geprüft: maximal vier 15-Minuten-Werte und niemals mehr als 60 Minuten je ausgewiesenem Stundenfenster.');

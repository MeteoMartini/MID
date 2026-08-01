import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['const secureThreshold=72','secureUntilIndex=data.findIndex(row=>row.confidence<secureThreshold)','secureCount=secureUntilIndex===-1?Math.min(data.length,14):secureUntilIndex','<strong>Wie geht’s weiter?</strong>','<small>Belastbarer Zeitraum</small>','<small>Danach am ehesten</small>','<small>Unsicherheit nimmt zu</small>','forecastOutlook(data,secureCount)','forecastUncertaintyDriver(widest)'])if(!panel.includes(token))failures.push(`Prognose-Kompass fehlt: ${token}`);
if(panel.includes('<small>Nächste 3 Tage</small>'))failures.push('Prognose-Kompass verwendet noch die starre Drei-Tage-Angabe.');
if(failures.length){console.error('Prognose-Kompass-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Prognose-Kompass zeigt die dynamisch weitgehend gesicherte Prognosedauer statt pauschal drei Tage.');

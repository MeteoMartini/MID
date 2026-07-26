import {readFile} from 'node:fs/promises';
const [app,panel]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8')
]);
const failures=[];
if(!app.includes("useState(()=>storedModuleOpen('ensemble',false))"))failures.push('Ensemble-Anforderung wird nicht aus dem gespeicherten Offen-Zustand initialisiert.');
const resetMatches=[...app.matchAll(/setEnsembleRequested\(false\)/g)];
if(resetMatches.length!==1)failures.push(`setEnsembleRequested(false) darf nur beim tatsächlichen Schließen vorkommen; gefunden: ${resetMatches.length}.`);
if(!app.includes('onClose={()=>setEnsembleRequested(false)}'))failures.push('Schließen des Ensemble-Moduls setzt die Anforderung nicht zurück.');
if(panel.includes("import {toBlob} from 'html-to-image'"))failures.push('PNG-Exportbibliothek wird noch statisch mit dem Ensemble-Hauptmodul geladen.');
if(!panel.includes("await import('html-to-image')"))failures.push('PNG-Exportbibliothek wird nicht erst beim Teilen dynamisch geladen.');
const fallbackStart=panel.indexOf('if(!d.length)return');
const fallbackEnd=panel.indexOf('const rainScale=',fallbackStart);
const fallback=panel.slice(fallbackStart,fallbackEnd);
if(!fallback.includes('<EnsembleHelpToolbar runs={runs}/>'))failures.push('Modellstände fehlen im Ensemble-Fallback.');
if(!fallback.includes('<ModelRunChangeRadar report={changeReport}'))failures.push('Modelllauf-Änderungsradar fehlt im Ensemble-Fallback.');
if(!panel.includes('<CombinedTrendChart'))failures.push('Temperatur-Ensemble-Diagramm fehlt.');
if(!panel.includes('className="chart rain"'))failures.push('Niederschlags-Ensemble-Diagramm fehlt.');
if(failures.length){console.error('Ensemble-Sichtbarkeitsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Sichtbarkeit geprüft: Ladeanforderung bleibt bei geöffnetem Modul aktiv; Diagramme, Modellstände und Änderungsradar sind vom PNG-Export entkoppelt.');

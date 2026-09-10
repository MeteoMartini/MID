# MID Testreport v0.9.84.27

## GitHub-Befund #982
- Sichere ZIP-Extraktion: bestanden.
- `npm ci`: bestanden, 202 Pakete.
- Dependency-Audit: bestanden, keine High/Critical-Befunde.
- TypeScript 7.0.2: bestanden.
- Vite 8.2.2 Produktionsbuild: bestanden, 2597 Module.
- Regressionen: 17/734 schlugen aufgrund veralteter Strukturerwartungen bzw. alter fachlicher Erwartungen fehl.

## Korrekturprüfung
Alle 17 in #982 fehlgeschlagenen Regressionen wurden nach der Anpassung erneut ausgeführt. Toolchainabhängige Tests wurden lokal mit der vorhandenen TypeScript-API bzw. einem reinen lokalen Testshim ausgeführt; produktiver Quellcode wurde dafür nicht verändert. Ergebnis: 17/17 bestanden.

Besonders geprüft:
- DWD/WMO-Regenschauer 80–82 sowie 91/92; 82 bleibt sehr stark.
- Mengenbasierte Schauerstufen einschließlich konservativer 0,4–<0,7-mm/10-min-Lücke.
- Graupel/Hagel 87–90 und Hagel-Gewitter 96/99 im Radar-/Modell-Phasenoverlay.
- WMO 98 als Gewitter ohne erfundene Niederschlagsphase.
- Ensemble-Gewittersymbol ohne notwendige Niederschlagsglyphe.
- Astronomische Tag-/Nachtentscheidung bei gleichzeitig durchgereichter Piktogrammintensität.
- Ganze Zentimeter bei sichtbarer Schneehöhe.
- Appweite Skybar-Intensitätsklassifikation und Update-/Startup-Recovery-Vertrag.

## Schlussprüfung
Der kanonische TypeScript-7-/Vite-Build wurde bereits im GitHub-Lauf #982 für denselben Produktionscode erfolgreich durchlaufen. Die nächste GitHub-Pipeline ist die verbindliche Gesamtbestätigung für die korrigierte Regression-Suite.

## Transport-Rückprüfung
Das zunächst erzeugte unversionierte Professional-Transport-ZIP wurde in ein frisches Verzeichnis entpackt und unabhängig vom Arbeitsbaum geprüft. Ergebnis:
- ZIP-Integrität/Pfadsicherheit/Symlink-Schutz: bestanden; 1.911 Dateien.
- Alle 17 in GitHub #982 fehlgeschlagenen Regressionen: 17/17 bestanden.
- Versionierung, Baseline, Release-Lineage und Uploadbudget: bestanden.
- Lokale Importziele: 160 TypeScript-Dateien vollständig.
- Neuer Piktogramm-/Schneehöhenvertrag: bestanden.
- `public/service-worker.js`, `public/sw.js`, `worker.js` und `worker/metar-proxy.js`: Syntaxprüfung bestanden; beide Service Worker sind identisch.

Die lokale Wiederholung toolchainabhängiger Regressionen verwendet ausschließlich einen Testshim auf Basis der vorhandenen TypeScript-API; dieser Shim ist nicht Bestandteil des Transport-ZIP. Der echte TypeScript-7.0.2- und Vite-8.2.2-Produktionsbuild wurde im GitHub-Lauf #982 bereits erfolgreich für denselben Produktionscode ausgeführt. Nach Aufnahme dieses Testreports wird das ZIP erneut gepackt und nochmals aus dem finalen Paket verifiziert.

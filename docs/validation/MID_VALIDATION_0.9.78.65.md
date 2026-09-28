# MID 0.9.78.65 – lokale Validierung

Geprüft am 5. September 2026 auf Basis des ausgelieferten 0.9.78.64-Quellpakets.

| Prüfung | Ergebnis |
|---|---|
| Versionsabgleich: package, Baseline, iOS-Metadaten, Worker und Service Worker | erfolgreich synchronisiert |
| TypeScript App und Node-Konfiguration (`npm run verify:types`) | bestanden |
| Produktionsbuild (`npm run verify:vite`, abschließend `npm run build`) | bestanden |
| Worker-JavaScript-Syntax (`node --check worker/metar-proxy.js`) | bestanden |
| Vollständige Regression (`npm run test:regressions`) | alle 683 automatisch erkannten Tests bestanden |
| Neue Mehrparameter-Verhaltenstests | bestanden |
| Native Tagesgrenzen und fehlende Stunden, nach abschließender Korrektur separat erneut geprüft | bestanden |
| Gemeinsame Detailansicht und Prognose-Kompass mit React serverseitig gerendert | bestanden |

Die neuen Tests prüfen: schwächster Parameter, fehlende Sonne/Böen, unvollständige native Tageswerte, veraltete und unbekannte Modellläufe, Zukunftszeitstempel, synthetische statt nativer Mitglieder, unzureichende Mitgliederabdeckung, Gruppen-/Variantengewichtung, Anzeigeschwellen, spätere Zeitfenster, Datenlücken und tatsächliche Verschlechterungen. Ein konsistent vorhergesagter Sturm bleibt von Schönwetter unterscheidbar. Der Tagesgrenzentest weist insbesondere nach, dass der Start-Mitternachtswert zum Vortag gehört und ein fehlender End-Mitternachtswert vollständige Niederschlagsevidenz verhindert.

Beim ersten Integrationslauf meldeten acht ältere Prüfungen noch veraltete UI-Verträge beziehungsweise das nun ungenutzte Temperaturindex-Modul. Die Prüfungen wurden auf die gemeinsamen Parameterdetails migriert, das obsolete Laufzeitmodul entfernt und alle 683 Tests anschließend erfolgreich durchlaufen. Fachliche Warntext-, Modellstand-, Interaktions- und Rasterprüfungen bleiben aktiv.

Der Vite-Build meldet weiterhin große Chunks als Hinweis. Es gab keinen Build- oder Typfehler. Ein visuell interaktiver Browserlauf, physische iPhone-Abnahme oder produktive Liveprüfung der Wetteranbieter wurde nicht durchgeführt. Die Tests belegen implementiertes Verhalten; sie belegen keine empirische Wetterprognosegüte und keine numerische Gleichwertigkeit mit meteoblue.

Das Professional-ZIP enthält den vollständigen Quellstand einschließlich Methodik und Prüfskripten. Generierte Web-Builddateien und node_modules werden entsprechend dem bestehenden Installervertrag nicht transportiert; der Installer erzeugt den Produktionsbuild. Es wurde nichts bereitgestellt oder auf einem externen System installiert.

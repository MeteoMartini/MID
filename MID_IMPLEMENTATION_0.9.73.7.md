# MID v0.9.73.7 – 15‑Minuten‑RUC-Frontload und Wolkenschicht-Grauband

## Anlass

Für Nowcasting-nahe Zeiträume sollen die ersten Stunden des DWD-ICON-D2-RUC präziser nutzbar werden. Zusätzlich soll das Wolkenprofil im 24‑h‑Wetterprofil wieder wie in früheren Builds wirken: ohne höhenabhängige Graufarben, mit sauberem Fade-in/Fade-out und mit einer Dunkelheit, die je Schicht ausschließlich durch den jeweiligen Bewölkungsanteil bestimmt wird.

## RUC-/Nowcasting-Optimierung

Die kostenlose GitHub-Pages-RUC-Pipeline wurde so erweitert, dass das deterministische RUC-Bundle für die ersten sechs Stunden nun 15‑minütliche Schritte publiziert und danach bis +14 h stündlich weiterläuft. Damit bleibt das Paket für den Nahbereich deutlich feiner, ohne die spätere Kurzfrist unnötig aufzublähen.

RUC-EPS bleibt auf seinem stündlichen Raster. Dafür wurde das Metaschema kompatibel erweitert: `latest.json` enthält jetzt weiterhin die kanonische deterministische Zeitachse auf Top-Level und zusätzlich objektspezifische Zeitachsen für `deterministic`, `epsSummary` und `eps`. So kann der Worker deterministische 15‑Minuten-Daten lesen, ohne die stündlichen EPS-Summen/Quantile zu verbiegen.

`tools/ruc/build_ruc_bundle.py` baut damit deterministische Niederschlagsintervalle, Windableitungen und alle übrigen Punktfelder auf der hybriden Zeitachse. `tools/ruc/ruc_pack.py` schreibt die differenzierten Metadaten, und der Worker liest diese objektspezifischen Zeitachsen jetzt explizit aus.

## Wolkenprofil-Optimierung

Im 24‑h‑Wetterprofil werden hohe, mittlere und tiefe Wolken weiterhin getrennt ausgewiesen, aber nicht mehr durch unterschiedliche Grundgrautöne codiert. Stattdessen verwenden alle drei Schichten ein gemeinsames neutrales Grau. Die visuelle Intensität ergibt sich pro Schicht nur noch aus dem jeweiligen Bedeckungsgrad.

Für das gewünschte meteorologische Ein-/Ausblenden wurden die Übergänge geglättet:

- das Band im Hintergrund fadet entlang der Zeitachse weicher ein und aus,
- jede Wolkenzelle erhält zusätzlich ein eigenes horizontales Gradient aus Vorher/Nachher-Nachbarn,
- starke Schichtsprünge werden früher weich gebrochen, damit harte Blöcke vermieden werden.

Auch die Legenden-/Tooltip-Symbole des Wetterprofils wurden auf das neue einheitliche Grau umgestellt.

## Prüfstand

Lokal erfolgreich ausgeführt:

- `python -m py_compile tools/ruc/*.py`
- `python tools/ruc/test_ruc_pack.py`
- `python tools/ruc/test_prepare_ruc_pages.py`
- `node --check worker/metar-proxy.js`
- `npm run test:forecast-cockpit`
- `npm run test:weather-profile-pressure-hazards`
- `npm run test:weather-profile-rolling-openmeteo-audit`
- `node scripts/test-mid-weather-profile-thermal-sun-09320.mjs`
- `npm run test:favorite-authoritative-persistence`
- `npm run test:favorite-order-persistence`
- `npm run test:favorite-storage-mirror-revision`

`npm run build` bzw. lokales `tsc` bleiben in diesem Linux-Arbeitsstand weiterhin durch unvollständige/offline fehlende Typdefinitionen in `node_modules` blockiert. Das ist dieselbe bekannte Umgebungsgrenze; die fachliche Freigabe des Releases benötigt daher erneut den Release-CI-Lauf.

## Worker / Upload

Der gemeinsame Worker wurde fachlich mitangepasst, weil er die neuen objektspezifischen RUC-Zeitachsen lesen muss. **Ein Worker-Upload ist daher erforderlich.**

## App-weite Modellstand-/RUC-Textprüfung

Die sichtbaren Modellstand- und Quellenformulierungen wurden nach der technischen RUC-Aktivierung app-weit gegen den tatsächlichen Datenweg geprüft und korrigiert.

- DWD ICON-D2-RUC wird nicht mehr als bloße „Verfügbarkeitsquelle“ oder optionaler Zukunftsadapter beschrieben, sondern als numerisch eingebundener DWD-Open-Data → GitHub-Pages → Worker-Kurzfristpfad.
- DWD ICON-D2-RUC-EPS wird ausdrücklich als stündlicher probabilistischer Kurzfristpfad bis +14 h beschrieben.
- Die Best-Match-Erklärung stellt Open-Meteo korrekt als Leitprognose dar und trennt davon die zusätzliche MID-Kurzfristfusion, Radar/Nowcast und Beobachtungskorrekturen.
- In den Modellstand-Popovern heißen die Bereiche nun „Best Match + MID-Kurzfristfusion“ und „Rapid-/Regionalmodelle“.
- Das Badge `RUC` wird nur noch für echte DWD-ICON-D2-RUC/RUC-EPS-Zeilen verwendet. Andere stündliche Rapid-Update-Modelle wie KNMI HARMONIE, HRRR, AROME-15-min oder UKV erhalten das Badge `Rapid` und werden damit nicht mehr fälschlich als RUC bezeichnet.
- Die allgemeine Quelleninfo nennt den produktiven RUC/RUC-EPS-Pfad ausdrücklich.
- Der Radar-Niederschlagsart-Kommentar wurde fachlich geklärt: Der räumliche Phasenlayer benötigt weiterhin ein eigenes Modellraster; der RUC-Punktpfad der Kurzfristfusion ersetzt dieses Flächenraster nicht.

Die bestehende Regression `test-model-meta-source-init-08321.mjs` wurde vom alten Availability-only-Vertrag auf den produktiven numerischen RUC-Pfad umgestellt. Die Rapid-/RUC- und Pipeline-Regressionen laufen mit den neuen Text- und Zeitachsenverträgen grün.

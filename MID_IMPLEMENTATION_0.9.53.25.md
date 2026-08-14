# MID v0.9.53.25

## Aktuelles Wetter / Hyperlokale Analyse – Warmstart und Datenqualität

### Ursache der sichtbaren Regression
Seit der Standort-/Request-Wiederverwendung aus v0.9.53.22 konnte ein kurzfristig gespeicherter schneller Stationsabruf denselben Cachepfad wie die vollständige hyperlokale Analyse belegen. Beim nächsten Start wurde dieser provisorische Stationsstand als ausreichend frisch behandelt. Dadurch konnte die vollständige Modell-/Stationsanalyse vorübergehend ausbleiben und die Oberfläche länger bei einem einfachen Messwertabgleich bzw. Best-Match-Feldern verbleiben.

### Korrektur
- Provisorische Stationsresultate und angereicherte Analysen werden getrennt gespeichert (`station-provisional` vs. `station`).
- Ein einfacher Stationsstand darf eine vorhandene höherwertige Analyse nicht mehr ersetzen.
- Ein provisorischer oder unvollständiger Cache löst automatisch wieder die vollständige Hyperlokalanalyse aus.
- Nur eine bereits hochwertige und höchstens zwei Minuten alte Analyse wird ohne erneuten Netzabruf unmittelbar weiterverwendet.
- Beim App-Warmstart werden verfügbare aktuelle Stations-/Analyse-, Luftqualitäts-, Radar- und Radarhistorie-Daten sofort aus dem lokalen Cache in die Oberfläche übernommen, während die Kernvorhersage aktualisiert wird.
- Fehlt ein Stationscache, startet parallel zur Kernvorhersage nur ein leichter Beobachtungsabruf (METAR/DWD/Bright-Sky-Pfad) ohne zusätzlichen Modellhintergrund. Die vollständige Hyperlokalanalyse folgt danach. So erscheinen Echtzeitbeobachtungen früher, ohne die Open-Meteo-Modellabrufe wieder parallel hochzufahren.
- Der lokale Modellhintergrund der Hyperlokalanalyse wird über Neustarts hinweg kurzfristig persistent gecacht; bei temporären Abruffehlern ist ein begrenzter Stale-Rückfall möglich.
- Gelände-/Morphologieprofile werden bis zu 14 Tage persistent wiederverwendet. Die teuren Höhenprofilabfragen müssen daher nicht bei jedem PWA-Neustart erneut erfolgen.
- Der neutrale Rohstations-Fallback heißt in der Hauptkarte `Messwertabgleich`; `Hyperlokale Analyse` wird nur angezeigt, wenn tatsächlich Modellhintergrund und Analyseverfahren vorliegen.

### Unverändert
Die fachliche Hyperlokallogik, Feldquellen/Provenienz, DWD-ICON-D2-Hintergrund, Gelände-/Oberflächenkorrekturen, Messwertgewichtung sowie die bestehenden Radar-, Niederschlags-, Luftqualitäts- und Warnungsfunktionen bleiben erhalten.

Neue Required Regression: `scripts/test-current-hyperlocal-restart-095325.mjs`.

### Buildfix nach Installer-Typprüfung
- Nullable Stationsanalyse in `Current()` abgesichert: `st` wird in den Hyperlokal-Detailinformationen nur noch optional gelesen. Damit sind TS18047-Fehler bei `analysisMethod` und `localContextSource` beseitigt.
- Regression `test-current-hyperlocal-restart-095325.mjs` schützt die Nullability-Guards.

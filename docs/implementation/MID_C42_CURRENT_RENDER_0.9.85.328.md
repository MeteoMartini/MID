# MID C42 · Wiederverwendung unveränderter Renderberechnungen (v0.9.85.328)

## Umfang

- Ausgangsbasis: veröffentlichter Stable-Stand `main=mid-stable=e5f509cce4e9f345392b24c7f800d84efc5f8837` (v0.9.85.327).
- `src/currentFullHourWindow.ts` extrahiert den reinen Stundenindex. Vollständige lokale Modellstunden werden pro Stundenarray und Zeitzone indiziert; bei jedem Render wird die echte aktuelle Epoche erneut gegen die Stundenfolge ausgewertet.
- Unter „Aktuell“ werden unveränderte Prognoseableitungen wiederverwendet: Stundenindex und Zeitfenster, Temperaturreihe, Temperaturbereich, Achsenticks, vollständige stündliche Skybar-Basis sowie Sonnenfenster und Nachtbänder.
- Viertelstunden-Niederschlag und die Kurzfristpunkte bleiben an die aktuelle Sonnenzeit gebunden. Beobachtungsalter und laufende Stunde werden weiter bei jeder Uhraktualisierung neu ausgewertet.
- Keine Änderung an Wetterfachwerten, CSS, Theme, Widgets, Exportformaten, Timerverhalten oder meteorologischem Fachkern.

## Verhaltensnachweise

- `scripts/test-hour-window-formatter-0985327.mjs`: 420 Golden-Vergleiche gegen den historischen Algorithmus über Berlin, London, New York und Kathmandu; Sommer-/Winterzeit, doppelte Herbststunde, unvollständige/Missing/ungültige Werte, neue Messwerte und wechselnde Referenzzeiten. Zusätzliche Assertions sichern den realen Stundenwechsel bei `Asia/Kathmandu` (+05:45) und die indizierte Implementierung.
- `scripts/test-complete-calendar-day-current-skybar-0985285.mjs`: vollständige 23-/24-/25-Stunden-Tage, Missing≠0, laufende Niederschlagsstunde und Live-Anbindung an `solarNow`.
- `scripts/test-visible-solar-clock-0985326.mjs`: Timer pausiert im Hintergrund und aktualisiert direkt nach Rückkehr; DST-Epoche, Sonnenrand und Cleanup bleiben geprüft.
- `scripts/test-current-skybar-canonical-0985230.mjs`, `scripts/test-current-shortterm-temperature-consistency-095340.mjs`, Browser-Fixture 28/28 responsive Fälle sowie App-Fixture für 390/1536 px Light/Dark bestanden.
- React Profiler im lokalen synthetischen C21-Entwicklungsfixture, 390×844, 11 Toggle-Updates je Variante: unveränderter .327-Median 34,1 ms / Mittel 36,0818 ms; geänderter .328-Median 25,1 ms / Mittel 27,1818 ms. Dies ist eine lokale Entwicklungsfixture-Messung ohne Live-Station, keine Produktions-, iOS- oder Gerätelaufzeitmessung.
- Produktionsbuild auf .328-Quellcode erfolgreich (TypeScript-App/Node, 2.701 Module). Gesamte registrierte lokale Suite `npm run test:regressions`: **1.022/1.022 bestanden** mit der im Repository deklarierten `tools/ruc/requirements-pages.txt`-Umgebung. Erster Lauf ohne diese separat installierten Testabhängigkeiten ließ zwei unabhängige RUC-Tests an fehlendem `eccodes`/`requests` scheitern; nach Einrichtung der isolierten venv bestanden diese Einzeltests und die vollständige Suite. Browser-Fixture: **28/28** responsive Design-/Theme-Kontexte. Durch `prebuild` synchronisierte Release-Mirrors werden Teil des PR-Änderungssatzes. Der vollständige GitHub Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Releasepfad ist noch separat erforderlich.

## Weiterhin offene Punkte

- Der vollständige CSS-Coverage-Nachweis fehlt weiterhin über alle Module, Overlays, Widgets, Exporte, Produktion, High Contrast, Safari/WKWebView und Cache-Zustände. Daher keine Extraktion oder verzögerte CSS-Ladung.
- Physische VoiceOver-/WKWebView-Abnahme bleibt erforderlich.
- Es wurden keine Abhängigkeiten aktualisiert; die in C41 genannten Patch- und Minor-Schritte werden in isolierten qualifizierten PRs behandelt. Pako 3 bleibt zurückgestellt.

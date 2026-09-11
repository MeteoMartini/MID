# MID v0.9.84.42 – Implementierung

## Extern

- Die MID-Hinweislage in Widgets deckt jetzt den **vollständigen ausgewählten Zeitraum** ab. 3-, 4-, 5-, 6- und 7-Tage-Widgets können Hinweise an jedem ausgewählten lokalen Kalendertag zeigen; die bisherige implizite 24-h-Begrenzung des Widgetpfads ist entfernt.
- Die normale MID-Hinweislage außerhalb des Widgets bleibt bewusst kurzfristig und behält ihren bisherigen 24-h-Startfenstervertrag.
- Der fehlgeschlagene GitHub-Installerlauf #995 wurde analysiert. TypeScript 7 und Vite waren erfolgreich; der Lauf stoppte ausschließlich an vier nach Wetterpiktogramm-Standard 2.1 veralteten Regressionserwartungen. Diese Tests wurden auf die bereits gültige Semantik aktualisiert, ohne die fachlichen Änderungen aus v0.9.84.41 zurückzunehmen.

## Intern

- `hazards()` akzeptiert optional `throughDate`. Ohne Enddatum bleibt `startLimit=24`; mit Enddatum reicht das DWD-Startfenster bis einschließlich des gewählten lokalen Kalendertags. Bis zu 72 h Folgehorizont bleiben für mehrstündige DWD-Kriterien erhalten.
- `Widget` leitet `widgetHazardThroughDate` aus dem letzten tatsächlich ausgewählten `days`-Eintrag ab und verwendet dieselbe automatische Hinweislage für Karten- und Kurvenexport.
- `test-hyperlocal-fields.mjs` prüft Stationsfelder nun reihenfolgeunabhängig und schützt `presentWeather`.
- `test-night-icons-astronomy-08130.mjs` schützt Wettercode, Intensität, Present Weather und Tag/Nacht getrennt.
- `test-radar-phase-echo-recovery-09406.mjs` schützt die erweiterten Radar-Echoschwellen für Graupel/Hagel-neutral sowie WMO 76–79.
- `test-ui-polish-night-icons-09145.mjs` schützt die aktuellen Gewitterfamilien und Nachtgradienten semantisch statt über einen veralteten Einzeiler.
- `MID_FORECAST_CONSISTENCY_CONTRACT.md` schreibt den Widget-Hinweishorizont verbindlich app-weit fest.

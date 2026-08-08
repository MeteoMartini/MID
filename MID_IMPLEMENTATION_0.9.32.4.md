# MID v0.9.32.4

## 24-h-Wetterprofil – Touch-, Responsivitäts- und Klarheitsfix

- Info-Schaltfläche bereinigt: das Symbol erscheint nun ohne zusätzliches „(i)“.
- Diagramm reagiert auf mobilen Geräten direkter auf Taps; die Trefferflächen greifen nun auch über Pointer-/Touch-Start robuster.
- Wetterprofil-Canvas skaliert responsiver zur tatsächlichen verfügbaren Breite; der übergroße Leerraum auf schmalen Displays entfällt.
- Zeitangaben oberhalb des Profils folgen jetzt einem regelmäßigen Raster (mobil 6 h / mittel 4 h / breit 3 h) statt unruhiger Mischabstände.
- Tagesextreme werden je Kalendertag mit Zahlenwerten direkt am Temperaturverlauf markiert; es werden nur Werte aus dem tatsächlich angezeigten Intervall genutzt.
- Stündliche Wetterpiktogramme im Profil werden ohne querlaufende Hintergrundstreifen dargestellt.
- Windrichtungspfeile im Profil wurden etwas schlanker und dezenter abgestimmt.
- Wolken H/M/L zeigen keinen zusätzlichen kontrastreichen Flächenhintergrund mehr; sichtbar kontrastreich bleibt nur die tatsächliche Bewölkungsausprägung.

## Regression / Versionierung

- Wetterprofil-Regressionsverträge auf den neuen Sollstand synchronisiert (`09323`, `09321`, `09186`).
- Vollständige Versionssynchronisierung auf `0.9.32.4` (`package.json`, `MID_BASELINE.json`, `public/version.json`, `service-worker`, `worker`).
- Vollständige Suite: 329/329 Tests bestanden.

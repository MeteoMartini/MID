# MID Test Report 0.9.84.79

## Bestandene lokale Prüfungen

22 gezielte, für diesen Darstellungsblock relevante Regressionen wurden erfolgreich ausgeführt. Darunter:

- neuer `test-appwide-readability-continuation-098479.mjs`
- Responsive Layout / Event / 24-h-Overlay / Ensemble-Tooltip
- Design-Audit 3/4
- Current-Header-Density und Secondary-Detail-Popover
- Visualisierungs-Audit Block 1 und 2
- Reise-Center, Header/Favoriten, Extremwetter, Kurzfrist/Komposit
- Header-Versionsanzeige
- Quellen-Audit amtlicher Quellen
- UI-Standardisierung und Apple-Adaptive-Design
- Forecast-Confidence
- 7-/14-Tage-Hoch-/Querformatverträge
- Desktop-Prognoselayout, Current-Modulkontrollen und PWA-Installationsdialog
- Versionsvertrag

`src/styles.css` wurde aus den fünf kanonischen Style-Modulen neu erzeugt und im neuen Test bitgenau gegen deren Verkettung geprüft.

## Technische Syntaxprüfung

- `worker.js`: keine Fachlogik geändert; nur Versionsmetadaten synchronisiert.
- `worker/metar-proxy.js`: keine Fachlogik geändert; nur Versionsmetadaten synchronisiert.

## Lokal nicht ausführbar

Zwei ältere Layouttests (`test-location-thunder-water-tide-layout-09644.mjs` und `test-water-tide-minute-hazard-layout-082617.mjs`) verlangen das Dev-Modul `typescript-strada`. Im übergebenen Professional-ZIP ist `node_modules` absichtlich nicht enthalten; deshalb brechen diese Tests bereits beim Modulimport ab und nicht wegen eines fachlichen Assertionsfehlers.

Der globale `tsc --noEmit` kann aus demselben Grund ohne installierte React-/Capacitor-/weitere Projektabhängigkeiten nicht als Buildprüfung verwendet werden. Ein neuer Chromium-Live-Screenshotlauf ist in der isolierten Umgebung weiterhin durch die Container-D-Bus/Zygote-/Renderer-Initialisierung blockiert. Es wird daher kein nicht ausgeführter Live-Render oder vollständiger Build als bestanden ausgegeben.

Der Ausgangscommit v0.9.84.78 war vor Beginn mit dem aktuellen `mid-stable`-Stand identisch; dessen aktuelle GitHub-Workflows liefen erfolgreich. Der eigentliche v0.9.84.79-CI-Gate muss nach Upload wie gewohnt die vollständige Installations-/Build-/Regressionsebene übernehmen.

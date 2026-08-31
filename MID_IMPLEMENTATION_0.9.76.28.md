# MID v0.9.76.28 – Umsetzungsnachweis

## Anlass
- Nachschärfung der Extremwetter-Detailkarte und des 24-h-Wetterprofils.
- Nutzerhinweise:
  1. Extremwetter: Regenmengen dürfen in den stärksten Regionen nicht mehr irreführend als `0 mm` erscheinen, wenn der 0–6-h-RUC bereits relevante Akkumulationen liefert.
  2. Extremwetter: Geländehöhen sollen lesbarer auf runde 10 m bzw. 100 m gerundet werden.
  3. 24-h-Wetterprofil: nur noch eine senkrechte Tagesgrenze bei 24/00 Uhr.
  4. 24-h-Wetterprofil: Nachtstunden mit dezentem Hintergrund und weichem Fade an Sonnenuntergang/Sonnenaufgang.

## Umsetzung

### 1) Extremwetter – Regenmengen robuster ausgeben
- `worker-src/25-dach-extreme-outlook.js`
  - RUC-Rapid-Regenmetriken werden bei `0–6 h` nicht nur als Zusatzdiagnostik mitgeführt, sondern bei fehlender/nahezu nulliger Basisakkumulation auch als sichtbare Primär-Regenmenge in `signal.metrics.rainMm` und `signal.metrics.windowHours` übernommen.
  - Fallback-Reihenfolge:
    - zuerst vorhandene 6-h-RUC-Akkumulation,
    - falls diese nicht vorliegt: 15-min-RUC-Maximum.
- `src/extremeWeatherOutlookDirect.generated.js`
  - per Aggregat-Synchronisierung mit derselben Logik aktualisiert, damit Browser-Direktberechnung und Worker denselben Vertrag einhalten.
- `src/ExtremeWeatherOutlookPanel.tsx`
  - neue UI-Helfer `rainMetricDisplay()` und `rainMetricLabel()`.
  - Die Regionsliste und die Detailkarte für Regengefahren verwenden nun dieselbe robuste Anzeige-Logik und zeigen bevorzugt die sinnvollste verfügbare Regenakkumulation statt blind `rainMm`.

### 2) Extremwetter – Geländehöhe lesbarer runden
- `src/ExtremeWeatherOutlookPanel.tsx`
  - neue Helfer `roundedTerrainElevation()` und `terrainElevationLabel()`.
  - Rundung:
    - unter 1000 m: auf 10 m,
    - ab 1000 m: auf 100 m.
  - Eingebunden in Regen-, Wind- und Schnee-Detailzeilen.

### 3) 24-h-Wetterprofil – nur eine Tagesgrenze
- `src/ForecastCockpit.tsx`
  - Einführung von `midnightBoundary=chartDayBands[1]??null`.
  - Die Vollhöhen-Tageslinie wird nur noch einmal für die tatsächliche 24/00-Uhr-Grenze gerendert.
  - Stundenlinien bleiben bestehen, erhalten aber keine zusätzliche zweite „major“-Vollhöhenlinie mehr.

### 4) 24-h-Wetterprofil – dezente Nachtbänder mit Fade
- `src/ForecastCockpit.tsx`
  - Nachtsegmente werden nun aus dem Startzustand (`isDay`) plus den Solarereignissen innerhalb des 24-h-Fensters abgeleitet.
  - Für jedes Nachtsegment wird ein eigenes horizontales SVG-Gradientband erzeugt.
  - Fades:
    - weich einblendend ab Sonnenuntergang,
    - weich ausblendend bis Sonnenaufgang.
- `src/styles-src/30-modern.css`
  - Nachtband-Styling auf pointer-only reduziert; die eigentliche optische Ausprägung kommt jetzt aus den SVG-Gradienten.
- `src/styles.css`
  - via Aggregat-Synchronisierung aktualisiert.

## Validierung
Ausgeführt:
- `node scripts/test-extreme-rain-profile-night-097628.mjs`
- `node scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `npm run verify:types`
- `npm run verify:vite`

Erwartetes Ergebnis:
- Extremwetter-Regenkarten zeigen in der Detailkarte keine irreführenden `0 mm`, wenn RUC-Rapid bereits eine sinnvolle 6-h-/15-min-Akkumulation liefert.
- Geländehöhen erscheinen gerundet und dadurch ruhiger lesbar.
- Im 24-h-Profil ist nur eine Tagesgrenze vorhanden.
- Nachtstunden sind dezent hervorgehoben und an Sonnenuntergang/Sonnenaufgang weich eingefadet.

## Release-Artefakte
- Professional ZIP: `MID-professional-replacement.zip`
- Worker ZIP: `MID-worker.zip`

## Worker-Upload
- **Ja, erforderlich.**
- Grund: fachliche Worker-Logik in `worker-src/25-dach-extreme-outlook.js` wurde geändert; damit muss der aktualisierte Worker mit ausgeliefert werden.

# MID Implementation v0.9.77.4

## Schwerpunkt
Witterungstrend **Tag 15–46** fachlich und funktional weitergeführt.

## Umgesetzt
- **EC46-Klimamittel korrigiert:**
  - die Klimareferenz wird nicht mehr über starre Wochenoffsets, sondern über die **Wochen-Zeitachse** (`weekly.time`) auf die angezeigten Wochenblöcke gemappt.
  - damit bleiben insbesondere **Teilwochen am Periodenende** konsistent und die auffälligen Ausreißer in den Klimamittel-Linien (z. B. Temperatur/Luftdruck) werden vermieden.
- **Temperatur aufgesplittet:**
  - bisheriger Temperatur-Slot ersetzt durch **Tmax** und **Tmin**.
  - Umsetzung im üblichen Farbkonzept: warm für Tmax, kühl für Tmin.
- **Wind erweitert:**
  - zusätzlicher Parameter **Windböen**.
  - Wind- und Böenwerte werden über die API nun explizit in **kt** abgefragt und danach appweit in die gewählte Einheit umgesetzt.
- **Tooltip auf Punktklick/-tipp:**
  - das Hauptdiagramm zeigt jetzt bei Klick/Tipp auf einen Kurvenpunkt ein kompaktes Tooltip.
  - Inhalt: Wochenblock, Datumsbereich, Ensemble-Mittel, P25–P75, P10–P90 und – sofern vorhanden – das zugehörige **EC46-Klimamittel**.
- **UI/CSS nachgezogen:**
  - neue Metrikfarben für **Tmax**, **Tmin** und **Windböen**.
  - Hit-Areas und Tooltip-Styling für die Trendkurven ergänzt.
- **Upload-/Release-Prüfung mitgeführt:**
  - bestehender Release-Upload-Budget-Test erneut geprüft.
  - Ziel: ZIPs bleiben weiter innerhalb des für Uploads vorgesehenen Rahmens.

## Technisch geänderte Dateien
- `src/SubseasonalTrendPanel.tsx`
- `src/styles-src/10-features.css`
- `src/styles.css`
- `scripts/test-trend14plus-09770.mjs`
- `scripts/test-parameter-colors-trend14plus-09771.mjs`
- `CHANGELOG.md`
- `MID_BASELINE.json`
- `MID_IOS_STATUS.json`
- `package.json`
- `src/version.ts`

## Hinweise
- NOAA GEFS bleibt weiterhin bis **Tag 35** verfügbar; ab **Tag 36** läuft der Multi-Modell-Pfad automatisch nur noch mit der verbleibenden EC46-Modellfamilie.
- Für Windböen gilt der Zusatz *„soweit verfügbar“*: die UI ist vollständig vorbereitet und die Datenanforderung ergänzt.

## MID v0.8.27.7

### Ursache
Der Produktionsbuild der v0.8.27.6 war erfolgreich. Der Workflow scheiterte anschließend an acht Regressionstests, die noch feste ältere Versionsnummern oder die vor v0.8.27.6 geltende Temperaturachsen-/Wetterband-Geometrie erwarteten.

### Korrektur
- Versionsgebundene Schutztests prüfen jetzt einen Mindeststand und die Synchronität von `package.json` und `MID_BASELINE.json`.
- Achsen-, Export-, Hochformat-, Tooltip-, Wetterband- und Recharts-3-Tests wurden auf die in v0.8.27.6 eingeführte größere Datumsachsenreserve und die angehobenen, zentrierten Wetterkacheln aktualisiert.
- Keine sichtbare Funktion wurde zurückgenommen.

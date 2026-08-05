# MID v0.9.17.4

## Schwerpunkt
Kurzfrist-Cockpit überarbeitet:

1. Ersatz der bisherigen Kurzfristmatrix durch eine innovative diagrammatische Parametertimeline.
2. Eindeutige Start-/End-Kennzeichnung der 24-h-Leiste.
3. Deutlich flachere und kompaktere mobile Darstellung der 24-h-Leiste.

## Technische Umsetzung
- `src/ForecastCockpit.tsx`:
  - neue Kurzfrist-Parametertimeline mit interaktiven Zeitspalten
  - explizite Start-/End-Datumszeile für die 24-h-Leiste
  - bestehende Detailkarte bleibt an Zeitpunkte gekoppelt
- `src/styles.css`:
  - neue Styles für `cockpit-short-diagram-*`
  - mobile Verdichtung der `cockpit-hourly-preview`-Elemente

## Hinweise
- Der lokale Build konnte in der CAAS-Umgebung nicht vollständig gegen npm-Abhängigkeiten ausgeführt werden, weil das Paket-Repository hier nicht erreichbar war. Die inhaltliche Änderung ist jedoch auf Build-Fallen wie ungenutzte Imports geprüft und konsistent fortgeschrieben.
## CI-Korrektur
- Die Beschreibung der Temperatur-Lane nennt wieder ausdrücklich das `Temperaturmittel`. Damit bleibt der bestehende Cockpit-Usability-Vertrag erhalten und `test-cockpit-ensemble-usability-0980.mjs` besteht weiterhin.


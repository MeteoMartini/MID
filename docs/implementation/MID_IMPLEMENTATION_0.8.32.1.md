# MID v0.8.32.1

## Modellquelle und Initialisierung geprüft

### ECMWF AIFS
- Die bisherige Modell-ID `ecmwf_aifs025` lieferte veraltete Metadaten und führte zur Anzeige eines Modelllaufs vom 24.02.
- MID verwendet nun die aktuelle Open-Meteo-Datensatz-ID `ecmwf_aifs025_single`.
- Worker und Mehrquellenfusion versuchen die aktuelle AIFS-Single-ID zuerst; ältere IDs bleiben ausschließlich als technischer Fallback hinterlegt.

### Plausibilitätsprüfung der Modellläufe
- Modellmetadaten werden nur übernommen, wenn Initialisierungs- und Verfügbarkeitszeit zeitlich plausibel sind.
- Monatealte, zukünftige oder inkonsistente Metadaten werden verworfen.
- Die zulässige Laufalterung wird dynamisch aus dem Aktualisierungsintervall abgeleitet.

### Best Match
- Open-Meteo weist in der Best-Match-Antwort nicht für jede Stunde und Variable das konkret verwendete Ursprungsmodell aus.
- Die frühere Beschriftung „Wahrscheinliche Kette“ konnte daher einen nicht belegten Eindruck erwecken.
- MID zeigt jetzt nur noch „Am Standort potenziell relevante Regionalmodelle“ und kennzeichnet die Laufzeiten ausdrücklich als Daten der Open-Meteo Metadata API.

## Geänderte Dateien
- `src/weather.ts`
- `src/App.tsx`
- `worker/metar-proxy.js`
- `scripts/test-model-meta-source-init-08321.mjs`
- `scripts/test-priority-forecast-fusion-08320.mjs`
- Versions- und Baseline-Dateien

## Verifikation
- vollständige MID-Regressionssuite bestanden
- 230 Tests erfolgreich
- TypeScript-Transpilation der geänderten Frontenddateien bestanden
- Worker-Syntaxprüfung bestanden

# MID v0.9.79.4 · Optionales Bedienkonzept, Schritt 5

## Ausgangsbasis

Verbindlicher vorheriger Stand: **v0.9.79.3**.

## Umsetzung

- Der optionale `bottom-tabs`-Modus besitzt nun einen verdichteten Prognose-Arbeitsraum.
- Die äußere Horizontleiste `90 min · 24 h · 7 T · 14 T · 46 T · Saison` bleibt der einzige zusätzliche Top-Level-Zeitnavigator des neuen Modus.
- Der zuletzt gewählte Horizont wird mit `mid:modernForecastHorizon:v1` persistent gespeichert.
- Der Bottom-Tab **Prognose** kehrt bevorzugt zum zuletzt verwendeten verfügbaren Horizont zurück.
- Im Prognose-Cockpit werden im neuen Arbeitsraum die bisher zusätzliche Cockpit-Kopfzeile und interne Horizonttabs nicht doppelt gerendert; die Cockpit-Daten- und Zustandslogik bleibt unverändert.
- In der klassischen Prognosedarstellung werden ausschließlich im `bottom-tabs`-Modus auf kompakten Geräten redundante Kurzfrist-/7-Tage-Überschriften und Rahmen reduziert; 14-Tage-/Langfrist-Aufklappcontrols bleiben sicher bedienbar.
- Keine neuen Datenrequests und keine Änderungen an Forecast-Fusion, Ensembleberechnung, Radar-/Satellitenprodukten, Radarfarben, Parameterfarben, Piktogrammen oder Einheiten.
- `classic` bleibt unverändert der vollständige Fallback.

## Verifikation

Neue verpflichtende Regression: `scripts/test-modern-forecast-workspace-09794.mjs`. Die Regressionen aus Schritt 1–4 bleiben weiterhin verpflichtend.

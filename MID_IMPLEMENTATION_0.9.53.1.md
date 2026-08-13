# MID v0.9.53.1 – CI-/Regressions-Hotfix

## Ausgangsbasis

Basis ist MID v0.9.53.0. Der Produktionsbuild war erfolgreich; die Release-Pipeline wurde ausschließlich durch vier Regressionstests gestoppt. v0.9.53.1 korrigiert deren Verträge und zwei dabei sichtbar gewordene Semantik-/UI-Regressionspunkte, ohne den Funktionsumfang abzubauen.

## Korrekturen

1. **Event Center / Favoriten** – Beim gezielten Favoriten-Refresh werden alle aktiven Favoriten geprüft. Die Schutzgrenze von 20 Einträgen gilt nur für den allgemeinen Hintergrundlauf.
2. **Hyperlokale Analyse** – Dynamische Ergebniswerte bleiben im erweiterten Modus direkt sichtbar: Modellhintergrund, lokale Temperaturkorrektur, Geländeparameter, dynamische Windexposition und Oberflächenkontext. Das Info-Popover enthält nur Methodik, Messnetze und Kontextquellen.
3. **ICON-D2-RUC-Testvertrag** – Die Regression schützt nun die aktuelle Architektur: direkte DWD-Verfügbarkeitsprüfung, optionaler Punktadapter und Availability-only-Fallback bei fehlendem Decoder. Es wird kein kostenpflichtiger Punktdecoder aktiviert oder vorausgesetzt.
4. **Forecast-Fusion-Testvertrag** – Der Worker-Routencheck erwartet den seit v0.9.53.0 erforderlichen env-fähigen Aufruf `forecastFusionResponse(u,env)`.

## Deployment

Frontend-ZIP erneut über die bestehende MID-Release-Pipeline installieren. Der Worker enthält keine fachliche Änderung; ein Cloudflare-Worker-Upload ist für v0.9.53.1 nicht erforderlich.

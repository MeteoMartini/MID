# MID Testreport v0.9.84.20

Ausgangsbefund GitHub #975:
- Release-ZIP strukturell gültig.
- `npm ci`: erfolgreich, 202 Pakete.
- Dependency-Audit: erfolgreich, keine HIGH/CRITICAL-Befunde im verfügbaren Advisory-Pfad.
- TypeScript 7.0.2: erfolgreich.
- Vite 8.2.2: Produktionsbuild erfolgreich, 2597 Module.
- Regressionen: 2 von 731 fehlgeschlagen; ausschließlich `test-seven-day-ecmwf-hourly-09781.mjs` und `test-widget-curve-overview-09845.mjs`.

Korrektur und gezielte Prüfung v0.9.84.20:
- Beide fehlerhaften Strukturregressionen an den gültigen optionalen ECMWF-Farbvertrag angepasst.
- Der 7-Tage-Test schützt weiterhin den ECMWF-Standardwert und die bedingte Farbausgabe.
- Der Widget-Kurventest schützt Windsteuerung und ECMWF-Farbsteuerung unabhängig von der JSX-Prop-Reihenfolge.
- Widget-Wind-/Temperatur-Export, Live-URLs, Ensemble-Widget, Versionierung, Baseline, Release-Lineage, lokale Importziele und Worker-/Service-Worker-Syntax werden vor Verpackung erneut gezielt geprüft.

Für v0.9.84.20 wurde keine Produktionslogik geändert. Ein lokaler `npm ci`-Versuch wurde nach 120 s wegen Pakettransport-Timeout abgebrochen; der bereits in GitHub #975 erfolgreiche TypeScript-7-/Vite-Build bleibt daher die Buildreferenz. Die zwei dort einzig fehlgeschlagenen Regressionen wurden gezielt korrigiert und lokal bestanden; die kanonische Vollbestätigung erfolgt im nächsten Release-Lauf.

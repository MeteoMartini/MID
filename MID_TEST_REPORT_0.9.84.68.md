# MID 0.9.84.68 – Testbericht

## Verifizierte Basis
- Arbeitsbasis: lokal bereits geprüfter MID-Stand v0.9.84.67.
- Unmittelbar vor der finalen Paketierung: GitHub `main` und `mid-stable` beide v0.9.84.67, Commit `a796b8f3bd306e6c0d2e8dbae0ff251fee63578a`.
- Neuer Wartungsstand: v0.9.84.68.

## Bestanden
- `scripts/test-model-family-consistency-09416.mjs`
- `scripts/test-openmeteo-watch-ensemble-ui-098468.mjs`
- `scripts/test-weather-aggregate-type-contract-09602.mjs`
- `scripts/test-model-skill-twin-consistency-09600.mjs`
- `scripts/test-forecast-fusion-canonical-weighting-09610.mjs`
- `scripts/test-openmeteo-update-audit-09540.mjs`
- `scripts/test-openmeteo-rapid-source-contract-097713.mjs`
- `scripts/test-ui-audit-standardization-098462.mjs`
- `scripts/test-shortterm-composite-readability-098467.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`
- `scripts/test-code-quality-0783.mjs`
- `node --check worker/metar-proxy.js`
- `node --check public/service-worker.js`

## Finalpaket-Verifikation
- Der fertige `MID-professional-replacement.zip` wurde in ein frisches Verzeichnis entpackt.
- Aus genau diesem ZIP bestanden Modellfamilien-, Open-Meteo-Watch-, Open-Meteo-Update-, Rapid-Source-, Versions- und Release-Lineage-Vertrag sowie Worker-/Service-Worker-Syntax.
- In produktiven Frontend-/Worker-Dateien sind keine `kma_ldps`-/`kma_gdps`-Referenzen mehr vorhanden.
- Beide ZIP-Archive bestehen den CRC-/Integritätstest.

## Patch-Verifikation
- KMA LDPS/GDPS fehlen im aktiven Frontend- und Worker-Katalog.
- Südkorea nutzt JMA MSM/JMA Seamless vor Best Match.
- Keine verwaiste KMA-GDPS-Referenz im Worker-Auswahlpfad.
- AROME France HD 15 min ist der erste API-Pfad der bestehenden Météo-France-AROME-Familie; stündliches AROME HD, AROME France und Seamless bleiben als Fallbacks erhalten.
- Generierte `src/weather.ts`, `worker/metar-proxy.js`, `worker.js` und `src/styles.css` wurden aus den kanonischen Source-Modulen neu aufgebaut.
- Die Design-Ergänzungen für Ensemble-Offenlegung/Prognose-Kompass verändern keine Ensembleberechnung, Gewichtung oder Diagrammgeometrie.

## Externe Aktualitätsprüfung
- Open-Meteo dokumentiert die ausgesetzten KMA-Aktualisierungen während der Migration von UM zu KIM.
- Open-Meteo Commit `9701689dd81ebef2d478800366c586c8a02c0c19` vom 11.09.2026 rekonstruiert fehlende PT15M-Niederschlags-/Schneedaten in Météo-France AROME HD 15 min aus rollierenden Stundensummen.

## Lokal nicht ausführbar
`scripts/test-source-quality-performance-08210.mjs` konnte in der isolierten Arbeitsumgebung nicht ausgeführt werden, weil `typescript-strada` nicht installiert ist (`MODULE_NOT_FOUND`). Das ist kein fehlgeschlagener Fach-Assert. Die vollständige reproduzierbare Abhängigkeitsinstallation, TypeScript-/Vite-Kette und der Gesamtlauf der Regressionen werden wie vorgesehen vom GitHub-Installer nach `npm ci` ausgeführt.

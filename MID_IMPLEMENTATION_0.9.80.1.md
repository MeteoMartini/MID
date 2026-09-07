# MID v0.9.80.1 – Merge Climate + v0.9.79.20

## Ausgangslage
- Bisheriger korrigierter Arbeitsstand: v0.9.79.20.
- Neu angelieferter Stand: v0.9.80.0 mit der neuen Klima-Sektion.

## Merge-Entscheidung
Der v0.9.80.0-Stand baut bereits auf v0.9.79.20 auf. Die drei CI-Korrekturen aus Release #929 (`test-cockpit-mini-precip-visibility-093211.mjs`, `test-hazard-validity-date-08186.mjs`, `test-mid-weather-profile-relative-signals-09327.mjs`) sind bytegleich enthalten. Deshalb wird v0.9.80.0 als fachlich neuerer Basisstand verwendet und nicht auf v0.9.79.20 zurückgesetzt.

## Zusätzlich abgesichert
- `src/ClimatePanel.tsx` ist Pflichtbestandteil des Release-Standes.
- `scripts/test-climate-section-09800.mjs` ist in Baseline, Required-, Active- und Regression-Suite verankert.
- Die Klima-Sektion bleibt standardmäßig geschlossen, lazy geladen und ohne zusätzlichen Worker-Pollingpfad.

## Worker
Keine neue fachliche Workeränderung gegenüber v0.9.80.0.

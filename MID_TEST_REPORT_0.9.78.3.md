# MID Test Report v0.9.78.3

Datum: 2026-09-02

## GitHub-Referenz

Analysiert wurde Run #841 (`run_id 33683264024`, Job `MID installieren, prüfen und bauen`).

Im echten GitHub-Runner bestanden vor dem Regressionsteil bereits:

- sichere ZIP-Prüfung/Entpackung,
- `npm ci` (244 Pakete),
- Produktions-Dependency-Audit (0 Schwachstellen),
- TypeScript 7.0.2,
- Vite 6.4.3 Produktionsbuild.

Von 645 Regressionen scheiterten ausschließlich:

1. `test-cockpit-hourly-climate-redundancy-09140.mjs`
2. `test-ruc-pages-free-storage-09700.mjs`

## Korrekturprüfung

Direkt grün in der lokalen Releasebasis:

- `test-cockpit-hourly-climate-redundancy-09140.mjs`
- `test-ruc-pages-free-storage-09700.mjs`
- `test-seven-day-ecmwf-hourly-09781.mjs`
- `test-climate-delta-badges-097728.mjs`
- `test-no-actions-workflow-self-modification-093911.mjs`
- `test-ruc-workflow-sync-transition-09747.mjs`
- `test-release-upload-budget-097410.mjs`

Für den RUC-Test wurde zusätzlich eine vorhandene aktive `.github/workflows/install-mid.yml` mit absichtlicher, sicherer Abweichung zur kanonischen Kopie simuliert. Der Test bleibt grün und beweist damit, dass der reale Installerzustand nicht länger fälschlich als Fehler behandelt wird.

`test-cockpit-hourly-climate-redundancy-09140.mjs` wurde auf den bereits separat grünen v0.9.78.1-Nachfolgevertrag (`test-seven-day-ecmwf-hourly-09781.mjs` und `test-climate-delta-badges-097728.mjs`) migriert. Der Test wurde lokal zusätzlich mit einer temporären TypeScript-Kompatibilitätsauflösung ausgeführt und ist grün. Der echte Run #841 hatte die projektgepinnte `typescript-strada`-Dependency vollständig installiert und zeigte für den alten Test ausschließlich die drei nun entfernten Altvertragserwartungen.

## Fachlicher Zustand

Keine Änderung an App-/Forecast-/RUC-/Worker-Fachlogik. Der Hotfix ändert nur die beiden Regressionserwartungen und Release-Dokumentation.

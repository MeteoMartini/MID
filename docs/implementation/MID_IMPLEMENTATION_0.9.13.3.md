# MID v0.9.13.3

- Buildfix für `test-seo-discoverability-0990.mjs`.
- `scripts/sync-version.mjs` synchronisiert nun dauerhaft auch das statische `mid-version`-Metaelement in `index.html`.
- Dadurch stimmen Paketversion, `MID_BASELINE.json`, `public/version.json`, Worker, Service-Worker-Cache und HTML-Releaseversion nach jedem Prebuild überein.

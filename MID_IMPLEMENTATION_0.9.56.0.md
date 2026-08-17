# MID v0.9.56.0 – funktionsneutrale Modularisierung

Dieses Wartungsrelease verändert keine fachliche Wetterlogik und keine sichtbare Funktion.

- `SevenDayForecastSummary.tsx` kapselt die bisherige 7-Tage-Trendlogik aus `App.tsx`.
- `analysisCache.ts` und `thunderPlaceCache.ts` kapseln lokale Laufzeitcache-Helfer.
- `src/styles-src/` enthält vier geordnete kanonische Style-Quellen; `src/styles.css` wird daraus bytegleich erzeugt, damit die bestehende Kaskade und die historischen Regressionen unverändert bleiben.
- `src/weather-src/` enthält vier geordnete kanonische Weather-Quellfragmente; `src/weather.ts` wird daraus bytegleich erzeugt. Dadurch bleibt die öffentliche Importoberfläche zunächst unverändert und die risikoreiche Provider-/Ensemblelogik kann anschließend schrittweise weiter modularisiert werden.
- `worker-src/` enthält fünf geordnete kanonische Worker-Quellen; `worker/metar-proxy.js` und `worker.js` werden daraus bytegleich erzeugt, damit der Ein-Datei-Cloudflare-Vertrag unverändert bleibt.
- `preverify:types` und `pretest:regressions` synchronisieren die Aggregate vor CI-Prüfungen.
- Die zwei veralteten Regressionen `test-day-following-night-boundaries-09155.mjs` und `test-radar-motion-nowcast-ui.mjs` wurden an die bereits gültigen Verträge angepasst.

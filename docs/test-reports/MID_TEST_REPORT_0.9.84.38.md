# MID v0.9.84.38 – Testbericht

## Gezielte Regressionen
- `test-temperature-canonical-extrema-09751.mjs`: grün – kanonische stündliche Temperatur-/Thermik-/Druckquelle, unveränderte Zustandswerte im 3-h-Raster, Tmax/Tmin sowie kontinuierliche Tagesfusionskorrektur.
- `test-pressure-axis-nice-spacing-097861.mjs`: grün – gleichmäßige hPa-Achse.
- `test-weather-profile-polish-temporal-09802.mjs`: grün – gemeinsame 24-h-Zeitgeometrie und Plotgrenzen.
- `test-weather-regime-shared-contract-097911.mjs`: grün – gemeinsame Regimefarben und kompakte klassische Pille ohne globale Primary-Klasse.
- `test-seven-day-condition-label-consistency-097845.mjs`: grün – kompakte Einzeilen-Kategorien bleiben erhalten.
- `test-ruc-mosmix-precip-consensus-09786.mjs`: grün – RUC-Lead-Time-Übergänge sind stetig und laufen vor +14 h weich aus; RUC/MOSMIX-Niederschlagskonsens bleibt geschützt.
- `test-ruc-precip-amplitude-guard-09787.mjs`: grün – RUC-Niederschlagsamplitude bleibt gegen ungestützte Ausreißer abgesichert.
- `test-mosmix-contribution-freshness-097915.mjs`: grün – geglättete MOSMIX-Stundenbeiträge sowie Lauf-/Freshness-Vertrag.

## Build-Prüfung
- `node --experimental-strip-types --check src/forecastFusion.ts`: grün – Syntax/TypeScript-Stripping des geänderten Fusionsmoduls.
- Der vollständige lokale TypeScript-/Vite-Build benötigt ein vollständiges `npm ci`. Ein erneuter Dependency-Download lief in dieser Containerumgebung in einen Transport-Timeout; dies wird nicht als erfolgreicher Full-Build ausgegeben.

## Umfang
Bewusst fokussierte Regressionen: 24-h-Temperatur/Luftdruck, Tagesfusions-Kontinuität, RUC/MOSMIX-Übergänge und klassische Wetterregime-Pillen.

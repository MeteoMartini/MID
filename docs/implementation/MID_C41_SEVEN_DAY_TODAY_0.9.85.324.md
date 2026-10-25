# MID-C41 · v0.9.85.324 · Heute vollständig in der 7-Tage-Ansicht

Basis: veröffentlichtes .323, main = mid-stable = 0924b83bccf735869344fd9fc8724cc302b7e80e.

## Ursache und Korrektur
Am 25.10.2026 nach dem Wechsel liefert der tatsächliche Open-Meteo-ISO-Abruf
utc_offset_seconds=3600 und Stunden ab 25.10.00:00 bei festem Offset. Der
Ortskalendertag Berlin beginnt aber schon am 24.10.22:00Z. Die erste echte
Ortsstunde fehlt. Die seit .318 korrekte strenge 25h-Tagesrekonstruktion verwirft
diesen unvollständigen Tag, statt eine falsche 24h-Summe als 25h-Tag auszugeben.
Die 7-Tage-Renderer selbst verwenden bereits days.slice(0,7), ohne Heute-Filter.

Direkt- und Worker-Core-Abruf erhalten past_hours=25 und forecast_hours=336.
Die explizite obere Grenze ist erforderlich: past_hours allein verwendet beim
Anbieter einen abweichenden Standardhorizont. Daily bleibt forecast_days=14,
ohne past_days; gestern wird nicht als zusätzlicher Prognosetag eingeführt.
361 Stundenwerte statt normalerweise 336, gleicher einzelner Request und gleiche
Variablen, keine zusätzliche API und unveränderte Anfrage-/Releasebudgets.
Core-Local-/Request-/Edge-Caches v5 verhindern Wiederverwendung der verkürzten
v4-Reihe; Höhen-/Zeitzonenschlüssel und Best-Match-Provenienz bleiben erhalten.

Keine Tagesrekonstruktion, physikalische Plausibilisierung oder Missing-Regel
abgeschwächt. Ganze Tageswerte enthalten vergangene und zukünftige native
Intervalle. Bereits vergangene Modellstunden werden nicht als Stationsmessung
umetikettiert. Echte Datenlücken bleiben unbekannt, keine Interpolation/Nullfüllung.

## Prüfung
- Produktiver Mapper: synthetischer gekürzter Ersttag reproduziert das Verschwinden;
  mit vollständiger Eingabe 25 Stunden, gesamte Niederschlagssumme, Sonnenschein,
  Tmin/Tmax zu 07/15/22 UTC unverändert. Fehlende Stunde bleibt abgewiesen.
- Tatsächlicher Anbieterabruf am 25.10.: HTTP200, feste Zone/Offset3600;
  korrigierter Abruf 361 Stunden, Daily beginnt 25.10.; produktives mapDays
  rekonstruiert Heute aus 25 Ortsstunden. Das ist Zeit-/Datenwegevidenz,
  keine unabhängige Prüfung der meteorologischen Prognosegüte.
- TypeScript und Produktionsbuild erfolgreich. Produktionsaudit: 0 Findings.
- 1020 Regressionen ausgeführt: 1019 sofort erfolgreich. Der Bundle-Budgettest
  lief versehentlich während des lokalen Builds und zählte alte plus neue
  index-Dateien. Nach fertigem Build derselbe unveränderte Test erfolgreich:
  JS 1476030/1500000 B, CSS 1759985/1760000 B. Keine Budgetänderung.
- Browser: 30 echte Provider→24h/7d-Fälle, 320/390/844/768/1440px,
  Light/Dark, Frühjahr sowie Herbst vor/nach Offsetwechsel, kein Seitenoverflow,
  vollständige Tagesmenge und heutiges Datum in der 7d-Liste.
  Volles Chromium scheiterte lokal vor Seitenstart am Process-Singleton-Socket;
  mit regulärem Playwright Chromium Headless Shell wurde die Matrix erfolgreich
  ausgeführt. Keine Produkt- oder Assertionänderung zur Laufzeitumgehung.

## Offene Arbeit und Release
Offene Issues/PRs erneut gelesen. Diagnose-Drafts #425/#433/#449 unverändert
mit ihren dokumentierten Produktionslücken; keine Freigabe oder Schließung.
#428 bleibt für explizite GMT-/Zielort-IANA-Adapter offen; diese Reparatur
schließt nur die Core-Abrufabdeckung. #374/#400/#380 haben eigenständige noch
fehlende Geräte-/Pixel-/Betriebsnachweise und werden nicht pauschal geschlossen.
Nur bestehender Source-Gate → MID Release Bot → ServerZIP → Installer →
Worker/Pages → Stable. Gates und öffentliche Build-Identität sind nach dem
Source-Transport gesondert zu bestätigen; dieser Bericht behauptet keinen Release.

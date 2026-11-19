# MID Data · GPS-Core-Cache-Quellenort und frische Feldprovenienz · QA Draft (19.11.2026)
Issue [#935](https://github.com/MeteoMartini/MID/issues/935). Basis ist veröffentlichtes Stable v0.9.85.497, SHA `9fd872a789f4b158bc691d085589616c2c04f776`.

## Nachgewiesene Ursache
`readForecastCoreCache()` speicherte vormals den letzten Forecast eines anderen, maximal 2,5 km entfernten Orts unter dem Zielort-Schlüssel; `forecast()` nahm diesen online acht Minuten lang als Fresh-Hit an. `instantCachedCoreForecast()` konnte deshalb ohne echte Zielort-Provenienz starten. GPS-Rasterung im bestehenden v5-Schlüssel beträgt 0,001° und ist selbst **keine** Quelle für den tatsächlichen Abrufort.

## Fix / strikte Grenzen
- Neuer, reiner `forecastSpatialCacheEvidence.ts` validiert Originalkoordinaten gegen den gerundeten ursprünglichen v5-Key (<=100 m Quantisierungsraum), Requested-zu-Original-Distanz und 2.500-m-Grenze. Bis 5 m: `exact`; weiter: `nearby`; alte v5-Einträge ohne Originalkoordinaten: konservativ `unknown`. Ungültige Koordinaten: kein Kandidat.
- Neu geschriebene Einträge halten lokale `origin:{lat,lon}`. Die ursprünglichen Wetterwerte/Zeiten bleiben unangetastet; keine GPS-Koordinaten in Logs oder Network-Metadaten. Kein v5->v6-Datenverlust, kein neuer Dienst oder Request im normalen exact-hit-Fall.
- Nearby/Unknown bleibt für tatsächliches `offline` oder erschöpften Netzwerk-Rückfall innerhalb 18 h möglich, wird **nicht** mehr unter dem angefragten Key kopiert. Nur verifiziert `exact` innerhalb acht Minuten darf online HTTP ersparen. `instantCachedCoreForecast` startet ausschließlich `exact` innerhalb 45 min.
- `_mid_core_proxy.spatialMatch/spatialFallbackDistanceM/spatialNotice` und konservatives `stale` sorgen dafür, dass konsumierende Oberflächen, Widgets und Exporte die Herkunft nicht als frisch/hyperlokal missverstehen; UI-Ausgabe und echte iOS-/VoiceOver-Abnahme bleiben zusätzliche Integrationsprüfungen.
- Kein RUC, Worker, WMO-/DWD-Warnung, Modellgewicht, Niederschlagswert, PO-P, Quell-/Gültigkeitszeit oder Cache-TTL geändert. Abort/429/Request-Singleflight weiter über bisherigen gemeinsamen Open-Meteo-Guard. Online Normal-/Foreground-Fallback weiterhin identisch bis zum Offline-Entscheid.

## Tests und erforderliche Gates
Neue Vitest-Grenzwerte exakt / 100m / 2499/2501m / altes v5 Unknown / ungültige Geometrie / 5m / keine Alias Writes / Quelle-Weather-Parität. Bestehende Required-Regex wurde **verschärft**: sie fordert online `spatialMatch==='exact'` und verbietet Copy-as-exact; keine Abschwächung.
Noch erforderlich: lebendes Browser-/App-E2E A->B->A, 320–1440px, Höhen-/IANA-Zeitzonen, Offline-/Online-Wechsel, Stale-18h, Race/Abort, nur echte 0mm vs NoData, Widget-/Archive-Provenienz, reales iOS/VoiceOver; unabhängige Source-/Core-/Heavy-Review und normaler Release-Train. Keine Freigabe aus QA-Draft.

Referenzkonzepte: [Open-Meteo Model Updates](https://open-meteo.com/en/docs/model-updates) unterscheidet Modellinitialisierung und Veröffentlichung; [MeteoSwiss Open Data](https://opendatadocs.meteoswiss.ch/general/download) dokumentiert getrennte Referenzzeiten, Intervalle und fehlende Werte. Die lokale Raum-Semantik hier ist eigene MID-QA-Logik, **keine amtliche Warnung**.

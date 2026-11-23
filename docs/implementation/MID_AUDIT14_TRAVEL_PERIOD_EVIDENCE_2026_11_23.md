# MID Audit 1.4 · Reiseplaner: Originalintervalle, vollständige Wochen, NoData (QA DRAFT)

**Datum:** 23. November 2026 · **Produktionsstand als Ausgangsbasis:** `v0.9.85.511`, `main=mid-stable=c5faca33885f8df4cc645be89ecc6befe93c55c0` · fünf aktive GitHub-Rulesets. **Nur Integrationskandidat; keine Release-/Merge-Freigabe.** Audit-Bezug: PDF `20261117_MID-Audit.pdf`, insbesondere Witterung Tag 15–46, Originaldaten/Intervalle, Modellprovenienz, NoData und Reiseempfehlung.

## Reproduzierbare Bugs im Stable-Blob `6b670d2147325b8b2ffcb190fd472b9d4fd27bac`

1. **GEFS-Originalregen:** `src/travelForecastFusion.ts` fasste unvollständige Stunden ohne Vollständigkeitsnachweis mit einer auf `0` initialisierten Tagesmenge zusammen, zählte endgestempeltes `00:00 UTC` zum falschen Tag und filterte Originalwerte ab 200 mm still heraus. Im gleichen Tagespaket konnte Temperatur belastbar, Niederschlag aber unvollständig sein.
2. **EC46-Ungleichheit:** `applyEc46Week` filterte vor der Skalierung auf `from/to`; eine identische Woche konnte durch eine andere Reisedauer zu verschiedenen Tageswerten und künstlich veränderten Niederschlagswahrscheinlichkeiten führen. Die native Einheit von `weekly.precipitation_anomaly` beweist zudem keine frei aufteilbare Wochen-Gesamtsumme.

## Scope des Kandidaten

- Neue **pure O(n)**-Routine `src/travelForecastPeriodEvidence.ts`: UTC-Originaltimestamp, 24 einzelne Temperatur-Stunden (00–23 Uhr) und 24 vollständige Niederschlagsintervalle (01–00 Uhr Folgetag) unabhängig. Echtes 0 mm bleibt 0. Missing, Sentinel, Duplikat/unsortierte Zeit und nicht passende Originaleinheiten werden nicht zur Modellbestätigung genutzt. Hohe Originalwerte werden **nicht geglättet** und als `precipitationExtreme` markiert; sie sind ohne Quellkontrolle nicht als physikalisch bestätigt anzusehen.
- `src/travelForecastFusion.ts`: Entsprechende native Zeit-/Einheitenanforderungen in der bereits bestehenden GEFS-Abfrage; **keine zusätzlichen Requests**. Die unabhängige GEFS-Bestätigung verwendet nur vollständige, vergleichbare **7/7 Temperatur-Tage**. Vermeidet den vorherigen, nicht beweisbaren Vergleich einer EC46-Wochenmengenanomalie mit GEFS-Tagesmengen und unvollständigen Niederschlagssummen.
- EC46-Wochensignal: zuerst **sieben aufeinanderfolgende native Kalendertage** und vollständige Referenzwoche, dann Gewichtung anhand des *gesamten* Wochenvorlaufs und erst anschließend Auswahl des konkreten Reiseintervalls. Es werden nur tatsächlich im Gültigkeitshorizont liegende native Komplettwochen angewandt.
- Monats-/Saison-, aktuelle Mittelfrist-, Radar-, RUC-, amtliche Warn- und Widgetpfade **unverändert**. Wochenanomalien für Temperatur, Wind, Bewölkung und Schneehöhe bleiben als schwach gewichtetes **Witterungssignal** auf Klimabasis erhalten. EC46-`precipitation_anomaly`, Sonnen- und Neuschneemengen **ändern vorerst keine täglichen Klimawerte und keine tägliche Regenwahrscheinlichkeit**, da eine native Woche nicht gleich ein Tagesereignis ist. Die ursprünglichen Rohwochenparameter und die eigenständige Subseasonal-Ansicht werden nicht entfernt. Quellstatus erläutert diese Grenze direkt in der bestehenden Reiseplaner-UI.
- Kein neue Zeitpoller, keine neuen Abonnements, Karten, CSS- oder React-Bundles; stattdessen minimale Pure-TS-Prüfung der bereits geladenen Daten. Neue Funktionen werden nicht als amtliche DWD-Warnung ausgegeben.

## Verifikation und Abnahmeregeln

- `tests/unit/mid-audit14-travel-period-evidence.test.ts`: echte Nullmengen; 00Z-Vorperioden; 23/24- und fehlende Stunden; getrennte Temperatur-/Regenlücken; hohe Originalmengen ohne Clipping; Sentinelwerte; Einheiten; UTC; doppelte/nicht monotone Zeitachsen; echte Kalenderwoche und vorhandene Source-Verdrahtung.
- Isolierter Node-Vorläufer (18/18 synthetische Tests) lokal erfolgreich; **keine** Aussage über Produktionswerte, Modellgüte oder App-Abnahme. Vor Integration erforderlich: Vitest und TypeScript gegen den finalen PR-HEAD, bestehende Travel-Regression `scripts/test-travel-center-forecast-fusion-098429.mjs`, Source/Core/Heavy/Review, Web-Browser (320/360/390/430/768/1024/1440 px, Portrait/Landscape, Light/Dark, 200% Zoom, Tastatur/Touch/Overflow), echte Original-Open-Meteo-Fixtures inkl. Quelle/Run/Valid/Akkumulation, iOS/VoiceOver separat.
- Negativfall: Bei unvollständiger Woche oder nicht belegter Feldsemantik wird keine präzise Tagesmenge erzeugt; der bestehende ERA5-Referenzwert bleibt sichtbar. Erwartete vollständige Hochauflösung nur in den jeweiligen Originalhorizonten, keine Verlängerung des operationellen Modelllaufs.

## Wissenschaftliche Referenzen (nicht mit Produktions-E2E verwechselt)

- Open-Meteo Ensemble API: https://open-meteo.com/en/docs/ensemble-api (Hourly `precipitation` = `Preceding hour sum`, mm).
- Open-Meteo Seasonal API: https://open-meteo.com/en/docs/seasonal-forecast-api (EC46 native weekly means/anomalies und Klimareferenz; kein Nachweis einer 1:1-Tagesprognose).
- ECMWF Extended-Range User Guide: https://confluence.ecmwf.int/pages/viewpage.action?pageId=197692843 (Wochen-/Großwettertrends statt täglicher Ereignissicherheit).
- Yr 21-day Forecast: https://hjelp.yr.no/hc/en-us/articles/12329349662492-The-21-day-forecast-on-Yr (sichtbar reduzierte Detailtiefe bei längerem Horizont).

## Leitchat/Work – AUTO-PRIORITY

- **P0:** RUC #541 inklusive fehlgeschlagener produktiver DWD-Preprocessing-Runs und unabhängigem Fast-Lane/Pages/Worker-E2E.
- **P1 hier:** Nativer Reiseplaner-Periodenbeleg, selektiv reviewen und nach aktueller Stable-Version **nur als neuen SHA-verifizierten Release-Kandidaten** integrieren, nie den historischen Branch gegen Stable mergen.
- **P1 parallel, nicht duplizieren:** Verifikationsdrafts #911/#922/#923/#964, vollständige Feld-/Akkumulationsmetadaten #914 und Radar-NoData #929; UV aus früherem #967 bereits in Stable v0.9.85.509 selektiv integriert.
- **P2:** Nutzerseitige Wochen-/Tercile-Szenariodarstellung mit regionalem Skill-Nachweis; nur wenn originale Memberverteilungen und robuste unabhängige Verifikation verfügbar sind.

**Release-Gates:** Source-PR → SHA-bound controlled merge → original serverseitiges ZIP → `install-mid.yml` → betroffene Worker/Pages → Stable-Promotion. Kein Direkt-Merge, keine Schutzregeländerung, keine zusätzlichen kostenpflichtigen Dienste. **Versionsspiegel bewusst noch .511, weil dies ein ungepromoteter QA-Draft und kein eigenständiger Build ist.**

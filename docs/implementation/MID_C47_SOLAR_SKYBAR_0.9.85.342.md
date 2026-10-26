# MID 18.2 · Skybar-Solarfenster über gesamte Prognosedauer · v0.9.85.342

## Quellbasis / tatsächlicher Fehler

Am 26.10.2026 waren `main` und `mid-stable` identisch auf `a00e2741ab8e6e60d76a2538352efba8f8c9f3ad` (veröffentlicht v0.9.85.341); `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, offene PRs und Branchschutz waren geprüft. Der Fehler aus dem Nutzerscreenshot (31.10./01.11.2026) blieb in .341 tatsächlich bestehen: `src/astronomy.ts::solarTimelineWindow` iterierte pauschal `dayOffset=-1..3`; `src/ForecastCockpit.tsx::SevenDayCurveOverview` übergab hingegen ein ganzes Wochenfenster. Nach dem letzten vorhandenen Solar-Event wurde das komplette restliche Fenster als Nacht interpretiert. Die Tageskarte verwendet eine separate eintägige Solarfenster-Abfrage. Eine veraltete PWA-Version allein ist daher nicht die Erklärung.

## Wissenschaftlich eng begrenzte Korrektur

`solarTimelineWindow` bestimmt Anfangs- und Enddatum per IANA-lokalen Kalenderteilen, behandelt das Fenster als halb-offen `[start,end)` und berücksichtigt alle enthaltenen Kalendertage sowie je einen Randtag. Für 23-/25-Stunden-Kalendertage werden die lokalen Daten über `Date.UTC` als reine Datumsoffsets gezählt, nicht das abgelaufene UTC-Stundenintervall als Tageszahl missbraucht. Der aus Sicherheits- und Performancegründen unterstützte maximale Solarfenster-Horizont beträgt 62 lokale Tage; größere/ungültige Zeitfenster liefern explizit keine Solar-Events oder -Nachtbänder (fail closed, keine fiktiven Werte). Bereits bestehende astronomische Suchverfahren, Höhe/Koordinaten, Zeitzone, Fallback ohne Solarereignisse sowie die Nachtschattierungs-Semantik bleiben unverändert. Kein Modell- oder Wetterdatenwert wird verändert.

## Verpflichtender Regressionstest

`scripts/test-skybar-week-solar-0985342.mjs` bundelt die tatsächliche `src/astronomy.ts` mit der vorhandenen astronomy-engine und prüft: alle Sonnenauf-/untergänge für 7, 14 und 46 lokale Kalendertage; identische Tag-/Nachtmaske für jeden Kalendertag im Gesamtzeitraum und der Einzeltagsansicht; explizite Freigabe von Mittag am 31.10. und 01.11.2026; 23-/25-Stunden-DST-Tage im März/Oktober 2026; konservative Polarnacht ohne erfundene Tagesereignisse sowie sichere Begrenzung über 62 Tage. Der Test kommt in beide kanonischen Regressioninventare und die Required-Files-Liste. Die vollständige Browsermatrix, SVG-/Pixel-, Cold/Warm-, Widgets-/Export- und iOS-Abnahme wird vom Source-/Installer-System verlangt; kein echter iOS-/VoiceOver-Gerätetest behauptet.

## Releaseweg

Eigenständiger autorisierter `chatgpt/v0.9.85.342-skybar-full-solar-window`-Integrationsbranch von .341 Stable. Version und Spiegel gleichlaufend aktualisieren; erst erfolgreiches SHA-gebundenes Source-PR-Gate, dann der MID Release-Bot mit serverseitigem ZIP, `install-mid.yml`, erforderlichen Worker-/Pages-Gates und Stable-Fast-Forward. Keine direkte Änderung geschützter Branches; weder Kompression noch DWD-Warnungen oder paralleler SYNOP-Draft berührt.

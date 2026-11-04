# Issue #428 · GMT-Ensemble und lokale Zieltage (unveröffentlichter Draft)

Basis einmalig live verifiziert: `main=mid-stable=16c975aab66ed858f0add9628f78b5b87b7e2a34`, v0.9.85.417; Package/Baseline/AGENTS/Source of Truth und Forecast-/Intervallverträge berücksichtigt. Offene PRs #634/#645/#646 berühren gemeinsame Versions-/Changelogspiegel, keinen Ensemble-Zeitumbau; #642/#640 bearbeiten RUC-Produktion/CAS, nicht diesen Client-Ingest. Keine Übernahme fremder Kandidaten. Branch codex/v0.9.85.424-ensemble-target-zone wurde erst nach dynamischer Reproduktion aus diesem Stable erstellt.

## Bestätigter Fehler und kleinster gemeinsamer Korrekturpfad

`fetchEnsembleWeather` gab regionale GMT-Payloads unverändert zurück. `openMeteoEnsembleProxy` liefert reguläres Open-Meteo mit `timezone=auto`, regionale Adapter behalten dagegen ausdrücklich GMT/Offset0. Die bestehenden Provider-Parser berechneten die GMT-Instants korrekt, aber die Ensemble-Tagesaggregation verwendete die Quellzone als Zielkalender. Der in .318 veröffentlichte Fixoffset-Parser ist nicht defekt und wird nicht ersetzt.

Synthetisch: 121 unveränderte stündliche UTC-Endpunkte, zwei echte Member mit 1 bzw. 2 mm/Stunde, bekannte Instantanwerte. Vor Korrektur ordnete der unveränderte Parser den Berlin-DST-Tag als vollständigen UTC-Tag mit 24 mm ein: am 29.03.2026 statt 23 mm, am 25.10.2026 statt 25 mm. Die gleiche UTC-Quelle bleibt in UTC korrekt (24 mm). Das ist kein Live-Provider-/Prognosegütenachweis.

Die gemeinsame Client-Ingestgrenze bindet verifizierte Zielort-IANA-Metadaten, wandelt Rohzeit mit dem vorhandenen `providerIsoEpoch` in explizite UTC-Instants und übergibt sie an unveränderte lokale Präsentation/Day-/Eventaggregation. `_mid_ensemble_source_time` bewahrt Originalzeitarray, Quellzone und Offset; alle Modell-/Quellfelder und Wertearrays bleiben erhalten. Keine zweite Parser-, Forecast-, Assimilations- oder UI-Wertelogik.

Die sechs Verbraucher reichen ausschließlich vorhandene Orts-/Core-Zonen weiter: Dashboard, Startup, Ortsvergleich, Event, Reise und Hintergrundlernen. Bootstrap/Mean-Spread/Fallback und Event teilen denselben Ingest. Bei fehlenden Ortsmetadaten wird nur der bestehende exakte, gültige Core-Cache gelesen; es wird kein zusätzlicher Forecast angefordert. Ohne verifizierte Zielzone wird ein Regionaladapter als nicht auswertbar behandelt, anstatt GMT heimlich als Ortskalender zu behaupten. Globale Open-Meteo-Antworten behalten ihre eigene `auto`-Zone als zulässigen Fallback. Kein Schätzen aus Browserzone/Longitude.

Der Proxy bekommt den Zielzonen-Kontext als Parameter. Seine Quellzeit-/Adaptersemantik bleibt unverändert; die Bindung erfolgt einmal gemeinsam im Client. Worker-Code enthält ausschließlich den vorgeschriebenen Versionsspiegel, keinen neuen Providerparser. Kanonische `displayHours`, `displayMinutes15`, Widgets und Exportwerte/-renderer werden nicht geändert; der bestehende DST-/Widget-/Export-Zeitkern bleibt erhalten.

## Soll/Ist nach Korrektur

| Zielzone / Kalendertag | Echte Dauer | Vollständigkeit | Member 1 Niederschlag |
|---|---:|---|---:|
| Berlin 29.03.2026 | 23 h | vollständig | 23 mm |
| Berlin 25.10.2026 | 25 h | vollständig | 25 mm |
| UTC 29.03.2026 | 24 h | vollständig | 24 mm |
| Kathmandu 29.03.2026 | 24 h | Stundenraster nicht auf lokale Mitternacht ausgerichtet: unvollständig | 24 mm erfasste Intervalle, kein vollständiger lokaler Tageswert |
| Lord Howe 04.10.2026 | 23,5 h | unvollständig (Rasterphase) | 24 mm erfasste Intervalle, kein vollständiger lokaler Tageswert |
| Lord Howe 05.04.2026 | 24,5 h | unvollständig (Rasterphase) | 24 mm erfasste Intervalle, kein vollständiger lokaler Tageswert |

Member 2 enthält jeweils genau die doppelte erfasste Menge. Sämtliche 726 Quellinstants bleiben exakt erhalten. Teilweise angeschnittene Tagesintervalle werden nicht künstlich zu vollständigen Tagen ergänzt; die bestehenden Completeness-Flags schützen die nachgelagerte Ensembleaggregation. Dynamische Eventfenster 23→03 Uhr und 00→04 Uhr verwenden weiterhin die tatsächliche Zeitdauer und bestehende anteilige Intervallüberlappung, einschließlich Lord Howe. Ein fehlender Niederschlagswert schließt den betroffenen Member aus der vollständigen Eventmenge aus; er wird nie zu 0. Bestehende Regression prüft zusätzlich fehlende ganze Stunden und native Tagesvollständigkeit.

## Abgeleitete Caches und Nutzerzustände

Ensemble v19→v20, Event v5→v6: alte falsch datierte Tagesprodukte werden nicht ungeprüft migriert. Neue abgeleitete Cachewerte sind an die Zielzone gebunden und bei abweichender/fehlender Zielzone nicht wiederverwendbar. Favoriten, Eventdefinitionen, Einstellungen und rohe validierte Core-Caches werden nicht gelöscht. Bestehende DST-Regression erwartet deshalb die neuen Präfixe; ihre ursprünglichen Zeit-/Wert-/Lückenassertions bleiben erhalten.

## Ausgeführt (alle Befehle mit Timeout)

- `timeout 30s node scripts/test-ensemble-target-zone-0985424.mjs`: sechs Zonenszenarien, zwei Member, epoch/provenance, Tages-/Eventintervalle, NoData, tatsächlicher Proxy-Requestpfad mit kleinem synthetischem Transportstub, fehlende Zielmetadaten und zonengebundener Cache – bestanden.
- `timeout 30s node scripts/test-provider-fixed-offset-0985318.mjs`: bestehende tatsächliche mapHours/mapMinutely15/mapDays/Ensemble-/Mean-Spread-/Event-/Cache-DST-Prüfungen – bestanden nach absichtlicher Cache-Präfixaktualisierung.
- `timeout 30s node scripts/test-explicit-time-offsets-0985302.mjs` – bestanden.
- `timeout 30s node scripts/test-ensemble-multiparameter-097865.mjs`: bestehende Memberaggregation/Qualität/native Vollständigkeit – bestanden.
- `timeout 90s npm run verify:types`: beide TypeScript-Projekte plus kanonische Aggregate-Synchronisation – bestanden.

Die Test-Stubs des neuen Proxytests benötigten zwei gezielte Wiederholungen (fehlende Deadline-/Fallback-Stubs); danach grün. Ein Typecheckfehler durch eine zu breite Zwischenersetzung im unverwandten Warncache wurde entfernt; der Warncache bleibt fachlich unverändert. Kein Cloud-Ausführungsfehler, keine Dauerschleife. Vollständige Logs liegen im Unterordner ensemble-target-zone-0985424.

Keine vollständige Regression, keine Browsermatrix, keine Original-GRIB-Verarbeitung, keine vollständige App-Produktionserstellung, keine Live-Provider-Abnahme. Vollständige Pflichtgates verbleiben bei bestehender GitHub-CI vor einer späteren Freigabe. .424 ist ausschließlich ein Entwicklungskandidat; kein Release/Deployment/Promotion wurde ausgelöst. Ohne Zielortmetadaten bleibt die regionale Quelle bewusst unverfügbar; ihre Beschaffung ist keine neue Orts-/Zeitzonendatenbank in diesem Patch.

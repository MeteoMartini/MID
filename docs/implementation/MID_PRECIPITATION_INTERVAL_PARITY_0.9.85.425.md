# #523 · bestätigter Niederschlags-Intervallverlust (Draft .425)

Einmalig live bestätigte Basis: `main=mid-stable=22c6cc7cef13b67e59a1bafc98b2d01975685822`, MID 0.9.85.423. AGENTS, Baseline, Source of Truth sowie Forecast-Konsistenz-, Niederschlagsintervall-, Piktogramm/Schneehöhen- und Releaseverträge berücksichtigt. Kein neuer Releasezustand angenommen. #649 Head `87b50b61070b266ede31efc576688870494c1826` betrifft Ensemble-Zielortzonen: dessen App-Aufrufstelle und Weather-Fragmente werden nicht verändert. Die zwei hier geänderten Produktivbereiche (ForecastCockpit: shortTermPrecipitationParts; precipitationIntervals: Presentation-Proben) sind davon unabhängig. Gemeinsame Versions-/Changelogspiegel müssen vor späterer Integration neu synchronisiert werden. #634 betrifft Skybar-Wolkenstufen, nicht diese Intervallweitergabe; keine Übernahme oder zweite Implementierung.

## Dynamisch reproduziert vor jeder Codeänderung

Synthetischer finalisierter Input: gültiger Slotbeginn 04.11.2026 10:00Z, Roh-Endstempel 10:15Z, 0,2 mm Regen, WMO-/post-fusion Eingangscode 61, 80% PoP für denselben Slot, keine Ensembleinformation. **Originaler Provider-WMO-Code wird nicht behauptet.** Tatsächliche Intervallrate 0,2/(15/60)=0,8 mm/h. Der gemeinsame DWD-orientierte Vertrag setzt >0,5 bis 4 mm/h für Dauerregen als mäßig an.

| Pfad | Vorher | Nachher |
|---|---|---|
| Presentation-Minutenprobe → gemeinsame Parts | implizite 60 min, leicht, Code 61 | explizite 15 min, mäßig, Darstellungscode 63 |
| Kurzfrist-/Profil-Detailhelper | verwirft vorhandene Grenzen, leicht, Code 61 | erhält Probe und Grenzen, mäßig, Darstellungscode 63 |
| Skybar mit tatsächlicher 15-min-Geometrie | mäßig, Code 63 | mäßig, Code 63 |

Die Skybar besaß bereits die echte Dauer, während beide anderen Pfade auf 3600 Sekunden zurückfielen. Kein Widerspruch besteht dagegen zwischen 0,2 mm/15min (0,8 mm/h, mäßig) und 0,2 mm/60min (0,2 mm/h, leicht): das sind verschiedene korrekt bezeichnete Bezugsintervalle.

## Korrektur und Abgrenzung

1. Gemeinsame Stunden-/Viertelstunden-Presentation-Proben tragen jetzt `precipitationIntervalStartEpoch/EndEpoch` passend zu den bereits vorhandenen Provenienzgrenzen. So erreicht die tatsächliche Dauer jeden bestehenden Niederschlagsrenderer, nicht nur die Skybar. Auch Lückenslots behalten explizite Grenzen und ihre unveränderten Availability=false-/amountMm=null-Signale.
2. Der Profil-Detailhelper reicht die vorhandene Probe an `precipitationParts` durch, statt eine metadatenarme Kopie zu konstruieren. Damit bleiben Dauer und vorhandener Phasen-/Kontextbeleg erhalten.

Keine neuen Schwellen und keine veränderten mathematischen Mengen, Pop-Werte, Quellzeitpunkte, Ensemblewerte oder amtlichen Warnungen. Keine Glättung. WMO 82 bleibt auch bei 0,01 mm in 15/60/180 Minuten sehr stark. Schnee und Mischphase bleiben in den Gegenbeispielen getrennt. Vorhandene Farben, CSS, Glyphen, Tooltips, Zeitachsen und gespeicherte Einstellungen bleiben erhalten. displayHours/displayMinutes15 werden nicht neu assimiliert. Der bestehende Slotbeginn-/Endstempelvertrag bleibt derselbe; der Trace bewahrt sourceEndEpoch und inputCode vor der bestehenden Darstellungscodeableitung. Eine abgeleitete Intensität ist kein unveränderter nativer WMO-Beobachtungscode.

Das 7-Tage-Tagesdetail besitzt bereits explizite 1h-/3h-Intervalle und nutzt gemeinsame Parts/Skybar. Dafür wird kein zweiter UI-Fix erfunden. 180 Minuten mit 1,2 mm ergeben weiterhin 0,4 mm/h und leicht. Tagesübersicht/-summe und Ensembleinformation sind andere Bezugsgrößen und werden nicht in Intensitäten umgedeutet. SevenDayDesignModes und App werden fachlich nicht geändert.

## Tatsächlich ausgeführte, begrenzte Prüfung

- `timeout 30s node scripts/test-precipitation-interval-parity-0985425.mjs`: 15/60/180 Minuten; gemeinsame Parts gegen echten Cockpit-Detailhelper und echte Skybar-HourCells; kleine kodierte Schauerspitzen, Schnee, Mischphase, echte 0, null/NaN samt Availability, unveränderte Inputs und Source-Provenienz. Bestanden. Die neue Regression ist in beiden Baseline-Listen inventarisiert.
- Je `timeout 30s node`: test-precipitation-forward-slot-presentation-097846.mjs, test-precipitation-invalid-interval-epochs-0985353.mjs, test-pictogram-intensity-snow-depth-098426.mjs, test-detail-precip-consistency.mjs – bestanden, Assertions unverändert.
- `MID_PRECIP_EVIDENCE_DIR=/tmp/mid-precip-shots timeout 90s node scripts/verify-precipitation-interval-parity-browser-0985425.mjs`: **8/8** isolierte echte ShortTermRibbon-Fälle, 320/390/430/1440 CSS-px × Light/Dark, Viertelstundenauswahl, Beschriftung/Skybar-Rate und kein Dokument-Overflow. Kein vollständiger App-/7d-Interaktions- oder Browser-Shard-Test. Fixture lädt die Hauptstylesheets; nicht jede dynamisch geladene Designschicht der vollständigen App. Screenshots sind daher begrenzte Renderer-Nachweise, keine vollständige visuelle Freigabe.
- `timeout 90s npm run verify:types`: beide TypeScript-Projekte und kanonische Aggregate-Synchronisation bestanden.

Ein neuer Unit-Test erwartete zunächst nullbasierte statt einsbasierter Skybar-Dickenstufen; einmal gezielt korrigiert. Der Browsertest benötigte zwei gezielte Korrekturen seines CLI-Pfadtrims und Detailselektors, danach 8/8. Keine zusätzlichen Wiederholungen, keine Cloudprobleme. Kein vollständiger Repository-Regressionslauf, kein Produktionsbuild, keine Live-Provider-Abnahme, keine Originaldaten-Massenläufe. Vollständige Pflichtgates verbleiben bei GitHub Actions.

Entwicklungsversion .425 nur als unveröffentlichter Draft, einschließlich regulärer Versionsspiegel; Worker erhält ausschließlich Versionsmirror, keine Fachänderung. Tests, Logs und zwei Screenshots liegen dauerhaft im Unterordner `precipitation-interval-parity-0985425`. Kein Merge, Deployment, Ruleset-/Gatewechsel oder Promotion. #523 als Gesamtthema wird nicht geschlossen. Empfehlung: nach #649 separat integrieren, Versionsspiegel frisch abgleichen und die vollständige etablierte CI auf dem kombinierten Head abwarten.

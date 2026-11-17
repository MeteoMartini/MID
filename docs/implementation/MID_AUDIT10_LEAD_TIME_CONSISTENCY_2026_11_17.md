# MID Audit 1.0 – archivierter Vorlauf gegen echte Ausgabezeit

17.11.2026. Basis: main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957 (v0.9.85.486), fünf aktive Rulesets. QA-Draft, kein Ready/Merge/Release.

## Wissenschaftlicher Fehler
Der 7-seitige Auditbericht 20261117_MID-Audit(1).pdf, S. 3-4, fordert konsistente Modelllauf-, Ausgabe- und Gültigkeitszeiten. recordForecastCapture() setzt leadHours aus (dateNoon(targetDate, timezone)-now)/3600000 und issuedAt aus demselben now. Bisher nutzte chosenEvaluations() diesen Archiv-Vorlauf zur Zuweisung des 12/24/48/72h-Skillhorizonts, prüfte aber nicht, ob issuedAt und leadHours zusammenpassen. Ein widersprüchlich importierter Vorlauf kann die Skill-/Lernstatistik falsch segmentieren.

## Isolierte Korrektur
Neue reine Prüfung isArchivedDailyForecastLeadCoherent() in src/forecastLeadTimeEvidence.ts: nur explizite ISO-Offsetzeit, endlicher positiver Vorlauf und Differenz zum tatsächlichen lokalen Zielmittag, mit höchstens einer Minute Toleranz für Archiv-Rundung. Unplausible Prognose-Metadaten werden nur aus der Verifikation ausgeschlossen, nicht aus dem Archiv gelöscht oder zu 0 umgeschrieben. In chosenEvaluations() werden Zielmittage pro Datum und Zeitzone einmal pro Scan berechnet; keine Fetches, neue UI-/CSS-Schichten, Worker oder meteorologischen Datenänderungen. DST im CET/CEST-Raum: 23/25 Stunden bei zwei lokalen Mittagen sind möglich, keine pauschalen +24h-Vermutungen.

## Handoff-Kollisionsschutz
#890 ist in LC #868 bereits als neue isFullDayForecastEvidenceIssuedBeforeDay-Prüfung und geänderte chosenEvaluations()-Funktion enthalten; die #886-PoP-Prüfung ebenfalls. Der vorliegende Spezial-Draft baut aus Gründen der AGENTS.md-Source-Of-Truth-Regel auf dem veröffentlichten Stable auf. Deshalb darf src/forecastVerification.ts aus diesem Spezial-Draft NICHT als Gesamtdatei in LC übernommen werden. Nur neuen Import, neuen isArchivedDailyForecastLeadCoherent-Gate und einmaligen Zielmittag-Cache in den aktuellen LC-Funktionskörper einarbeiten. Drei disjunkte neue Dateien können als geprüfte Git-Blobs selektiert werden.

## QA
Neue tests/unit/mid-audit-lead-consistency.test.ts: fünf Gruppen mit CET/CEST-23-/25h-Mittagen, 12/24/48/72h-Falschzuordnung, 60-s-Toleranz, NoData/NaN, sieben synthetischen archivierten Stationstagen mit nur zwei gültigen Vorläufen; Originalarchivbytefolge unverändert. LC muss die vorhandenen synthetischen Legacy-Fixtures mit bisher willkürlichem leadHours=24 auf konsistente issuedAt/leadHours-Belege korrigieren; bestehende wissenschaftliche Assertions nicht schwächen. Browser-Fall in scripts/verify-paired-verification-browser-0985311.mjs ist für Oktober bereits 24h-kohärent.

Keine behauptete unabhängige reale Skill-Studie, keine iOS/VoiceOver- oder LCP/INP-Freigabe. Erst finaler LC-SHA plus Source/Core/Heavy/Review/Installer/Worker/Pages/Stable-Gates darf Release tragen.

Fachquellen: ECMWF https://confluence.ecmwf.int/spaces/FUG/pages/673551584/Section%2B8.3.5%2BUsing%2Bverification%2Bmetrics%2Bwith%2Bthe%2Boutput ; JWGFVR https://jwgfvr.github.io/forecastverification/ .

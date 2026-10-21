# MID-C39 · P1 Wissenschaftliche Datenintegrität v0.9.85.307 (Source-Kandidat)

Verifizierte Base .306: a1f40fb42ea45bd3c695583a49a1310e0fc853fc (main=mid-stable; 21.10.2026). RUC-Kartenintegration .305, EPS-Kern und ECMWF-Pilot #433 bleiben unverändert, ebenso Drafts #425/#431/#432.

## Codekorrekturen

- Der RADOLAN-HDF5-Dekoder hat bisher physikalisch gültige positive Beträge bei 250 mm hart begrenzt. Diese Schwelle ist entfernt; negative/nicht-endliche Werte werden als uncovered statt scheinbar trocken kodiert. RATE-Konversion /12 bleibt für das bisherige 5-Min-Produkt unverändert; Akkumulationsfenster und Einheit bleiben am Rohprodukt zu überprüfen.
- Szenariocluster nutzten einen Niederschlags-MAD-Filter und verwarfen Cluster mit <6% Mitgliedsanteil. Statistisch seltene vollständige Member-Trajektorien bleiben jetzt erhalten. Alle positiven Cluster behalten ihr Quellgewicht; daraus entstehen keine amtlichen oder unabhängig kalibrierten Wahrscheinlichkeiten.
- Der Wetterzwilling hat historische Prognosen teilweise gegen Modelle/Reanalysen als Referenz evaluiert. Das neue Gate lässt für Skill, Bias, Gewichtung und Kalibrierung nur tatsächlich measured/private-sensor mit mindestens 18 Stunden Tagesdeckung, >=12 Temperatur- und Niederschlagsproben und Qualität >=0,55 zu. Nicht unabhängige Quellen bleiben im Archiv; das bei Ausgabe prognostizierte Regime ersetzt retrospektive Wetterlage zum Schutz gegen Hindsight-Leakage.

## QA und offene empirische Arbeit

Pflichtregressionen: scripts/test-p1-radolan-extremes-0985307.mjs, scripts/test-p1-ensemble-extremes-0985307.mjs, scripts/test-p1-reference-provenance-0985307.mjs. Gesamtinventar 1013. Prüfe echte Types, Builds, komplette Regressionen, Geräteviewport- und Release-/Installer-/Worker-/Pages-Gates. Hier werden vorab keine grünen CI-Läufe, reale iOS-/VoiceOver-Abnahme oder eine 90-Tage-Studie behauptet. Für die empirische Verifikation sind gültige unabhängige Stations-/Radar-QC-Beobachtungen, Modelllauf-/Gültigkeitszeit, Akkumulationsfenster, ein vorab festgelegter zeitlich blockierter Holdout, Fallzahlen/Bias/MAE/RMSE/Brier/CRPS sowie Extremerhalt und saisonale Replikation notwendig.

Nur bestehender SHA-gebundener Source-PR → MID-Bot → ServerZIP → install-mid.yml → Worker-/Pages-Gates → Stable. Keine generischen PR-Landing-Skripte oder neue Workflow-Actions.

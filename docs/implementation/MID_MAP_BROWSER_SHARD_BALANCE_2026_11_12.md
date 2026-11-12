# MID .460 · SHA-basierte Karten-Browser-Laufzeitbalance (12.11.2026)

## Originalnachweis

Aktuelle autorisierte Integration #772 aus v0.9.85.459, `main=mid-stable=30b0be2b95f7b59119fa524c339ab43443c62186`. Im Source-Gate [#43297946239](https://github.com/MeteoMartini/MID/actions/runs/43297946239) gegen `d67483cd83de95445308efaaa98d7db569ec08a3` brach `heavy-unified-map 1/3` nach 13 Minuten exakt beim Schritt `Isolierten Heavy-Regression-Shard vollständig ausführen` ab. 10 vollständige Kartenfälle waren bestanden; danach begann der unveränderte separate 390px-Memory-Probe, ohne bis zum Step-Timeout eine erfolgreiche 20-Zyklen-Quittung zu liefern. Keine falsche Behauptung, dass er bestanden hätte. Einzelne Laufzeiten: 1440px/light/classic 162,5 s; 844px/dark/classic (in bisherigem 3/3) 68,1 s. Die gesamten erfolgreichen anderen Karten-Shards dauerten 2/3 = 446,5 s und 3/3 = 705,0 s. Dieses Zeitprofil gehört ausschließlich zur genannten CI-Software-GPU, nicht zu realen Nutzern.

## Verlustfreie Umverteilung und Abnahme

- Verschiebe exakt den vollständigen 1440px/light/classic-Fall aus 1/3 in die freie Kapazität von 2/3. Kein Screenshot-, Touch-, NoData-, Raster-, Modelllauf-, Quellen-, Satelliten-, Niederschlags- oder Visualisierungs-Assert wird ausgelassen.
- Verschiebe exakt den vollständigen 844px/dark/classic-Fall aus 3/3 nach 1/3, wo bereits der komplette 844px/dark/next-Fall läuft und die vorgeschriebene maximal zweifache Software-GPU-Batchgröße gilt. Dadurch läuft die dunkle Tablet-Variante weiterhin und Gruppe 3/3 erhält Reserve.
- Erwartete Partition nach Codeberechnung: **10/7/7** bei 24 eindeutigen Fällen (6 Breiten × 2 Themes × 2 Design-Modi), keine Doppel- oder Fehlzuordnung. Alle 20 Modellwechsel-/GC-Memory-Zyklen bleiben **genau einmal in 1/3**, ungeteilte Revisionen behalten ihren kompletten Lauf. Vorhandene Negativ-, Genauigkeits-, Valid-Time-/Originaldatei- und Missing-Tests bleiben unverändert.
- Ausdrücklich unverändert: Source-/Installer-Gates, 13-Minuten-Step-Cap, 15-Minuten-Heavy-Job-Cap, 900000-ms-Kindprozess-Cap, Modelldaten, Warnungen, reale Null vs. Missing, Radar/Sat-Pixelchecks, PWA und Worker. Die Änderung ist keine Freigabeerklärung und kein bestandener erneuter Browserlauf.

**Erforderlicher Nachweis:** vollständiger neuer exakter PR-HEAD mit allen Source/Core/Heavy/DWD-Gates, einschließlich echter 20-Zyklen-Speicherprobe. Erst danach der ursprüngliche SHA-Bot → ZIP → Installer → Worker/Pages → Stable-Pfad, ohne manuelles Merge oder Branchschutzänderung.

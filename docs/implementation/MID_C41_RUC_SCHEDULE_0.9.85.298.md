# MID-C41 · RUC-Schedule-Integrität · v0.9.85.298

## Basis und Reproduktionshypothese
main=mid-stable=9bb0670fbc37d042cd77625672a319aa3dbf3f1e, Version .297. Der frühere Scheduler akzeptierte das aktivierte komprimierte Profil bei plausiblen Flags und bloßer Existenz von Objekten. Unvollständige oder widersprüchliche Manifeste mit gleichem RUC-Lauf könnten einen notwendigen Aufbau verhindern. **Dies ist eine codebasierte Präventionshypothese, kein behaupteter Produktionsfehler.**

## Reale Codec-Evidenz
DWD-RUC-Prepare/Publish [39262472403](https://github.com/MeteoMartini/MID/actions/runs/39262472403) für Lauf 2026-10-19T13:00Z: Rohsnapshot 899077811 Byte inklusive Manifest, isolierter verlustfreier Vollsnapshot 288790349 Byte vor optionalen synoptischen Zusätzen; 2252 verifizierte Teile, Rohdatenrollback gesichert. Pages und Worker-Health erfolgreich; fullCodec advertised=true, published=true, verified=true, rawRetained=false. Schedulerlauf 39269528625 meldete DWD=Pages 13Z, Alter 91 Minuten, korrektes Skip. Keine erneute Codec-Aktivierung notwendig.

## Fix und Fachgrenzen
Die zusätzliche Metadatenintegritätskontrolle lädt keine massiven Datenobjekte herunter. SHA der realen Payloads, vollständiger bitidentischer Roundtrip und Worker-Test bleiben verbindlich in bestehenden Publisher-/Healthgates. Weder Niederschlagsakkumulation noch Missing/NoData, DWD-Lauf, Quantisierung, Einheiten, Zeitachse, offizielle Warnungen oder Release-Schutzeinstellungen werden verändert. Defekte aktive Manifeste lösen den existierenden fail-open-Preprocessing-Pfad aus.

## Tests und Veröffentlichung
Python-Regression um korrupte/inkonsistente Bytes, doppelte/gefährliche Pfade, Missing-Proof, Records und Legacy-Profil erweitert. Kein vollumfänglicher Browser-/WKWebView-/VoiceOver-Realgerätetest. Tatsächliches Source-Gate, Installer und Stable SHA müssen separat nachgewiesen werden.

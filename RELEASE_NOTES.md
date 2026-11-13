# MID v0.9.85.463

## Änderungen
- Das europäische OPERA-Radar kann ein echtes DBZH-HDF5-Bild auch dann laden, wenn einer der beiden offiziellen Speicher vorübergehend HTTP 500 oder andere Netzwerk-/Inhaltstypfehler liefert. MID versucht denselben originalen Zeit-/Objektschlüssel am zweiten Speicher und zeigt die tatsächliche Quelle an.
- Fallen beide offiziellen Speicher aus, zeigt MID die Radardaten korrekt als derzeit nicht verfügbar an. Es wird kein Regenbild, keine Niederschlagsart und kein Nullniederschlag erfunden.
- Ein nachweislich signiertes, aber überaltertes optionales DWD-ICON-D2-Vollgebietsartefakt kann die gesonderte 27-h-RUC-Kernveröffentlichung nicht mehr allein blockieren. Das abgelaufene Kartenartefakt wird ausdrücklich ausgelassen; ein neuer gültiger, SHA-gebundener DWD-Signer bleibt Voraussetzung für volle native ICON-D2-Karten.
- Signatur-/SHA-/Inventarfehler, Manipulationen, Zukunftszeitstempel und ausdrücklich ausgewählte Originaldatensätze bleiben harte Fehler. WMO/DWD-Daten-, NoData- und Warnverträge bleiben unverändert.

## Qualität und Abgrenzung
Erweitert sind die OPERA-Integrationstests für Primär-500, Ersatzquelle und Ausfall beider Spiegel sowie die RUC-Negativtests für echte Ablauffälle, explizit gepinnte Freigaben, Zukunftszeiten und manipulierte Originalindizes. Der optionale Auslassungspfad ändert keine Snapshots und behauptet keine native D2-Verfügbarkeit.

Dies ist zunächst ein **Source-/Release-Kandidat**. Erst der vollständige Source-PR-Gate, SHA-gebundene Bot-Merge, serverseitiges Release-ZIP, install-mid.yml, Worker-/Pages-Gates und die erfolgreiche Stable-Promotion erlauben eine Veröffentlichungsmeldung. Die offene browserseitige FullDomain-Abnahme für Sölden (#446), RUC-P1–P5 (#541), Multimodellkomposite (#724), Review-Schutz (#740) und realer iOS-/VoiceOver-Gerätetest sind dadurch nicht vorweggenommen.

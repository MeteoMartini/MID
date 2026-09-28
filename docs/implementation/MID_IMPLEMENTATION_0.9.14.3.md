# MID v0.9.14.3 – Wolkenform-Feinschärfung

## Ziel
Die bisherige Unterscheidung nach tiefen, mittelhohen, hohen, mehrschichtigen und konvektiven Wolken wird um eine eigene Wolkenformklassifikation ergänzt. Dadurch sind Stratus-/Hochnebellagen, Altostratusdecken, Cirrusfelder, Cumulus und Cumulonimbus visuell klarer voneinander getrennt.

## Umsetzung
- `CloudFormKind` mit `stratus`, `altostratus`, `cirrus`, `cumulus`, `cumulonimbus`, `layered` und `generic`.
- Klassifikation kombiniert WMO-Wettercode, Gesamtbewölkung sowie tiefe, mittelhohe und hohe Bewölkung.
- Eigene SVG-Formen für:
  - flache tiefe Schichtbewölkung/Hochnebel,
  - mittelhohe Altostratusdecken,
  - faserige hohe Bewölkung,
  - kompakte Haufenwolken,
  - hochreichende Cumulonimbus-/Gewitterwolken,
  - mehrschichtige Wolkenpakete.
- Semitransparente Tag-/Nacht-Hintergründe werden abhängig von Wetter- und Wolkenform abgestuft.
- Sonne/Mond können bei dünner hoher oder mittelhoher Schichtbewölkung gedämpft durchscheinen; Nachtnebel zeigt den Mond nur schwach.
- SVG-Metadaten `data-cloud-layer`, `data-cloud-form` und `data-day-part` bleiben für Styling, Tooltips und Regression verfügbar.

## Regression
- `scripts/test-weather-pictogram-cloud-forms-09143.mjs`
- bestehende Tag-/Nacht-, Wolkenschicht- und Cockpit-Piktogrammtests

## Verifikation
- gezielte Piktogrammtests bestanden,
- TypeScript-/TSX-Parserprüfung bestanden,
- die vollständige Regression wurde gestartet und lief ohne gemeldeten Fehler, überschritt in der Ausführungsumgebung jedoch das Zeitlimit.

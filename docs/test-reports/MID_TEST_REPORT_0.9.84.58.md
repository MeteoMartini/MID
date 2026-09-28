# MID Test Report 0.9.84.58

## GitHub Installer #1013
Der Lauf importierte das Release-ZIP erfolgreich, `npm ci` und der Dependency-Audit liefen grün. Der TypeScript-7-Check stoppte mit:
`src/RadarPanel.tsx(162,1231): TS2322`
weil `sticky` nicht zum lokalen MID-Tooltip-Typvertrag gehört.

## Korrektur
- `sticky` ausschließlich am neuen Fronten-Tooltip entfernt.
- Fronttyp, Modellname und Analyse-Score bleiben im Tooltip erhalten.
- Keine Änderung an Frontdiagnostik, Isohypsen, Geopotentialwerten, H/T-Zentren oder Worker-Gridlogik.
- Regression `test-composite-front-tooltip-types-098458.mjs` ergänzt.

## Lokal erfolgreich
- `test-composite-front-tooltip-types-098458.mjs`
- `test-composite-front-symbol-jsx-098457.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- Versionierung, Lineage und Baseline
- 163 TS/TSX-Dateien ohne Parserdiagnostik
- Worker-Hauptdatei und `worker/metar-proxy.js` byteidentisch
- `node --check` für beide Workerdateien

## Umgebung
Eine frische lokale `npm ci`-Installation konnte in dieser isolierten Laufzeit wegen eines Transport-/Netzwerktimeouts nicht abgeschlossen werden. Das ist kein Codebefund. GitHub #1013 bestätigte unmittelbar zuvor Lockfile, npm-ci und Dependency-Audit als erfolgreich; der vollständige TypeScript-7-/Vite-/Regression-Gate läuft beim nächsten Installer erneut fail-closed.

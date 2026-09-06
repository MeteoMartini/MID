# MID v0.9.78.84 — Prüfbericht

## Auslöser

GitHub Actions Run #916 scheiterte im Schritt `Produktionsbuild und Regressionstests ausführen` beim TypeScript-Check ausschließlich an zwei identischen Fehlern in `src/RadarPanel.tsx`: Das Feld `smoothFactor` ist im von MID verwendeten `PathOptions`-Typ nicht zulässig.

## Korrektur

- beide `smoothFactor`-Einträge aus den beiden Synoptik-Polylines entfernt
- MID-eigene Konturglättung (`cleanContourPath` → `chaikinContour` → `smoothContourPath`) unverändert beibehalten
- runde Linienenden/-übergänge und sämtliche Farbfunktionen unverändert beibehalten

## Lokal ausgeführt

- `scripts/test-synoptic-contour-path-options-097884.mjs` bestanden
- `scripts/test-versioning.mjs` bestanden
- `scripts/test-baseline-079526-contract.mjs` bestanden
- `scripts/test-release-lineage.mjs` bestanden
- `node --check worker/metar-proxy.js` bestanden
- `node --check worker.js` bestanden

Der vollständige lokale `npm ci` konnte in der Chat-Laufzeitumgebung wegen eines Container-Transport-Timeouts nicht abgeschlossen werden. Dadurch fehlen dort einzelne installierte Typ-Pakete; dies ist kein Projekt-/Lockfilefehler. Der GitHub-Runner hatte unmittelbar zuvor dieselbe Release-ZIP reproduzierbar installiert und war erst an den beiden nun entfernten `smoothFactor`-Typfehlern gescheitert.

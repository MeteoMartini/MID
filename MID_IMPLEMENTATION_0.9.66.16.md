# MID 0.9.66.16

## Extremwetter-DACH: Regressionen an die neue GeoJSON-Geometrie gekoppelt

Der fachliche Flächenfix aus 0.9.66.14/0.9.66.15 trennt die Konturberechnung
(`extremeOutlookAreaCanvas.ts`) von der GeoJSON-Verschachtelung
(`extremeOutlookAreaGeoJson.ts`). Vier ältere Regressionstests prüften jedoch
weiterhin konkrete Implementierungsstrings aus dem früheren monolithischen
Overlay und schlugen deshalb im Installer fehl, obwohl die neue Geometrie
fachlich korrekt eingebunden war.

Die Regressionen wurden auf den aktuellen Vertrag aktualisiert:

- `test-extreme-outlook-area-rendering-09662.mjs`
- `test-extreme-outlook-dwd-scale-dashboard-persistence-09669.mjs`
- `test-extreme-outlook-labels-layout-persistence-09668.mjs`
- `test-extreme-outlook-smooth-contours-09663.mjs`

Sie prüfen nun die tatsächliche Architektur: Konturberechnung im Canvas-Modul,
GeoJSON-Multipolygon-/Lochringlogik im separaten GeoJSON-Modul und die Anbindung
über `buildExtremeOutlookContourGeoJson` im MapLibre-Overlay. Die meteorologischen
Schwellen, Flächenwerte und Darstellungslogik werden nicht zurückgebaut.

Die bereits in 0.9.66.15 enthaltenen Korrekturen für die TypeScript-GeoJSON-Typen,
die Wolkenuntergrenzen-Plausibilität und die chronologische Sortierung amtlicher
Warnungen bleiben vollständig erhalten.

Worker fachlich unverändert; nur versionssynchronisiert.

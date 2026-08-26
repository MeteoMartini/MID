# MID 0.9.66.14

## DACH-Extremwetterkarte: geschachtelte Flächengeometrie stabilisiert

Die eckige >60-%-Darstellung entstand nicht aus der meteorologischen Feldberechnung,
sondern bei der Umwandlung der bereits korrekt berechneten Konturringe in
GeoJSON-Multipolygonen für MapLibre. Bisher wurden alle Ringe eines Kontursignals
pauschal als eine einzige Polygonstruktur weitergereicht. Dadurch konnten
Lochringe für die 60-%-Schraffur sowie Inseln innerhalb geschraffter Aussparungen
fachlich falsch als bloße Innenringe interpretiert werden. Sichtbar wurde das als
rechteckige oder anderweitig unplausible Teilflächen.

Die Korrektur trennt die Zuständigkeiten nun sauber:

- `extremeOutlookAreaCanvas.ts` bleibt die kanonische Quelle für die geglätteten
  Feldkonturen.
- Neu bündelt `extremeOutlookAreaGeoJson.ts` die Umwandlung in MapLibre-taugliche
  GeoJSON-Multipolygone.
- Ringe werden nach Flächenhierarchie verschachtelt. Außenringe, Lochringe und
  Inseln innerhalb geschraffter Aussparungen werden getrennt erkannt und in eine
  stabile Polygonstruktur überführt.
- Die Orientierung der Ringe wird normiert, damit MapLibre die >60-%-Kerne,
  Schraffur-Lochringe und innere Inseln reproduzierbar korrekt rendert.
- Das Overlay aktualisiert seine Quellen nun auch dann sauber, wenn eine Auswahl
  vorübergehend keine Konturen liefert; veraltete Restgeometrien bleiben dadurch
  nicht stehen.

Meteorologische Schwellen, Farben, Deckkraft, Wahrscheinlichkeiten,
Mehrparameterdiagnostik und Worker-Datenvertrag bleiben unverändert. Der Fix ist
fachlich ein Professional-Frontend-Thema; Worker fachlich unverändert.
Für die Release-Hygiene und die appweite Versionskopplung wurden Professional und
Worker dennoch gemeinsam auf 0.9.66.14 synchronisiert.

## Regression

Der neue Regressionstest `scripts/test-extreme-outlook-geodata-096614.mjs`
prüft:

- die neue GeoJSON-Multipolygonen-Umwandlung,
- korrekt orientierte Außen- und Lochringe,
- Inseln innerhalb geschraffter Aussparungen,
- die Overlay-Anbindung ohne verfrühten Abbruch bei leeren Konturen,
- die konsistente Versionskopplung zwischen Professional-Build und Worker.


### Nachtrag: Flug-Event-Plausibilität für Wolkenuntergrenzen
- Die Flug-Event-Diagnose filtert jetzt implausible sehr niedrige Wolkenuntergrenzen aus groben Druckniveauprofilen.
- Besonders Angaben wie "unter 100 ft AGL" werden nicht mehr allein aus dem Modellprofil gezeigt, wenn gleichzeitig gute Sicht ≥ 10 km und kein stützendes `cloud_cover_low`-/Wettercode-Signal vorliegen.
- Sehr niedrige diagnostische Untergrenzen bleiben nur zulässig, wenn ausgeprägte tiefe Bewölkung, reduzierte Sicht oder ein passender Wettercode (z. B. Nebel/Niesel/Regen) die Aussage stützen.
- Dazu wurde eine kleine Regression ergänzt (`scripts/test-event-flight-ceiling-plausibility-096615.mjs`), damit implausible Event-Karten mit "unter 100 ft AGL" nicht wieder auftauchen.

### Nachtrag: Build-Fix Extremflächen-GeoJSON
- `buildExtremeOutlookContourGeoJson` liefert die Konturen jetzt als explizit typisierte GeoJSON-Multipolygonen aus.
- Lochringe und Inseln innerhalb geschraffter Aussparungen bleiben weiterhin korrekt erhalten; zusätzlich ist die Typableitung für `FeatureCollection<MultiPolygon, ...>` nun stabil.
- Damit verschwindet der Produktionsbuild-Fehler rund um `Feature<Geometry, GeoJsonProperties>` / `type: "Feature"`.
- Worker fachlich unverändert.

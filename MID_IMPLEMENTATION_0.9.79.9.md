# MID v0.9.79.9 – Skybar-Vierstufen appweit nachgeschärft

## Befund

Die Skybar wurde bereits aus einer gemeinsamen Segmentlogik gespeist, die vier Dickenstufen vorsah. Die bisherige Abstufung `2.4 / 3.3 / 4.2 / 5.1` war auf kleinen iPhone-Darstellungen jedoch optisch zu eng beieinander. Zusätzlich lag in den kompakten 7-Tage-Tageskarten eine 7 SVG-Einheiten hohe Grundschiene hinter den Segmenten; diese konnte insbesondere graue Wolkenstufen visuell nivellieren.

## Korrektur

- Ein gemeinsamer appweiter Dickenvertrag `2.4 / 3.6 / 4.8 / 6.0` wird für Sonne, Bewölkung und Niederschlag verwendet.
- Sonne und Bewölkung bilden den Bereich 50–100 % explizit in vier gleich breite Klassen ab: 50–62,5 %, 62,5–75 %, 75–87,5 %, 87,5–100 %. Gelb bleibt erst oberhalb 50 % aktiv; Grau beginnt ab 50 %.
- Niederschlag behält vier zeitnormalisierte Intensitätsklassen: 0,05–<0,5 / 0,5–<2,5 / 2,5–<10 / ≥10 mm/h.
- Jedes Segment führt die tatsächlich verwendete `thicknessLevel` 1–4 mit; der SVG-Renderer gibt sie als `data-skybar-level` aus. Damit lässt sich im DOM eindeutig prüfen, welche Stufe gerendert wird.
- Die Grundschiene in den 7-Tage-Tageskarten wird von 7 auf 1,2 SVG-Einheiten reduziert. Sie bleibt als dezente Achse erhalten, kann die vier echten Segmentdicken aber nicht mehr überdecken.
- Alle sichtbaren Skybars – Tagesdetail/24 h, 24-h-Profil, 7-Tage-Kurvenübersicht und 7-Tage-Tageskarten – nutzen weiterhin denselben `detailSkyBarSegments`-/`SkyBarSegmentsSvg`-Pfad.

## Unverändert

Farben und Fachsemantik bleiben unverändert: Sonne gelb, Bewölkung einheitlich grau, Niederschlag nach der bestehenden Phasenpalette. Gelb und Grau bleiben gegenseitig exklusiv. Keine Änderung an Forecast-Daten, Radar/Satellit, Einheiten oder Worker-Fachlogik.

## Regression

`scripts/test-skybar-four-thickness-appwide-09799.mjs` schützt vier klar getrennte Dicken, alle Schwellen, den gemeinsamen Renderer, die appweiten Einbindungen und die reduzierte Tageskarten-Grundschiene.

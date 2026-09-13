# MID v0.9.84.90 – Implementierung

## Anlass
GitHub Actions Installer #1043 baute MID v0.9.84.89 erfolgreich mit TypeScript 7 und Vite 8, stoppte aber bei drei Regressionstests, die noch Text-/Codeverträge der früheren ausführlichen Komposit-Layerdarstellung erwarteten.

## Korrektur
- `test-mid-ui-longrange-09416.mjs`: schützt jetzt den kompakten Fehlerstatus der Niederschlagsart und den weiterhin sichtbaren ausführlichen Warnhinweis statt der entfernten Formulierung „Phasendaten nicht erreichbar“.
- `test-performance-aqi-live-071010.mjs`: schützt die kompakte Zellen-Zusammenfassung sowie die weiterhin vorhandenen ausführlichen KONRAD3D-/NowCastMIX-Diagnosen; veraltete K3D/MIX-Kurztexte wurden entfernt.
- `test-radar-seasonal-motion-nowcast-objects.mjs`: schützt die aktuelle kompakte Zellenanzeige `K3D n · MIX n` bzw. `keine Zellen` statt der früheren internen State-Textkombination.

## Fachliche Auswirkungen
Keine. Produktionscode und meteorologische Logik wurden gegenüber v0.9.84.89 nicht verändert. Die Korrektur betrifft ausschließlich drei veraltete Regressionserwartungen und Release-Metadaten.

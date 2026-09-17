# MID C14 · gesicherter Fortsetzungsstand · v0.9.85.34

Stand: 2026-09-17

## Verbindliche Änderungen

- Kartenbereich als Map-first-Arbeitsraum (`midC14MapWorkspace.css`, `WeatherMapsPanel`).
- Legacy-CSS `v078` wird vor C7–C14 geladen, damit das Redesign nicht mehr nachträglich überschrieben wird.
- Reale Smartphone-Korrekturen aus IMG_1841–IMG_1844 in `midC14ViewportFixes.css`: kompakter Kopf, einheitliche Abstände, vier aktuelle Kernparameter, Portrait-Impressum mit dauerhaft erreichbarem Schließen-Button, horizontal begrenzte DWD-Zoom- und Diagrammflächen.
- `CompositeTimelineContract.phaseSources` erlaubt künftig innerhalb derselben bestätigten Zeitachse einen expliziten Quellenwechsel, insbesondere echte Satellitenbeobachtung → modellbasiertes Pseudo-Satellitenbild. Keine künstlichen Zwischenframes.
- Regressionen: `test-c14-map-workspace-098534.mjs` und `test-c14-viewport-fixes-098534.mjs`.
- Externer und interner Changelog beginnen bei v0.9.85.34.

## Veröffentlichung

Ausschließlich: Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → GitHub Pages → Stable-Promotion. Kein manueller Bypass. Erst nach erfolgreicher Stable-Promotion gilt v0.9.85.34 als veröffentlicht.

## Nächste Redesign-Schritte nach C14

Nach erfolgreicher Veröffentlichung weiter abschnittsweise prüfen: Heute/24-h-Profil → Vorhersage → Karten → Mehr/Planer/Profi. Reale Smartphone-Screenshots haben Vorrang vor reinem Strukturtest; iPhone Hoch-/Querformat, iPad/Tablet und Desktop jeweils auf Umbruch, Überlauf, Tooltips/Overlays und Bottom-Safe-Area prüfen.

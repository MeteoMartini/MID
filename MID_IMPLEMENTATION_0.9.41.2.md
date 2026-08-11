# MID v0.9.41.2 – mobiles Temperatur-Ensemble-Tooltip

## Korrektur

Das Tooltip im Temperatur-Ensemble behält auf Mobilgeräten seine bestehende Größe und Typografie. Die Metazeilen **Sonne**, **Niederschlag** und **Modelle** erhalten stattdessen eine gemeinsame, ausreichend breite Beschriftungsspalte und eine getrennte flexible Wertspalte.

Damit laufen insbesondere die lange Beschriftung „Niederschlag“ und der zugehörige Inhalt nicht mehr optisch ineinander. Lange Werte dürfen ausschließlich in der rechten Spalte an natürlichen Trennstellen umbrechen; Bezeichnungen bleiben einzeilig. Die drei Zeilen beginnen dadurch konsistent an derselben X-Position.

Desktop-Tooltip, Temperaturmatrix, Diagrammgeometrie, Tooltip-Gesamtbreite, Padding und Schriftgrößen bleiben unverändert.

## Regression

`scripts/test-ensemble-mobile-temperature-tooltip-09412.mjs` schützt die drei Metazeilen, die mobile Zweispaltengeometrie sowie ausdrücklich den Verzicht auf Größen-/Typografieänderungen im neuen Fixblock.

## Deployment

Frontend-Wartungsrelease. Der Worker enthält gegenüber v0.9.41.1 keine funktionale Änderung; lediglich die Versionskennung wird synchronisiert. Ein erneuter Worker-Upload ist für diesen Tooltip-Fix nicht erforderlich, wenn bereits der v0.9.41.x-Worker ausgerollt ist.

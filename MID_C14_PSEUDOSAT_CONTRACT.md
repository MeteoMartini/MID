# MID C14 · Kartenvertrag Satellit → Pseudo-Satellit

## Ziel

Die Kartenzeitachse soll perspektivisch ohne harten Ansichtswechsel von bestätigten Satellitenbeobachtungen in modellbasierte Pseudo-Satellitenbilder übergehen können.

## Fachliche Grenzen

- Beobachtung bleibt Beobachtung; modellgenerierte Zukunftsbilder werden ausdrücklich als `Modell · Pseudo-Satellit` gekennzeichnet.
- Die Quelle wechselt auf derselben Zeitachse sichtbar am ersten Modelltermin. Der Quellenwechsel darf nicht durch ein neutrales `Satellit`-Label verschleiert werden.
- Es werden ausschließlich reale, bestätigte Zeitpunkte eines angebundenen Modellprodukts verwendet. MID erfindet keine Zwischenbilder, keine künstliche Satellitenbeobachtung und keine zeitliche Interpolation über größere Produktlücken.
- Das letzte reale Satellitenbild darf bei einem kleinen zeitlichen Abstand kontrolliert ausblenden; das erste Pseudo-Satellitenbild darf einblenden. Der Blend ist rein visuell und ändert nicht den fachlichen Zeitstempel.
- Nowcast- und Modellphasen bleiben unabhängig von Satellitenprodukten gekennzeichnet. Pseudo-Satellit ersetzt keinen Radar-/Nowcast-Niederschlag.
- Produkt-, Modelllauf-, Gültigkeitszeit- und Quellenmetadaten müssen im Info-Bereich abrufbar bleiben.

## Architekturstand v0.9.85.34

`CompositeTimelineContract.phaseSources` kann Beobachtung, Nowcast und Forecast verschiedene Quellenbezeichnungen zuweisen, ohne die gemeinsame bestätigte Zeitachse aufzubrechen. Die tatsächliche Pseudo-Satellitenquelle wird erst angebunden, wenn ein wissenschaftlich geeigneter numerischer Produktpfad verfügbar und fachlich geprüft ist.

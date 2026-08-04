# MID v0.9.15.4

## I. Wetterblick-/Performance-Prüfung

Die sichtbaren Wetterblick-Funktionen wurden als Produkt- und Interaktionsreferenz bewertet. Proprietärer Code und Wetterblick-Daten werden nicht kopiert. MID setzt die übertragbaren Prinzipien eigenständig um: stabile Rasterlayer, Kachelpuffer, paralleles Vorladen angrenzender Zeitstände, Desktop-Zoomanimation und ressourcenschonende Touch-Aktualisierung.

## II. Betroffene Orte

Die Ursache für die Ein-Ort-Ausgabe lag in zwei Punkten: Bei zu kurzer KONRAD3D-Spur existierte kein vollständiger Korridor, und der BigDataCloud-Fallback wurde nur bei exakt null Overpass-Treffern aktiviert. Sobald der Bezugsort vorhanden war, wurde die Liste daher nicht ergänzt.

Ab v0.9.15.4 wird eine fehlende/kurze Spur bis 60 Minuten in 10-Minuten-Schritten aus Zugrichtung und Zuggeschwindigkeit ergänzt. Liefert Overpass weniger als drei Orte, weniger als zwei Nicht-Bezugsorte oder weniger als zwei Zukunftsorte, ergänzt MID die Liste entlang der Spur per begrenzt paralleler Rückwärtsgeokodierung. Ergebnisse werden dedupliziert, gecacht und transparent als kombinierte Quelle ausgewiesen.

## Regression

`scripts/test-storm-place-resilience-radar-performance-09154.mjs` prüft die 60-Minuten-Spur, die Mehrortausgabe trotz nur eines Overpass-Treffers, die Route mit mehreren Orten und die ruckelarmen Layer-Einstellungen.

# MID-C7 · Implementierungsnotiz v0.9.85.25

## P5 · Viewport-Qualitätssicherung

Die C7-Arbeitsbereiche erhalten eine eigene Referenzmatrix für zwölf übliche Größen: schmale und große Telefone, Querformat, Tablets sowie Desktop bis 1920 px Breite. Sie schützt die drei klar getrennten Navigationszustände:

- bis 850 px: Bottom-Navigation innerhalb der Safe Areas;
- 851 bis 1120 px: kompakte Desktop-Rail;
- ab 1121 px: volle, niemals nach links verschobene Desktop-Rail.

Der Vertrag prüft zusätzlich horizontales Scrollen der Prognosehorizonte, kleine Radien auf schmalen Geräten und reduzierte Bewegung. Er ändert keine fachlichen Daten, RUC-/Radar-Pfade, gespeicherten Einstellungen oder Interaktionen.

## Sichtbare C7-Komposition

Die neue, zuletzt geladene Kompositionsschicht ersetzt für MID Next die bisherige Wirkung zahlreicher punktueller Korrekturen: Der Ortskopf wird zur atmosphärisch ruhigen Leitfläche, Wetterwerte erhalten klar getrennte Instrumentfelder, die Horizonsteuerung wird zur eigenständigen Zeitnavigation und Karten-/Planungsansichten erscheinen als zusammenhängende Arbeitsflächen. Auf Tablet und Desktop erhält die Navigation eine sichtbare, reservierte linke Rail; mobil bleibt sie als schwebende Bottom-Bar innerhalb der Safe Areas.

## Offener Nachweis

Die automatisierte Matrix ist ein Layoutvertrag, kein Ersatz für eine Sichtprüfung in einem sauberen PWA-Profil. Der bereits geöffnete Browser hält die alte App-Shell bewusst im lokalen Cache; dieser Speicher wird nicht automatisch gelöscht. Nach der kontrollierten Übernahme von v0.9.85.24 ist die manuelle P5-Sichtprüfung gegen die zwölf Größen der nächste abschließende Nachweis.

# MID v0.9.85.27 – MID-C7 Konzeptkorrekturen

## Anlass

Die Abnahmeansicht zeigte drei konkrete Regressionspunkte: doppelte aktive Einträge in der mobilen Hauptnavigation, eine rohe lokale Speicherquota-Meldung sowie die frühere Kachelreihe in der Kurzfristansicht.

## Umsetzung

- `Heute` ist der einzige Bottom-Bar-Eintrag für `short-term`; der Vorhersageeintrag kann diesen Modulzustand nicht mehr zusätzlich aktiv markieren.
- Eine erkannte Storage-Quota löst ausschließlich die vorhandene, datenerhaltende Storage-Recovery aus und startet einen begrenzten erneuten Ladevorgang. Die Browser-Rohmeldung wird nicht mehr in der Wetterfläche ausgegeben.
- Die Kurzfristansicht ist in MID Next eine fortlaufende Zeitmatrix mit fester Zeile/Spaltenhierarchie für Zeit, Wetter, Temperatur, Niederschlag und Wind. Nur der selektierte Zeitpunkt erhält eine zurückhaltende Hervorhebung; eigenständige Kachelflächen werden entfernt.

## Kartenzeitachse

Radar und Satellit bleiben Beobachtungsprodukte. Sobald die bereits vorhandenen Modelllinien aktiviert sind, ergänzt dieselbe Zeitachse deren echte Modelltermine ohne Umschalter. Der gewählte Zukunftstermin wird auf der Karte ausdrücklich als „Modell · Synoptik“ ausgewiesen; Radar- oder Satellitenprognosen werden nicht nachgebildet.

## Regression

`scripts/test-c7-concept-corrections-098527.mjs` schützt die exklusive Navigation, Quota-Recovery und die Zeitmatrix.

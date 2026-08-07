# MID v0.9.26.1

## DWD Wolken + Niederschlagsart
- Die rekonstruierte Satelliten-/HymecNG-Karte ist aus dem aktiven Panel entfernt.
- Angezeigt wird jetzt das unveränderte amtliche DWD-Kombinationsbild der Produktseite `wolken_niederschlagsart` über den bestehenden Worker-Bildproxy.
- Radar- und Satellitenzeit werden direkt in derselben Worker-Antwort wie das Bild über `x-mid-radar-at` und `x-mid-satellite-at` geliefert. Damit gehören die sichtbaren Zeitangaben konstruktiv zu genau dem geladenen Bildstand.
- Bildpunkt-Auswertung erfolgt direkt auf dem angezeigten Originalbild. Bei zwischenzeitlich aktualisiertem DWD-Bild wird die Auswertung abgebrochen und ein Neuladen verlangt.
- Standortkoordinaten können weiterhin eingeblendet werden; sie werden bewusst nicht mehr irreführend in das amtliche Originalbild eingezeichnet.

## Kurzfrist / 24 h
- Tageseckdaten (wärmster/kühlster Zeitpunkt, Windhöhepunkt, Niederschlagsspitze) stehen jetzt unterhalb der 24-h-Liste.

## Regression
- Veraltete Regressionserwartungen aus der vorherigen HymecNG-/Leaflet-Rekonstruktion wurden auf die neue Originalprodukt-Architektur angepasst.
- Neuer Test: `scripts/test-mid-09261-dwd-original-order.mjs`.
- 319/319 automatisch erkannte Regressionstests bestanden.

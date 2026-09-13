# MID 0.9.84.83 – RADOLAN-Mengen im aktuellen Wetter wieder vollständig sichtbar

## Befund

Der Datenpfad für die RADOLAN-Rückschau war weiterhin vollständig vorhanden. MID lädt für Deutschland eine 1-h-Rückschau und eine 24-h-Rückschau. In der sichtbaren Niederschlagskachel von „Aktuelles Wetter“ war nach den letzten Verdichtungen jedoch nur noch die 1-h-Menge als kompakte Detailzeile sichtbar; die 24-h-Menge war nur noch über die Info-Schaltfläche erreichbar.

## Korrektur

Die sichtbare Detailzeile der Niederschlagskachel zeigt wieder beide verfügbaren Werte kompakt als `RADOLAN · 1 h … mm · 24 h … mm`. Der bestehende fachliche Datenvertrag bleibt unverändert:

- 1 h: bevorzugt RADOLAN RW, `adjusted=true` (angeeicht), sofern der RW-Stand ausreichend aktuell ist.
- 1 h Fallback: RADOLAN RY, `adjusted=false` (nicht angeeicht), wenn noch kein ausreichend aktuelles RW verfügbar ist.
- 24 h: RADOLAN SF, `adjusted=true` (angeeicht), sofern der SF-Stand ausreichend aktuell ist.

Die technischen Details nennen zusätzlich Produkt und Angeeicht-Status, damit ein RY-Fallback nicht wie eine angeeichte Messsumme erscheint.

## Unverändert

Keine Änderung an RADOLAN-Decodierung, Rasterabtastung, Nowcast, Modellfusion, Warnlogik, Schwellen, Niederschlagsarten oder Mengenberechnung. Die Änderung betrifft ausschließlich die Darstellung bereits geladener Werte.

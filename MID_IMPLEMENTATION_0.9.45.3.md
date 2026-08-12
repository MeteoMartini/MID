# MID v0.9.45.3

## Standort beim App-Start
- War beim letzten App-Zustand der automatisch ermittelte Standort aktiv, wird beim nächsten Start die Geoposition erneut bestimmt und der sichtbare Ort auf die neue Position aktualisiert – unabhängig davon, ob die optionale Standort-Kachel im Schnellzugriff eingeblendet ist.
- Ein manuell gewählter Favorit/Ort wird durch die Hintergrund-Aktualisierung des Standort-Trackings nicht überschrieben.

## Event-Center unter der Glocke
- Jede Event-Zeile zeigt bereits im kompakten Zustand die meteorologischen Eckdaten: Temperatur, Niederschlagswahrscheinlichkeit/-menge, Wind/Böen sowie UV-Index.
- Die Glocke leuchtet nur noch bei materiellen Änderungen der erwarteten Eventbedingungen.
- Ein neuer Modelllauf allein, eine neue Speicherung oder kleine Lauf-zu-Lauf-Schwankungen erzeugen keine rote Update-Markierung mehr.
- Relevanzschwellen: Niederschlagswahrscheinlichkeit ±20 Prozentpunkte, Niederschlagsmenge ±1,5 mm, Wind ±6 kt, Böen ±8 kt, Temperatur ±3 °C sowie ein relevanter Wechsel des Wettercharakters bzw. der Eventbewertung.
- Alte rein modelllaufbedingte bzw. triviale Event-Center-Markierungen werden beim Lesen auf „Stabil“ normalisiert.

## Worker
- Keine Änderung am separaten MID-Worker erforderlich; die Anpassungen liegen vollständig in der Web-App.

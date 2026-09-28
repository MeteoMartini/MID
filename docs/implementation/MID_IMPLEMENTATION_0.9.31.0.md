# MID v0.9.31.0

## Amtliches DWD-Originalprodukt + neues 24-h-Wetterprofil

### Wolken + Niederschlagsart
- Im abgedeckten DWD-Gebiet wird wieder das amtliche DWD-Kombinationsbild selbst angezeigt.
- Keine Rekonstruktion aus Einzel-Layern im aktiven Produktpfad.
- Das Originalbild ist von 100 bis 300 % zoombar; der sichtbare Ausschnitt kann innerhalb des Bildfensters verschoben werden.
- Radar- und Satellitenzeit werden aus denselben Response-Headern gelesen, die mit dem tatsächlich angezeigten Bild ausgeliefert werden.
- Die Bildpunkt-Auswertung bleibt an den Originalpixeln des DWD-Bildes ausgerichtet und ist damit vom Zoom unabhängig.

### 24-h-Wetterprofil
Das bisherige Meteogramm wurde durch ein gemeinsames Wetterprofil ersetzt, das die wesentlichen Größen auf einer Zeitachse verdichtet:
- Temperatur, gefühlte Temperatur und Taupunkt
- Niederschlagsmenge und -wahrscheinlichkeit
- Wind und Böen inklusive Windrichtung
- tiefe, mittlere und hohe Bewölkung
- objektiv aus den vorhandenen Daten berechnete Wetterbelastung

Zusätzliche abgeleitete Signale:
- **Ruhiges Fenster:** längstes Zeitfenster mit niedriger Wetterbelastung, wenig Niederschlag/Gewitter und akzeptabler Sicht/Wind.
- **6-h-Drucktrend:** aus dem vorhandenen Stunden-Luftdruck berechnet.
- **Feuchte-/Nebelhinweis:** aus minimaler Temperatur-Taupunkt-Differenz und vorhandener Feuchte/Sicht abgeleitet.
- **Wetterbelastung:** transparenter 0–100-Index aus Niederschlag, Gewitter, Böen, Sicht, Nebelpotenzial sowie Hitze-/Kältestress.
- **Wolkenbasis***: grobe T–Td-Näherung (ca. 125 m je Kelvin Temperatur-Taupunkt-Differenz), ausdrücklich nicht als gemessene Ceiling deklariert.

### Regression
- Bestehende Tests, die noch das rekonstruierte Kartenprodukt oder das alte Meteogramm verlangten, wurden auf die neue Sollfunktion geprüft und angepasst.
- Neuer fokussierter Test: `scripts/test-mid-original-dwd-weather-profile-09310.mjs`.

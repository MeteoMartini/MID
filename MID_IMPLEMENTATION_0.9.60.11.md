# MID v0.9.60.11 – AQI-Skalen- und dynamischer Zeitpfeil-Fix

## EU-AQI
- Der Positionspunkt einer Schadstoffskala wird jetzt aus derselben EU-AQI-Stufe abgeleitet, die auch den aktiven Farbbereich bestimmt.
- Wenn Open-Meteo einen pollutant-spezifischen `european_aqi_*`-Wert liefert, steuert dieser sowohl Kategorie als auch Position. Nur ohne AQI-Wert fällt MID auf die Konzentrationsschwellen zurück.
- Die Open-Meteo/CAMS-Fallbackschwellen wurden auf den aktuellen offiziellen API-Stand synchronisiert.

## Kompositbild / Zeitpfeil
- Keine starre +15/+30/+45/+60-Skala mehr.
- Die Skala wird aus Geschwindigkeit der wolkengewichteten Vertikalprofil-Schwerpunktströmung, Kartenzoom, verfügbarem Pixelweg bis zum Kartenrand, Kartengröße und Displaydichte bestimmt.
- Verwendet werden ausschließlich runde Schritte 2/5/10/15/20/30/45/60 min.
- 2–5 Unterteilungen werden so gewählt, dass die Labels lesbar bleiben; Gesamtzeit maximal +120 min.
- Linie und Labelpositionen verwenden exakt dieselben geographischen Tickpunkte, damit Markierungen und Skala deckungsgleich bleiben.

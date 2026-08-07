# MID v0.9.21.0

## Splashscreen
- MID-Logo im initialen Startbildschirm von 118 auf 156 Pixel vergrößert.
- Responsive Maximalbreite und stärkerer Logo-Fokus auf Smartphone, Tablet und Desktop.
- Ruhiger radialer Hintergrund und angepasste Abstände.

## Optionales Wetterkartenmodul
- Neuer Dashboard-Baustein `weather-maps` ausschließlich für den erweiterten Modus.
- Standardmäßig deaktiviert und über Einstellungen → Dashboard/Sektionen aktivierbar.
- DWD-WMS-Produkte aus ICON-EU, ICON, ICON-EPS, NowCastMIX und Meteosat.
- Auswahl von Modell/Quelle, Produkt, Zeitschritt, Druckfläche, Kartenbasis und Deckkraft.
- Animation der verfügbaren Zeitschritte und Standortmarkierung.
- NowCastMIX-Karten für signifikante Wettererscheinungen werden ausdrücklich nicht als Flugwetterberatung dargestellt.

## Worker
- `weather-map-metadata` für Zeit-, Modelllauf- und Druckflächendimensionen.
- `weather-map-wms` als CORS-sicherer, auf eine feste DWD-Layer-Allowlist begrenzter Proxy.
- Worker-Upload erforderlich.

## Version
- Vorher: 0.9.20.1
- Neu: 0.9.21.0

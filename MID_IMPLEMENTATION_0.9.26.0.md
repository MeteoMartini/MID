# MID v0.9.26.0

## Wolken + Niederschlagsart
- Satellitenebene auf den bereits im MID-Radar bewährten Composite-Produktpfad umgestellt: tatsächliches DWD/EUMETSAT-Produkt wird anhand des verbindlichen DWD-Satellitenzeitstands ausgewählt und CORS-sicher über den Worker geladen.
- Kartenbasis wird bei aktivem Satellitenbild deutlich zurückgenommen, damit das Satellitenbild sichtbar bleibt.
- HymecNG wird nur noch eingeblendet, wenn ein Datensatz maximal 15 Minuten vom verbindlichen Radarzeitpunkt abweicht und insgesamt frisch ist. Alte OpenData-Dateien werden nicht mehr als scheinbar aktuelle Niederschlagsart dargestellt.

## 24-h-Leiste / Meteogramm
- Mobil zunächst sechs Stundenkacheln; „mehr anzeigen“ klappt die restlichen 24-h-Kacheln auf, „weniger anzeigen“ wieder ein.
- Taupunkt im 24-h-Meteogramm ganzzahlig.

## Wetterkarten
- ICON-D2 von nicht zuverlässig verfügbaren DWD-WMS-Layern auf einen aktuellen ICON-D2-Rasterpfad über Open-Meteo umgestellt.
- Kombinationskarten: Bodendruck + ThetaE 850 hPa, Bodendruck + SIGWX/Wettercode, Bodendruck + Niederschlag.
- ICON-D2-Zugriff versucht die aktuellen Modellkennungen `dwd_icon_d2` und `icon_d2` und validiert vollständige Rasterzeilen.
- INIT und GÜLTIG werden als eigener, prominenter Block angezeigt; fehlende Zeitdimensionen werden ausdrücklich als nicht verfügbar gekennzeichnet.

## Qualität
- Veraltete Regressionserwartungen zu alten ICON-D2-WMS-Layern, Satelliten-Hardcoding, Kartenzoom und statischem 24-h-Markup bereinigt.
- Neuer Regressionstest `scripts/test-mid-09260-live-source-mobile-maps.mjs` schützt Live-Quellen-Freshness, mobile 24-h-Aufklappung, ganzzahligen Taupunkt, ICON-D2-Kombinationskarten und Gültigkeitsanzeigen.
- 318/318 automatisch erkannte MID-Regressionstests bestanden.

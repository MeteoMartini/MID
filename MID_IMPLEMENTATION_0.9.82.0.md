# MID v0.9.82.0 – Implementierung

## Klima
- `wind_gusts_10m_max` wird im bestehenden ERA5-Seamless-Tagesabruf optional mitgeführt.
- Fällt die Böenvariable aus oder wird sie von einer Quelle nicht geliefert, wiederholt MID den Basisabruf ohne Böenvariable; bestehende Klimafunktionen bleiben dadurch verfügbar.
- Pro klimatologischem Kalendertag werden mittlere Tageshöchstböe und stärkste Böe der Referenzperiode 1991–2020 gespeichert.
- Die Windrose erhält nur bei vorhandenen Böendaten den Umschalter **Wind / Böen**. Im Böenmodus bleibt die Richtungsachse die tägliche Hauptwindrichtung.
- Die stärkste Böe wird für den aktuell ausgewählten Monatszeitraum sowie in den jeweiligen Monatskarten dargestellt.
- Niederschlags- und Schneefalltage werden in der Oberfläche ganzzahlig gerundet.
- Der Jahresverlaufs-Tooltip wurde auf zwei Wertezeilen mit größerer Innenfläche umgestellt, damit keine Werte über den Tooltip-Rand hinausragen.

## Datenvertrag
- Klimareferenz: 1991–2020.
- Wind-/Böeneinheit intern: kt; Anzeige folgt der gewählten MID-Windeinheit.
- Böenextreme sind modellierte Reanalysewerte und werden ausdrücklich nicht als Stationsrekorde bezeichnet.
- Klima-Cache: `mid:travel-climate:1991-2020:v7`.

## Worker
- Keine fachliche Workeränderung; nur Releaseversions-Synchronisierung.

# MID v0.9.53.6

## Hyperlokale Temperatur – stabile, schwachwindige Nächte

- Die 2-m-Temperatur erhält eine eigenständige Erkennung für thermisch entkoppelte Nächte. Aktivierung erfolgt nur, wenn Nacht, schwacher Wind, keine geschlossene Bewölkung und tatsächlich erhöhte räumliche Temperatur- bzw. Modellresidualstreuung gemeinsam vorliegen.
- Bei aktivem Nachtregime wird die räumliche Übertragung der Temperaturresiduen dynamisch von der normalen Skala auf einen engeren thermischen Nahbereich reduziert. Nahe, hinsichtlich Standorttyp und Morphologie passende Messpunkte gewinnen; weiter entfernte und thermisch unähnliche Punkte werden stärker gedämpft.
- Entfernte Flugplatz-/METAR-Temperaturen werden bei urbanen bzw. suburbanen Zielpunkten in stabilen Nächten zusätzlich gedämpft, ohne ihre hohe Eignung für Wind, Sicht und Wolken zu verändern.
- Die zulässige Residualstreuung wird im erkannten Nachtregime vorsichtig erweitert, damit reale lokale Kalt-/Warmluftunterschiede nicht fälschlich als Ausreißer entfernt werden.
- Es gibt ausdrücklich keinen festen Nachtabschlag und keine standortspezifisch hart codierte Temperaturkorrektur. Die angezeigte Temperatur ändert sich nur, soweit aktuelle Messwerte die lokale Abweichung vom hochaufgelösten Modellhintergrund tatsächlich stützen.
- Bei erhöhter nächtlicher räumlicher Streuung wird auch die ausgewiesene Temperaturunsicherheit konservativer. In der erweiterten Hyperlokal-Info erscheinen aktives Nachtregime, thermische Gewichtungsreichweite und beobachtete Stationsstreuung.
- Gegenproben schützen Tageslagen, gut durchmischte/windige Nächte, stark bewölkte Nächte und räumlich homogene Temperaturfelder vor einer unbegründeten Sonderlokalisierung.

Neue Required-Regression: `scripts/test-stable-night-hyperlocal-temperature-09536.mjs`.

Worker: keine funktionale Änderung gegenüber v0.9.53.5; nur Versionssynchronisation. Ein erneuter Cloudflare-Worker-Upload ist für diese Änderung nicht erforderlich.

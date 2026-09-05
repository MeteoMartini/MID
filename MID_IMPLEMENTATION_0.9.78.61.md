# MID 0.9.78.61 – Luftdruckachse und 7-Tage-Kurzform

## Ziel

Die Luftdruck-Y-Achse des 24-h-Wetterprofils und der Tagesdetailansicht wird visuell beruhigt: keine krummen Zwischenwerte, keine ungleichmäßigen Abstände. Zugleich bleibt der zuletzt festgelegte 7-Tage-Vertrag erhalten: sichtbare Wetterpillen sind kurz und einzeilig.

## Umsetzung

- Neue gemeinsame Achsenlogik `src/pressureAxis.ts`.
- Luftdruck-Ticks ausschließlich in ganzzahligen hPa.
- Gleichmäßiger Abstand durch einen einzigen konstanten Tick-Schritt je Achse.
- Bevorzugte meteorologische Schrittweiten: 2 / 4 / 5 / 10 hPa (bei sehr großen Spannen 20 / 25 / 50 hPa).
- Automatische Randreserve ober- und unterhalb der tatsächlich dargestellten Druckwerte.
- 24-h-Wetterprofil (`ForecastCockpit`) und klassische Tagesdetailansicht (`App`) nutzen dieselbe Achsenfunktion.
- Rohwerte/Einzeldaten bleiben weiterhin mit 0,1 hPa darstellbar; nur die Y-Achsen-Ticks werden geglättet.
- 7-Tage-Kacheln verwenden weiterhin ausschließlich kurze sichtbare Kategorien wie `Sonnig`, `Regen`, `Schauer`, `Ruhig`, `Windig`, `Warm`, `Schnee` oder `Gewitter`.
- Der vollständige Tagescharakter bleibt als Tooltip/Piktogrammkontext erhalten.

## Geänderte Kernbereiche

- `src/pressureAxis.ts`
- `src/ForecastCockpit.tsx`
- `src/App.tsx`
- `src/forecastDayLabel.ts`
- `MID_WEATHER_PICTOGRAM_STANDARD.md`
- zugehörige Regressionstests unter `scripts/`

## Worker

Keine funktionale Worker-Änderung. Der Worker wird nur auf die Releaseversion synchronisiert.

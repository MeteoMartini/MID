# MID v0.9.53.33 – astronomisch konsistente Tag-/Nachtsymbole

## Anlass

In der 90-Minuten-Prognose konnten 15-Minuten-Karten bereits ein Nacht-/Mondsymbol zeigen, obwohl der tatsächliche Sonnenuntergang am Prognoseort noch nicht erreicht war. Ursache war die Weitergabe des stündlichen Providerfeldes `is_day` bzw. des Status der nächstgelegenen Stunde auf interpolierte 15-Minuten-Zeitpunkte.

## Umsetzung

### Zentraler astronomischer Sonnenstatus

`src/astronomy.ts` stellt nun `solarDaylightWindowAt()` und `astronomicalIsDayAt()` bereit. Beide verwenden die bestehende Astronomy-Engine-Rise-/Set-Berechnung der Sonne-/Mond-Sektion. Für zeitpunktbezogene Wetterpiktogramme gilt exakt:

`Tag = Zeitpunkt >= Sonnenaufgang && Zeitpunkt < Sonnenuntergang`.

Provider-`is_day` ist nur noch ein Fallback, wenn Ort, Zeit oder astronomische Grenze nicht bestimmbar sind.

### Kanonische Forecast-Reihen

- `mapHours()` bestimmt `isDay` astronomisch und führt `sunriseEpoch`/`sunsetEpoch` am Stundenpunkt mit.
- `mapMinutely15()` bestimmt `isDay` für jeden 15-Minuten-Zeitpunkt separat und führt dieselben Grenzen mit.
- `ShortTermForecast` interpoliert den Sonnenstatus nicht mehr aus der nächstgelegenen Stunde, sondern prüft den tatsächlichen Zielzeitpunkt gegen die Sonnenstandsgrenzen.
- `finalizeForecastMinute15()` bewahrt den exakten 15-Minuten-Sonnenstatus und überschreibt ihn nicht mit der nächstgelegenen finalen Stunde.

### Weitere sichtbare Symbolpfade

- Hauptpiktogramm „Aktuelles Wetter“ verwendet die zentrale astronomische Funktion.
- Komposit/Radar erhält denselben aktuellen Sonnenstatus.
- Berg-/Höhenwetter bestimmt aktuelle und zeitpunktbezogene Piktogramme anhand der jeweiligen Höhenpunkt-Koordinaten und Zeitzone.
- Die bereits auf `point.isDay` basierenden Routen-, Wasser-, Event-/Aktivitäts- und Cockpit-Verbraucher profitieren von den kanonisch korrigierten Forecast-Reihen.

### Native Widgets / Worker

Der Widget-Endpunkt bestimmt `current.isDay` und jedes stündliche `isDay` anhand der täglichen Open-Meteo-Zeitstempel `sunrise`/`sunset` am Widget-Ort. Das rohe Provider-`is_day` dient nur als Fallback. Deshalb ist für diesen Release ein Worker-Upload erforderlich.

## App-weiter Dauervertrag

Neu ist `MID_SOLAR_SYMBOL_CONTRACT.md`. Der Vertrag ist zusätzlich in `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_SOURCE_OF_TRUTH.md` verankert.

Tagesaggregate ohne konkreten Zeitpunkt (z. B. repräsentatives Tagespiktogramm einer 7-/14-Tage-Karte) bleiben semantische Tageszusammenfassungen. Explizite Nachtaggregate bleiben Nachtzusammenfassungen. Der astronomische Vertrag gilt zwingend für alle Piktogramme mit konkretem Zeitpunkt.

## Regression

Neue Required Regression: `scripts/test-solar-symbol-contract-095333.mjs`.

Sie schützt den Astronomy-Kern, Stunden- und 15-Minuten-Mapping, 90-Minuten-/Kurzfristinterpolation, Forecast-Finalisierung, aktuelle/Komposit-/Bergwetterpfade und den nativen Widget-Worker. Die bestehende Regression `test-night-icons-astronomy-08130.mjs` wurde auf die zentrale astronomische Entscheidung aktualisiert; `test-current-solar-event-background-09538.mjs` prüft nun ebenfalls den zentralen Helper statt eine duplizierte UI-Berechnung zu verlangen.

## Prüfergebnis

448 automatisch erkannte Regressionstests. 446/446 im Professional-Archiv tatsächlich ausführbare Tests bestehen. Zwei Tests sind weiterhin nicht ausführbar, weil die schon in der Stable-Ausgangsbasis des Professional-Archivs fehlenden `.github/workflows/mid-code-revision.yml` und `.github/workflows/deploy.yml` dort nicht enthalten sind. Worker-Syntax und die geänderten TS-/TSX-Dateien wurden zusätzlich syntaktisch geprüft.

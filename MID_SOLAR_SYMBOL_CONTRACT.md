# MID – Vertrag für astronomische Tag-/Nachtsymbole

Gültig ab MID v0.9.53.33. Dieser Vertrag ist app-weit verbindlich und ergänzt `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_SOURCE_OF_TRUTH.md`.

## 1. Kanonische Tag-/Nachtgrenze

Für jedes Wetterpiktogramm, das einem konkreten Zeitpunkt zugeordnet ist, entscheidet ausschließlich die astronomische Sonnenaufgangs-/Sonnenuntergangsgrenze am tatsächlichen Prognoseort:

- **Tag:** `Zeitpunkt >= Sonnenaufgang && Zeitpunkt < Sonnenuntergang`
- **Nacht:** vor Sonnenaufgang und ab Sonnenuntergang
- Maßgeblich sind Koordinaten, Höhe und Zeitzone des jeweiligen Prognosepunktes.
- Bürgerliche, nautische oder astronomische Dämmerung verschiebt die Wetterpiktogramm-Familie nicht. Sie bleibt separat in der Sonne-/Mond-Information darstellbar.

Im Frontend ist `astronomicalIsDayAt()` aus `src/astronomy.ts` die kanonische Entscheidung. Sie verwendet dieselbe astronomische Rise-/Set-Berechnung wie die Sonne-/Mond-Sektion. `solarDaylightWindowAt()` liefert die zugehörigen minutengenauen Grenzen.

## 2. Geltungsbereich

Die Regel gilt für alle zeitpunktbezogenen Wetterdarstellungen, insbesondere:

- aktuelles Wetter und aktuelle Radar-/Kompositdarstellung,
- 15-Minuten- und **90-Minuten-Prognose**,
- 24-h-/Kurzfristprognose und stündliche Cockpit-/Profilpiktogramme,
- Routen-, Event- und Aktivitätswetter, soweit ein konkreter Zeitpunkt dargestellt wird,
- Berg-/Höhenwetter und Wassersport-Zeitpunkte,
- native MID-Widgets und Worker-Ausgaben mit zeitbezogenen Symbolen,
- alle künftigen zeitbezogenen Piktogramm-Verbraucher.

Tagesaggregate ohne konkreten Zeitpunkt (z. B. ein repräsentatives Tagespiktogramm in einer 7-/14-Tage-Karte) bleiben semantische **Tageszusammenfassungen**. Eine explizite Nachtzusammenfassung verwendet weiterhin das Nachtpiktogramm. Diese Aggregate dürfen nicht als Ersatz für die zeitpunktbezogene Sonnenstandsentscheidung verwendet werden.

## 3. Provider-Signal nur als Fallback

`is_day` eines Wetterproviders ist **nicht** die primäre sichtbare Symbolentscheidung. Es darf nur als defensiver Fallback dienen, wenn die astronomische Grenze wegen fehlender/ungültiger Orts- oder Zeitdaten nicht bestimmbar ist.

Insbesondere verboten sind:

- Übernahme eines stündlichen `is_day` auf 15-Minuten-Zwischenzeiten,
- Rundung des Sonnenuntergangs auf die volle Stunde,
- Uhrzeit-Heuristiken wie feste Tagfenster,
- voneinander abweichende Tag-/Nachtentscheidungen in einzelnen UI-Modulen,
- Überschreiben einer bereits minutengenau bestimmten 15-Minuten-Entscheidung durch die nächstgelegene Stunde.

## 4. Kurzfrist- und 15-Minuten-Vertrag

`mapHours()` und `mapMinutely15()` schreiben die astronomische Tag-/Nachtentscheidung in die kanonischen Forecast-Reihen. Zusätzlich werden die zugehörigen Sonnenaufgangs-/Sonnenuntergangs-Epochen an den Forecast-Punkten mitgeführt.

Interpolierte Kurzfristpunkte bestimmen ihren Sonnenstatus für den **Zielzeitpunkt** aus diesen Grenzen. Ein Punkt um 20:30 darf deshalb nicht allein deshalb ein Nachtsymbol erhalten, weil die nächstgelegene Stundenprognose bereits als Nacht markiert ist.

`finalizeForecastMinute15()` darf den minutengenauen Sonnenstatus nicht mit dem Status einer benachbarten Stunde überschreiben.

## 5. Native Widgets / Worker

Der Worker bestimmt den Sonnenstatus zeitbezogener Widget-Punkte anhand der täglichen `sunrise`-/`sunset`-Zeitstempel am Widget-Ort. Das Provider-`is_day` ist auch hier nur Fallback. Frontend und Widget müssen an derselben Sonnenaufgangs-/Sonnenuntergangsgrenze zwischen Tag- und Nachtpiktogramm wechseln.

## 6. Regression

Die Required Regression `scripts/test-solar-symbol-contract-095333.mjs` schützt insbesondere:

- die zentrale astronomische Frontendfunktion,
- `mapHours()` und `mapMinutely15()`,
- die 15-Minuten-/90-Minuten-Interpolation,
- die Forecast-Finalisierung,
- aktuelle/Komposit-/Bergwetter-Symbolpfade,
- die native Widget-Ausgabe im Worker,
- das Verbot einer direkten Provider-`is_day`-Entscheidung für sichtbare Zeitpunkt-Piktogramme.

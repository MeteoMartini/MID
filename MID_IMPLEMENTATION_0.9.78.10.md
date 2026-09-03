# MID Implementation v0.9.78.10

Datum: 2026-09-03

## Anlass

Die Live-Screenshots aus 53859/Mondorf zeigten einen fachlich nicht erklärbaren Widerspruch: RADOLAN meldete nur rund 0,4 mm vergangene Stunde/24 h, der direkte DWD-RV-Punkt-Nowcast bis +2 h keinen Standorttreffer und 0,00 mm, während das 24-h-Profil an der linken „ab jetzt“-Kante 4,4 mm bei 98 % auswies.

Die Analyse ergab nicht nur einen nassen Modelllauf, sondern drei systematische Fehler im Umgang mit Akkumulationszeiten und Radarpriorität.

## 1. Intervallsemantik korrigiert

Open-Meteo liefert `precipitation`, `rain`, `showers`, `snowfall` stündlich als **Summe der vorangegangenen Stunde**; der Zeitstempel ist das Intervallende. Die 15-Minuten-Felder sind analog Summen der vorangegangenen 15 Minuten. DWD MOSMIX `RR1c` ist ebenfalls die Menge der letzten Stunde.

MID hatte Radarintervalle bisher um den Modellzeitstempel zentriert (`T ± Δt/2`). Ab v0.9.78.10 gilt appweit für Akkumulationsfelder:

- Stunde T: `[T−60 min, T]`
- 15-Minuten-Wert T: `[T−15 min, T]`

Instantane Felder bleiben punktbezogen.

## 2. „Ab jetzt“-Wetterprofil

Das Profil wählte bislang bewusst die letzte Stunde bis 90 Minuten vor `now` als Startpunkt. Bei 12:33 konnte deshalb der Open-Meteo-Wert 12:00 – tatsächlich die bereits vergangene Akkumulation 11:00–12:00 – als erster Zukunftsbalken erscheinen.

Neu:

- vollständig vergangene Akkumulationsintervalle werden aus dem „ab jetzt“-Profil ausgeschlossen;
- das erste laufende Intervall wird nur mit seinem noch zukünftigen Anteil bilanziert;
- im ersten Nowcastfenster werden die bereits finalisierten 15-Minuten-Punkte aus `buildShortTermForecast()` zu Stundenblöcken zusammengeführt;
- danach folgen die finalisierten Stundenintervalle;
- Balken und PoP werden geometrisch auf `[Intervallstart, Intervallende]` gezeichnet, während T/Wind/Druck am Zeitpunkt verbleiben.

## 3. Radar-NWP-Mengenblend

Zwei Schlupflöcher wurden geschlossen:

1. Eine trockene Radarstrecke dämpfte die Modellmenge nur bis 1 mm. Gerade große NWP-Ausreißer konnten deshalb trotz trockener Radarführung unverändert bleiben.
2. Bei Echo im Umfeld, aber ohne Standorttreffer, wurde nur die PoP korrigiert; die Standortmenge blieb vollständig im NWP-Wert.

Neu:

- auch Modellmengen >1 mm werden innerhalb des direkten Radarhorizonts qualitäts- und leadtimeabhängig gedämpft;
- ein nahes Echo kann die PoP stützen, aber bei lokaler Trockenstrecke wird die nicht gestützte Standortmenge stark reduziert;
- ab dem Übergangshorizont läuft das Radargewicht weich zurück gegen NWP; es gibt kein hartes Mengen-Cap.

Synthetischer Regressionsfall für die beobachtete Größenordnung (hochwertiger Radarweg, Modell 4,4 mm/98 %):

- vollständig trockener Standortweg → ca. 0,33 mm;
- Echo nur im unmittelbaren Umfeld, kein Standorttreffer → ca. 0,69 mm; PoP bleibt als Umfeldsignal deutlich höher als die Standortmenge.

Die Zahlen sind kein pauschales Produkt-Cap, sondern Ergebnis des qualitäts-/leadtimeabhängigen Blends.

## 4. Kurzfrist-Fallback und Hyperlokal

- `ShortTermForecast` nimmt Niederschlagsmengen/PoP nicht mehr aus dem interpolierten Punktwert, sondern aus dem Akkumulationsintervall, das den Zielzeitpunkt enthält.
- Das erste 15-Minuten-Intervall wird bei Start mitten im Intervall zeitanteilig gekürzt.
- Hyperlokale Niederschlagsassimilation vergleicht die Beobachtung mit dem Stundenintervall, das `now` enthält; Temperatur/Wind/Druck bleiben beim zeitlich nächsten/interpolierten Punkt.

## 5. Resttagesaggregation

Die Resttagesmenge zählt nur Stundenintervalle, deren Ende in der Zukunft liegt. Das laufende erste Stundenintervall wird mit seinem verbleibenden Zukunftsanteil gewichtet. Tmin/Tmax bleiben von dieser Änderung unberührt.

## 6. Vertrag

Neuer verbindlicher Fachvertrag: `MID_PRECIPITATION_INTERVAL_CONTRACT.md`.

Required Regression: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`.

## Worker

Keine fachliche Workeränderung. Die Korrektur liegt in der kanonischen Browser/PWA/iOS-Finalisierung und Darstellung (`forecastFusion`, `ShortTermForecast`, `ForecastCockpit`). Der Worker wird nur versionssynchronisiert.

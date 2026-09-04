# MID · Niederschlags-Intervallvertrag

Stand: v0.9.78.46 · 04.09.2026

## Zweck

Dieser Vertrag trennt appweit **Rohdaten-/Rechenzeit**, **Zeitpunktwerte** und **sichtbare Prognoseintervalle**. Ziel ist zugleich meteorologische Korrektheit und eine für Menschen eindeutige Zeitsemantik: Wenn MID bei **08:00 Uhr** Niederschlag anzeigt, bedeutet dies im Stundenraster **08:00–09:00 Uhr** – nicht 07:00–08:00 Uhr.

Der Vertrag gilt für Niederschlagsmenge, Regen/Schauer/Schnee-Anteile, Niederschlagswahrscheinlichkeit und die daraus abgeleitete Niederschlagsphase bzw. das Niederschlagspiktogramm. Instantane Größen wie Temperatur, Taupunkt, Wind, Luftdruck und Bewölkung bleiben am sichtbaren Zeitpunkt selbst verankert.

## 1. Provider-Semantik bleibt unverändert

Open-Meteo kennzeichnet `precipitation`, `rain`, `showers` und `snowfall` als **Summe der vorangegangenen Stunde**. `precipitation_probability` ist die **Wahrscheinlichkeit der vorangegangenen Stunde**. Der Provider-Zeitstempel `T` bezeichnet für diese Felder also das **Intervallende**.

DWD MOSMIX `RR1c` ist analog der Gesamtniederschlag der **letzten 1 Stunde**. Auch hier bleibt der Roh-/Rechenkern endgestempelt.

Für einen rohen Stundenwert mit Zeitstempel `T` gilt daher:

`Rohintervall = [T − 60 min, T]`

Für einen rohen 15-Minuten-Wert:

`Rohintervall = [T − 15 min, T]`

Die frühere zentrierte Zuordnung `[T − Δt/2, T + Δt/2]` ist für Akkumulations- und Wahrscheinlichkeitsfelder verboten.

## 2. Sichtbare MID-Semantik: Slotbeginn

Eine Endnutzer-Prognose wird **vorwärts** gelesen. Der sichtbare Zeitstempel `S` ist deshalb der **Beginn** des Niederschlagsfensters:

`Sichtbarer Slot = [S, S + Δt]`

Für ein Stundenfeld übernimmt MID dazu die Roh-Niederschlagsfelder des unmittelbar folgenden endgestempelten Wertes:

`Anzeige(S) = Rohwert(S + 60 min)`

Beispiel:

- Provider `09:00 = 0,8 mm` bedeutet roh `08:00–09:00`.
- MID zeigt deshalb **08:00 · 0,8 mm** bzw. **08:00–09:00 · 0,8 mm**.
- Der Nutzer muss keinen Provider-Zeitkonventionswechsel kennen.

Dieses Prinzip entspricht der üblichen Endnutzersemantik von Stundenprognosen: ein mit 08:00 bezeichnetes Stundenwetter beschreibt die ab 08:00 beginnende Stunde.

## 3. Menge, PoP und Niederschlagsart müssen dasselbe Intervall meinen

Für jeden sichtbaren Slot werden gemeinsam verschoben bzw. zusammengefasst:

- `precipitation`
- `rain`
- `showers`
- `snowfall`
- `precipitation_probability`
- die **aus diesen Niederschlagsfeldern** abgeleitete Phase / Niederschlagsdarstellung.

Es ist verboten, beispielsweise die Menge auf `08:00–09:00` zu beziehen, die PoP aber auf `07:00–08:00` oder ein Regenpiktogramm aus einem anderen Intervall zu verwenden.

Instantane Felder bleiben dagegen bei `S`, insbesondere:

- Temperatur / gefühlte Temperatur / Taupunkt
- Wind / Windrichtung
- Luftdruck
- Gesamt-/Schichtbewölkung
- Sicht
- CAPE/LI/CIN und andere Zeitpunktdiagnosen, soweit das Quellprodukt sie instantan liefert.

Der sichtbare Wettercode darf für eine tatsächliche Niederschlagsphase durch die zum Slot gehörenden Niederschlagskomponenten plausibilisiert werden; trockene Slots behalten den instantanen Himmelszustand am Slotbeginn.

## 4. „Ab jetzt“ und 15-Minuten-Übergang

Ein Profil ab `now` darf kein vollständig vergangenes Niederschlagsintervall als Zukunft anzeigen.

- Das erste Intervall beginnt exakt bei `now`.
- Wo finalisierte 15-Minuten-Daten vorhanden sind, werden sie in **lückenlosen, nicht überlappenden** Vorwärtsintervallen verwendet.
- Danach wird bis zur nächsten vollen Stundenkante ein eventuelles Restintervall gebildet.
- Anschließend folgen volle Stundenintervalle.
- Der Übergang 15 min → 1 h darf **keinen Zeitraum doppelt zählen**.

Schneidet `now` einen sichtbaren Stunden-Slot, wird nur der noch zukünftige Anteil dieses Slots bilanziert. Das gilt für Mengen; die PoP bleibt die Eintrittswahrscheinlichkeit des ausgewiesenen Bezugsintervalls und ist **keine Regendauer**.

## 5. Appweite Darstellung

Der Slotbeginn-Vertrag gilt überall dort, wo MID einen Zeitstempel mit einer zukünftigen Niederschlagsangabe verknüpft, insbesondere:

- 90-Minuten-/Kurzfristansicht
- 24-h-Wetterprofil in 1-h- und 3-h-Auflösung
- Tagesdetails der 7-Tage-Ansicht
- 7-Tage-Kurvenübersicht und Skybar
- Tages-/Folgenacht-Piktogramme und Tagescharakter
- 14-Tage-/Ensemble-Best-Match-Fallbacks, soweit sie stündliche Best-Match-Daten verwenden
- Widgets und Exportvorschauen
- Meteogramm / erweiterte Modellansicht
- Wassersport-Stunden-/3-h-Matrix
- Berg-/Wintersport-Stundenfenster und stündliche Niederschlagssignale
- persönliche, zeitfensterbezogene Prognosehinweise.

Tageswerte aus einem echten Daily-Produkt bleiben Tageswerte. Werden Tageswerte aus Stunden abgeleitet, entscheidet der **sichtbare Slotbeginn** über die Tageszuordnung: der Rohwert `00:00` gehört als Intervall `23:00–00:00` zum Vortag; für den neuen Tag ist der Rohwert `01:00` der sichtbare Slot `00:00–01:00`.

## 6. Interne Meteorologie bleibt endgestempelt

Die UI-Normalisierung darf die physikalische Rechenbasis nicht verfälschen. Folgende Pfade arbeiten weiterhin mit den tatsächlichen Rohintervallen `[T−Δt,T]`:

- Radar-/NWP-Mengenblend und Nowcast-Verifikation
- hyperlokale Assimilation beobachteter Akkumulationen
- Rohdaten-/Providerdiagnostik
- Event-Engine, sofern sie die Intervallgrenzen explizit über Überlappung berechnet
- historische Verifikation / Wetterzwilling, sofern ein beobachtetes Referenzintervall verglichen wird.

Die Event-Engine ist deshalb kein Sonderfall gegen die Nutzerlogik: intern überlappt sie korrekt rohe Endintervalle mit dem Eventzeitraum und zeigt anschließend das daraus berechnete **explizite Start–Ende-Intervall** an.

## 7. Radar versus NWP

Im direkten Radarhorizont besitzt die beobachtete/advectierte lokale Niederschlagslage Vorrang vor einer ungestützten deterministischen Modellmenge:

- Standorttreffer: Radar und Modell werden qualitäts-/leadtimeabhängig geblendet.
- Echo nur in unmittelbarer Umgebung, aber **kein Standorttreffer**: die PoP darf erhöht bleiben, die Standortmenge wird bei belastbarer lokaler Trockenstrecke deutlich gedämpft.
- belastbar trockene Radarstrecke: auch große NWP-Mengen >1 mm dürfen den Radar-Abgleich nicht umgehen.
- jenseits des direkten Nowcastfensters läuft das Gewicht weich zurück zum NWP; kein hartes Mengen-Capping.

**Eintrittswahrscheinlichkeit** und **Menge am Standort** bleiben getrennte Größen. MID berechnet insbesondere nicht `PoP × deterministische Menge` als angezeigte Niederschlagsmenge.

## 8. Tagesaggregation

Für den laufenden Tag summiert MID nur die noch zukünftigen Anteile sichtbarer Niederschlagsintervalle. Ein von `now` angeschnittenes erstes Stundenintervall geht nur mit seinem verbleibenden Zeitanteil in die Resttagesmenge ein. Temperatur-Minima/-Maxima werden davon nicht verändert.

## 9. Fehlende Anschlussstunde

Fehlt für einen sichtbaren Slot der unmittelbar folgende Rohwert oder liegt eine unplausible Zeitlücke vor, darf MID den vorherigen Niederschlag **nicht** einfach als Zukunft umetikettieren. Die Darstellung fällt für diesen Slot niederschlagsseitig sicher auf „kein belastbarer Slotwert“/0 zurück, während die instantanen Zustandsfelder erhalten bleiben. Damit ist ein falscher Zeitpunkt schlechter als ein transparent fehlender Randwert.

## 10. Regressionen

Verbindliche Regressionen:

- `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs` – schützt die rohe endgestempelte Rechenbasis und Radar/NWP-Intervalle.
- `scripts/test-precipitation-forward-slot-presentation-097846.mjs` – schützt die vorwärts gerichtete Nutzersemantik und ihre appweite Verwendung.

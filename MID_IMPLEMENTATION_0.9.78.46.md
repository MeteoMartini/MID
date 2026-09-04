# MID v0.9.78.46 · sichtbare Niederschlagszeit am Slotbeginn

## Anlass
Die bisherigen Roh- und Nowcast-Berechnungen waren meteorologisch korrekt endgestempelt: Open-Meteo-/DWD-Stundenakkumulationen mit Zeitstempel `T` beschreiben den zurückliegenden Zeitraum `[T-1 h,T]`. In einer Endnutzer-Prognose wird ein sichtbares Stundenlabel jedoch als Beginn des folgenden Prognosefensters verstanden. Ein sichtbares `08:00` mit Regen muss deshalb `08:00–09:00` bedeuten und darf nicht erst den Zeitraum `07:00–08:00` beschreiben.

## Architektur
Die interne Meteorologie bleibt unverändert endgestempelt. Neu ist eine reine Präsentationsschicht:

- `src/precipitationIntervals.ts` ordnet stündliche Niederschlagsmenge, Regen/Schauer/Schnee, PoP und niederschlagsbestimmten Wettercode vom Rohwert `S+1 h` dem sichtbaren Slotbeginn `S` zu.
- Temperatur, Wind, Böen, Bewölkung, Feuchte, Taupunkt und Druck bleiben am tatsächlichen Zeitpunkt `S`.
- 15-Minuten-Niederschlagsfelder werden analog auf den Beginn ihres 15-Minuten-Slots normalisiert.
- Fehlt die unmittelbar folgende Rohprobe oder ist die Zeitlücke unplausibel, wird kein alter Niederschlag in die Zukunft verschoben. Der Slot fällt niederschlagsseitig fail-safe trocken/fehlend zurück; ein alter nasser Wettercode wird dabei nicht fortgeschleppt.

## Sichtbare Apppfade
Der neue Vertrag ist in die sichtbaren Prognosepfade eingebunden:

- Kurzfrist-/Nowcast- und 24-h-Wetterprofil einschließlich gekürztem ersten Intervall ab „jetzt“;
- 7-Tage-Kurvenübersicht, Tageskarten, 24-h-Skybar, Tages-/Folgenacht-Piktogramme und Tagesbeschreibung;
- klassische 7-Tage-/Tagesdetailansicht und Widget-/Exportvorschau;
- 14-Tage-/Ensemble-Best-Match-Fallback;
- Wasserwetter-Stunden-/3-h-Matrix;
- Berg-/Wintersport-Stunden-/3-h-Matrix einschließlich Niederschlagsphase, Piktogramm und Gewitterdiagnostik;
- Meteogramm-Niederschlags- und Schneefallspuren;
- Tagesaggregation für die korrekte Kalendertagszuordnung sichtbarer Stundenakkumulationen.

Bei 3-h-Matrizen bezeichnet die sichtbare Zeit jetzt den Beginn des 3-h-Blocks. Das repräsentative Wetterpiktogramm wird aus den normalisierten Einzelstunden des Blocks gewählt; Niederschlagsmenge und PoP werden aus denselben Vorwärtsslots aggregiert.

## Bewusst unverändert
Radar-/NWP-Blend, Forecast-Fusion, Assimilation, Verifikation und die Event-Engine rechnen intern weiterhin mit den originalen Intervallenden. Die Event-Engine schneidet Rohintervalle explizit gegen Eventbeginn/-ende und benötigt daher keine künstliche Zeitverschiebung.

## Regression
Neu: `scripts/test-precipitation-forward-slot-presentation-097846.mjs`. Zusätzlich wurden ältere statische Regressionen an die neue Präsentationsschicht angepasst, ohne ihre fachlichen Schutzverträge zu lockern.

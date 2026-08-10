# MID v0.9.39.1

## DWD-konforme Tages-Niederschlagswahrscheinlichkeit

Die in v0.9.39.0 eingeführte eigene Tagesdefinition `>= 0,1 mm/Tag` wurde verworfen. MID verwendet für die aus Ensemble-Mitgliedern abgeleitete Tages-Niederschlagswahrscheinlichkeit jetzt die Ereignisschwellen des Deutschen Wetterdienstes:

- primär: Wahrscheinlichkeit für **mehr als 0,2 mm** Niederschlag im Tag,
- ergänzend: Wahrscheinlichkeit für **mehr als 5,0 mm** Niederschlag im Tag.

Die Berechnung erfolgt weiterhin modellgewichtet über die verfügbaren Ensemble-Mitglieder. Beide Schwellen werden streng als `>` ausgewertet. Die primäre Wahrscheinlichkeit `> 0,2 mm` speist weiterhin alle Komponenten, die einen einzelnen Tages-PoP benötigen; die zweite Schwelle `> 5,0 mm` wird ergänzend in Tagesdarstellungen und Tooltips ausgewiesen.

Der Best-Match-Wert `precipitation_probability_max` bleibt nur dann als Fallback erhalten, wenn keine belastbare Ensembleauswertung verfügbar ist. Dieser Fallback wird ausdrücklich nicht als DWD-schwellenkalibriert bezeichnet.

Die Prognosegüte-/Kalibrierungslogik bewertet das primäre PoP-Ereignis ebenfalls gegen `> 0,2 mm`, damit Vorhersage und Verifikation dasselbe Ereignis verwenden. Der Ensemble-Cache wurde auf v10 angehoben, damit ältere `>= 0,1 mm`-Wahrscheinlichkeiten nicht wiederverwendet werden.

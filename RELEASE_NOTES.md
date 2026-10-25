# MID v0.9.85.327 · Schnellere Stundenfilterung unter „Aktuell“

Die Zeitachse der laufenden 12-Stunden-Übersicht erzeugt ihren Zeitzonen-Formatter nur einmal pro Berechnung statt für jede einzelne Stunde. Dadurch entfällt unnötige Renderarbeit, ohne Prognosewerte, fehlende Daten, die laufende Niederschlagsstunde oder Sommer-/Winterzeitwechsel zu ändern. Der Sonnenzeit-Timer-Fix aus v0.9.85.326 bleibt erhalten.

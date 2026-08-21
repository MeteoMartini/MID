# MID v0.9.61.0 – Wetterzwilling und Prognosefusion

## Ergebnis

MID erzeugt die operative Vorhersage weiterhin nur über die kanonische Kette `displayHours` und `displayMinutes15`. Modellfusion, lokale Wetterzwilling-Korrektur, meteorologische Finalisierung und Hyperlokal-/Nowcast-Korrektur bilden aufeinanderfolgende Stufen; App-Module erhalten keine konkurrierenden Teilprognosen.

## Gewichtungsvertrag

- Das serverseitige Modellbudget berücksichtigt Prognosehorizont, Wetterlage, regionale Eignung, Auflösung, Laufaktualität und Datenlatenz.
- Rapid-Cycle-Varianten bleiben fachlich nutzbar, teilen aber mit ihrer Unabhängigkeitsgruppe genau ein Stimmenbudget. Mehrere Läufe oder Varianten derselben Modellfamilie erzeugen daher kein Doppelgewicht.
- Die am Gerät gemessene tatsächliche Prognosegüte bleibt eine lokale, nachgelagerte Wetterzwilling-Stufe. Persönliche Verifikationshistorie wird weder an den Worker übertragen noch Teil eines gemeinsam gecachten Worker-Ergebnisses.
- Beobachtung, Radar, Blitz und Nowcast korrigieren die bereits fusionierte Vorhersage anschließend über die vorhandenen kanonischen Finalisierer. Tageswerte werden wieder aus dem fertigen Stundenvertrag abgeglichen.

## Diagnose

Die erweiterte Diagnose weist pro Vorhersagetag Wetterlage, Horizont, Unabhängigkeitsgruppe, Gruppenbudget, normiertes Gewicht und die einzelnen Faktoren aus. Im erweiterten Modus zeigt die App zusätzlich die lokalen Skill-Gewichte sowie die angewandte Nowcast-Stufe. Damit bleibt nachvollziehbar, welche Quelle an welcher Stelle wirkt, ohne eine zweite sichtbare Prognose zu erzeugen.

## Worker

Dieses Release ändert serverseitige Fachlogik. Der Worker ist deshalb für v0.9.61.0 und die nachfolgenden Sammelstände zwingend gemeinsam mit der App zu aktualisieren.

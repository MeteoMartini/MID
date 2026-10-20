# MID v0.9.85.301

- Extremwetterhinweise: Nach dem Abbruch eines direkten Abrufs werden keine unnötigen Folgeabfragen mehr gestartet. Parallel laufende, nicht abgebrochene Abrufe bleiben unabhängig.
- Fachliche Berechnung, vorhandene Niederschlags-/Warnlogik und Modellwerte bleiben unverändert. Fehlerfälle und bereits abgebrochene Abrufe werden separat getestet.

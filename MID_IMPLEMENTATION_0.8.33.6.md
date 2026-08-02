# MID v0.8.33.6

- Tagesniederschlag und maximale Niederschlagswahrscheinlichkeit werden mit der final dargestellten Stundenreihe abgeglichen.
- Im unmittelbaren Sechs-Stunden-Nowcast bleiben radarbereinigte Stunden vollständig maßgeblich und können ältere Tageswerte absenken.
- Für spätere Tage bilden die finalen Stundenwerte eine Untergrenze: Wird beispielsweise um 23:00 Uhr 0,1 mm dargestellt, kann die Tageskarte nicht mehr 0,0 mm anzeigen.
- Höhere adaptive Tageswerte bleiben erhalten, falls die verfügbare Stundenreihe unvollständig oder niedriger ist.

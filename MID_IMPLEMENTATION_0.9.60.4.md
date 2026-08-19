# MID v0.9.60.4 – Zeitpfeil Kompositbild (Sichtbarkeit + Zeitlogik)

- Der Zeitpfeil bezieht seine Zeitmarken nun auf den tatsächlich dargestellten Komposit-/Filmzeitpunkt (`targetMs`) und nicht mehr auf einen separaten Analysezeitstempel.
- Standardanzeige der Zeitlabels ist jetzt relativ (`+15m`, `+30m`, `+1h`), damit die Angaben im mobilen Kompositbild direkt nachvollziehbar sind.
- Die Pfeillänge wird zeitbasiert aus der Verlagerungsgeschwindigkeit bestimmt und auf sinnvolle Horizonte begrenzt, damit bei langsamen Zuggeschwindigkeiten keine unplausiblen Mehrstundenzeiten mehr entstehen.
- Die sichtbare Zeitpfeil-Achse, Tick-Marken und Label-Verbinder wurden kontraststärker gestaltet; die Labels sitzen nun an dedizierten Label-Ankern mit echter Verbindungsstrecke zur Pfeilachse.
- Die bestehenden Verträge zur Schwerpunktströmung, Zielspitze am Ort und zum alleinigen Zeitpfeil-Schalter bleiben erhalten.

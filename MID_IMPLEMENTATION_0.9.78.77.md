# MID v0.9.78.77 — DWD-Bildpunkt & Konfidenzsignal

- DWD „Wolken + Niederschlagsart“: Wolkensignal nicht mehr aus dem bloßen Mittelwert eines 5×5-Farbfelds abgeleitet. Die Worker-Auswertung nutzt ein konservatives 9×9-Originalpixelumfeld; nur räumlich dominante, ausreichend helle und nahezu neutrale Satellitenpixel gelten als Wolkensignal. Farbiger Karten-/Landuntergrund, Gewässer, Grenzen und einzelne Beschriftungspixel erzeugen keinen Wolkennachweis.
- Die Niederschlagsklassifikation bleibt an der offiziellen DWD-Farbklasse und am kleineren 5×5-Originalpixelumfeld gebunden; Zoomen verändert weiterhin ausschließlich die Ansicht, nicht den ausgewerteten Originalpunkt.
- Die Bildpunktzeile benennt die abgeleitete Komponente als „Satellit“ und gibt bei nicht belastbarer Farbtrennung „kein eindeutiges Wolkensignal“ aus, statt einen Wolkenzustand zu behaupten.
- Konfidenz-Signalbalken: fünf statt vier Stufen, kontinuierliche Score-Farbinterpolation von Grün über Gelb/Orange zu Rot und kein harter Farb-/Balkensprung an der bisherigen 72er-Grenze.
- Zahl und Empfangsbalken erhalten getrennten Mindestplatz und größeren Innenabstand; kompakte 14-Tage-Karten behalten eine responsive, aber nicht gequetschte Variante.

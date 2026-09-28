# MID v0.9.85.115

- Der kurzfristige Temperaturverlauf übernimmt lokale Messkorrekturen jetzt zeitgenau und ohne künstliche Gegenbewegung durch ein zu schnelles Ausblenden des Temperatur-Bias.
- Dadurch wird insbesondere ein unplausibler Stundenanstieg vermieden, der allein aus der Rückführung einer starken hyperlokalen Temperaturkorrektur entstehen konnte.
- Die +12-h-Temperaturkurve bleibt an dieselbe kanonische, hyperlokal finalisierte Stundenreihe gebunden; es gibt keine separate grafische Glättung.
- Im Berg-/Wintersportbereich zeigt die horizontale Stundenprognose jetzt die nächsten 12 statt 24 Stunden. Die 7-Tage-Ansicht und eigenständige 24-h-Schneeangaben bleiben erhalten.

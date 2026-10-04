# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

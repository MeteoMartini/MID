# MID v0.9.85.161

MID-C15: Nachtstunden der 7d-Kurve sind wieder deutlich sichtbar, auch im Widget und PNG. Gemeinsame opake Nachtfarbe mit einmaliger Deckkraft statt unbeabsichtigter doppelter Transparenz; astronomische Grenzen und sanfte Übergänge bleiben erhalten. Dieselbe Korrektur erreicht die übrigen SVG-Nachtflächen.

Der Wetterstreifen im 12h-Diagramm unter Aktuell verwendet die volle SVG-Höhe von 16 px, wie die 90-Minuten-Ansicht. Die vier Bedeckungsstufen werden nicht mehr vertikal gestaucht; gemeinsame Zeitachse, Niederschlagszustände und Quadrateinstellung bleiben erhalten.

# MID v0.9.85.160

MID-C15: ECMWF-Temperaturfarben sind in Einstellungen wieder optional für 7d-Tageswerte und die stündliche 7d-Kurve verfügbar; Standard bleibt die 24h-Parameterpalette. Widget und PNG verwenden denselben Renderer mit ihrem vorhandenen Farbschalter. Eindeutige Gradienten-IDs verhindern Wechselwirkungen zwischen gleichzeitig sichtbaren Diagrammen.

24h-Profil und aufgeklapptes 7d-Tagesdetail verwenden einen gemeinsamen Linienvertrag für Farbe, Stärke, Strichmuster, Deckkraft und Rundung aller sieben Parameter. Der ursprüngliche 24h-Goldton für UTCI ist auch im Tagesdetail wiederhergestellt. Coverage-Pilot installiert Vite, Vitest und Coverage gemeinsam in einem isolierten Verzeichnis, ohne MID-Lockfile oder Release-Gates zu verändern.

# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

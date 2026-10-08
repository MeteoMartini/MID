# MID-C21 · 0.9.85.197

Basis main = mid-stable = 55bde6e4ed20127a32403c54546379fb6e86943c (.196). SHA-gebundener Replit-Handoff 6e4d3fc39ace83ae17c3b5a71e6ed9c06a902030, Tree ca4fbd13f4b6337262ee854b992ec6b1cad5f847, grün in Run 37694186641. Replit lieferte lokale Vorschläge ohne belastbaren ursprünglichen Git-Commit; ChatGPT rekonstruierte und verifizierte die neun UI-Dateien auf Stable. Zusätzliche UI-QA-Korrektur erhöht nur das innere Browserlimit 480 auf 900 Sekunden bei unveränderten 24 Fällen.

Current verwendet einen scoped kanonischen CSS-Layer und echte DOM-Reihenfolge Skybar → gemeinsame Temperaturkurve → Zeitachse. UTCI, Werte, Messwertpriorität und Einheiten unverändert. Sichtweite weiterhin über Mehr. Alte .169-Cascade-Golden-Deklarationen bleiben separat geschützt.

OSM country/admin2 und region/admin4 disjunkt; maritime Polygone ausgeschlossen. Entfernte Boundary-Fallback- und Natural-Earth-Canvas-Doppelgeografie; fünf persistente Touch-Optionen. Untere Vektorkarte zeichnet nur Land/Wasserflächen.

Immutable RUC-Pages-Pfad wie DWD-Niederschlagssummen: ecCodes prüft alle sieben GRIB-Komponenten (IFS acht inklusive q/T700), Lauf/Termin/Level/Einheit/regular-grid. Downloads parallel, ecCodes durch Lock geschützt. ICON-D2 0,02°, ICON-EU 0,0625°, veröffentlichte GFS/IFS 0,25°-Raster. Neun vollständige Termine je Modell, keine Mischung von Läufen; fehlende Quellen explizit nicht verfügbar.

Native Contourpy-Konturen aus vollständigen maskierten Rastern, moderate 0,65-Rasterzellen-Glättung, GH500 4 dam schwarz, MSL 4 hPa weiß, RH700 ab 60% blau gestrichelt; echte U/V300-Pfeile. Bitmap-Missing null/transparent. Bilineares Mercator-Theta-E-Rendering mit höherer Pixelauflösung behauptet keine höhere Modellauflösung.

Bolton-1980-LCL korrigiert im gemeinsamen Theta-E-Erzeuger. Vier unabhängige MetPy-1.7.1-Referenzen: maximal 0,3 K Toleranz für unterschiedliche Bolton-/Ambaum-Sättigungsdampfdruckformeln. Alte inkonsistente Formel wich bei warm-feuchter Luft um mehrere K ab. Keine Änderung am operativen Punkt-Forecast.

Frontend prüft Indexdigest, Bytes/SHA, sichere Dateinamen, vollständige aktuelle Termine, Einheiten, native Achsen, Masken, Konturlevel und Windvektoren. Höhenlinien allein ohne Theta-E-Probe. Gleiche bereits SHA-geprüfte immutable Zyklen können wiederverwendet werden; neue Zyklen werden zuerst gesucht. Budget unverändert 900 MB.

iPad: transienter gemeinsamer Drawer-Hook startet geschlossen, schließt bei pagehide/pageshow/visibilitychange und überschreibt keine dauerhafte Inhaltswahl. Alte More-Speicherung behält gültige Inhaltssektion; ungültige fällt auf Current zurück. Deep Links priorisiert.

Prüfung: 28 echte Current-Browserfälle, vier wiederholte iPad-Chromium-Touchansichten, vollständige 24-Fall-Kartenmatrix und neue wissenschaftliche ecCodes-/Kontur-/MetPy-/Manifest-Regressionen. Physisches iPad/Safari nicht geprüft. Alle bestehenden Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben verbindlich.

## Verfügbarkeit und Wiederherstellung

Der grüne Replit-Handoff liegt auf GitHub. Noch untransportierte Zusatzarbeiten gingen bei einem Scratch-Reset verloren und wurden erneut auf der verifizierten Basis implementiert sowie geprüft; frühere lokale Prüflogs ersetzen die wiederholten Prüfungen nicht. Der Integrationscheckpoint ist auf chatgpt/v0.9.85.197-c21-weather-maps gesichert. Produktive Verfügbarkeit wird ausschließlich aus dem veröffentlichten immutable RUC-Katalog festgestellt. Keine lokalen synthetischen Testdaten werden veröffentlicht.

## Geänderte Verträge

Quelltext-Regressionen lesen die ausgelagerte gemeinsame Kartengeografie statt früherem Inline-Markup. Der bewusst entfernte doppelte Boundary-Fallback wird nun ausgeschlossen; numerische/String-admin_level und maritime Filter bleiben geschützt. Die bisherige WMS-Dreikomponenten-Prüfung wird durch native fünfteilige Identitäts-/Zeit-/Einheiten-/Maskenprüfungen ersetzt. Die alte More-Autostart-Assertion wird durch die ausdrücklich gewünschte getrennte Menü-/Inhaltspersistenz ersetzt. Alle übrigen Assertions bleiben erhalten.

# MID v0.9.85.133 · Konsistenzanalyse und Implementierung

Stable v0.9.85.132 zeigte vier konkrete Fehlerpfade: fehlende DWD-RV-Frames wurden visuell wie 0 mm behandelt; der Fortsetzungstext betrachtete nur die erste Niederschlagsphase innerhalb sechs Stunden; Sprühregen-Plausibilität bewertete Mengen ohne Intervallnormalisierung; der Pollenstatus verwendete den ersten WFS-Tag als „Heute“. Zusätzlich konnte ein Forecast-Horizon-Ereignis den gespeicherten Hauptbereich auf Vorhersage zurücksetzen.

v0.9.85.133 trennt technische Radar-Datenlücken von meteorologischer Trockenheit, nutzt für Fortsetzungstexte die kanonische 24-h-Niederschlagszeitreihe, bewertet Niederschlagsintensität mit der tatsächlichen Intervalllänge, filtert Pollen ab dem lokalen heutigen Datum und macht den Primärbereich beim Neustart autoritativ.

Die Pollen-Informationsarchitektur ist ausdrücklich nicht Bestandteil dieses funktionalen Fixes und wird erst nach kontrollierter Replit-Prüfung verändert.

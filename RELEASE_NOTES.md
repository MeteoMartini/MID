# MID v0.9.85.318

- Zeitumstellung: Stunden- und Viertelstundenprognosen behalten ihre richtigen absoluten Zeitpunkte. Die doppelte Herbststunde bleibt eindeutig; im Frühjahr wird keine zusätzliche Stunde erzeugt.
- Tageswerte: Unterschiedliche Anbieter- und Ortszeitgrenzen werden erkannt. Vollständig abgedeckte lokale 23-/25-Stunden-Tage werden aus den Stunden berechnet; unvollständige Zeiträume erhalten keine falsche 24-Stunden-Summe.
- Ensemble- und Eventauswertungen verwenden dieselben Zeitgrenzen. Alte abgeleitete Ensemble-Zwischenspeicher werden erneuert; Rohdaten mit verlässlichem UTC-Offset bleiben verwendbar.

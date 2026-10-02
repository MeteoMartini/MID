# MID v0.9.85.143

- Kurzfrist-Hinweis entfernt; Unsicherheitsbänder deutlich kompakter.
- Echte Ensemble-Mediane statt gemischter Einzelwert-/Mittelwertmarker; Böen statt Mittelwind, Tmax/Tmin getrennt gefärbt.
- Stündliches Temperatur-P25–P75-Band nur mit verfügbaren echten Quantilen; künstlicher Halo entfällt. Niederschlagsnullwert als 0.

# MID v0.9.85.142

- Vollständige neue ICON-D2-Kartenraster verlustfrei verdichtet: deutlich weniger Speicher und Downloadvolumen bei unveränderten Werten und unveränderter Auflösung.
- Das kostenlose 900-MB-Datenbudget bleibt verbindlich. Größen- und SHA256-Prüfung erfolgen auch für komprimierte Felder; ältere Safari/WebViews erhalten einen kompatiblen Decoder.
- Enthält die Wetterkarten-, Messsummen- und parameterbezogenen Prognosespannen aus .141.

# MID v0.9.85.141

- Wetterkarten: gefallener Niederschlag aus DWD RADOLAN RW für vollständige 1-/6-/12-/24-/48-h-Fenster; fehlende Messzellen bleiben grau und unbekannt.
- Direkte ICON-D2-Raster für Temperatur, Wind, Böen, Bewölkung, Druck, ThetaE, Wettercode und einstündlichen Niederschlag: bestätigte Modelltermine, Favoritenwerte, PNG-/SVG-Export.
- Parameterweise P10–P90-/P25–P75-Bänder in 7-/14-Tage-Prognosen, mit vergleichbaren Skalen und ausgewählter Windeinheit. Keine erfundenen Stunden- oder Parameterintervalle.
- Niederschlagsnull kompakt als 0; kleine positive Mengen bleiben als Spurenwerte erkennbar.
- Drei nicht mehr im DWD-WMS-Katalog verfügbare Wettercodekarten werden nicht mehr angeboten. Andere regionale/globale WMS-Karten bleiben erhalten.

# MID v0.9.85.140

- Niederschlagsphasen kompakt mit Zeitspannen, Radar und Modellfortsetzung klar gekennzeichnet.
- Radar-Nowcast: kompakte Summe, getrennte Hinweise und Achsen; gegen geerbte Pillenregeln abgesichert.
- Bright-Sky-RV-Import korrigiert: aktuelle Quellkennung wird erkannt statt verworfen.
- Vollständige native DWD-RV-Fünfminutenreihen über Bright Sky bleiben unabhängig vom WMS-Diagnoseweg erhalten. Zusätzliche Beobachtungen dienen bei diesen Reihen als Kontrollabgleich.

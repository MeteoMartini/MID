# MID v0.9.64.2 – mobile 14-Tage-Übersicht nach Geräteausrichtung

## Hochformat

- Die 14-Tage-Übersicht zeigt alle Prognosetage als 14 Zeilen ohne horizontales Scrollen.
- Jede Zeile enthält weiterhin Datum, Wetterpiktogramm, Wetterbeschreibung, farbige Wetterregime, Minimum/Maximum, Abweichung zum Klimamittel, Niederschlagsmenge und -wahrscheinlichkeit sowie Windrichtung, Wind und Böen.
- Konsistenz und Modellzahl stehen unmittelbar in jeder Zeile. Damit gehen die Inhalte der bisherigen großen Tages-Zusammenfassung nicht verloren.
- Der Prognose-Kompass bleibt mit belastbarem Zeitraum, wahrscheinlichster Entwicklung und zunehmender Unsicherheit vollständig erhalten, wird aber in drei platzsparende Informationszeilen überführt.

## Querformat

- Die 14 Tage werden als vollständiges 7 × 2-Raster dargestellt.
- Beide Reihen verwenden identische Kartenstruktur und Werteanordnung; es gibt keinen horizontalen Scrollcontainer und keine abgeschnittenen Fachwerte.
- Die farbigen Klassifikationen, etwa „Heiß“, „Ruhig“, „Sonnig“, „Wind“, „Schauer“ und „Regen“, bleiben unmittelbar erkennbar.

## Auswahl und Analyse

- Ein Tag kann weiterhin als Analysefokus gewählt werden; die aktive Karte erhält die bestehende Hervorhebung.
- Auf mobilen Ansichten entfällt nur der redundante große Fokusblock. Alle darin enthaltenen Werte sind direkt in jeder Tageskarte integriert.
- Die Ensemble-Analyse und ihre Modell-/Bandbreitenansichten bleiben unverändert aufklappbar.

## Daten- und Worker-Vertrag

- Prognosefusion, Ensembleberechnung, Datenquellen, Schwellen und Cache-Verträge bleiben unverändert.
- Ein funktionales Worker-Update ist nicht erforderlich. Der Worker wird ausschließlich auf die gemeinsame Releasekennung v0.9.64.2 synchronisiert.

# MID v0.9.85.407 – Datenlücken und Favoriten zuverlässig darstellen

- Niederschlagsrisiko in „Aktuell“ ist bei fehlenden oder nicht auswertbaren Prognosewerten ausdrücklich unbekannt (–), statt fälschlich 0 % oder trocken zu melden. Echte 0-%-Werte bleiben erhalten.
- Individuelle Favoriten-Wetterregeln ignorieren ungültige oder fehlende Wahrscheinlichkeiten, Böen und Temperaturen; ausdrücklich ausgeschaltete Regeln bleiben deaktiviert.
- Die Wetter-Eckdaten der Eventplanung und gespeicherte Wasserprofile unterscheiden fehlende Angaben von echten Nullwerten; fehlende UV-Index-Werte erzeugen keine künstliche UVI-0-Aussage.
- Der Menübereich „Mehr“ erhält eine semantische Überschriftenstruktur für assistive Technologien, ohne Navigation oder bestehende Interaktionen zu verändern.

**Unverändert:** Amtliche DWD-Warnungen, Modellwerte und -gewichtung, Radar-/RUC-Daten, ICON-D2-Vollgebietsstatus und gespeicherte Favoriten. Vollständige Geräte-, Screenreader- und Vollgebietsprüfungen bleiben offen.

# MID v0.9.51.0 – Parameterbezogene Hyperlokal-Analyse

- Parameterabhängige harte Alters-/Distanz-/Höhengrenzen statt einer pauschalen Stationsfrische.
- Temperaturwerte ab 75 min bzw. 45 km sind keine hyperlokalen Beobachtungsanker mehr; Niederschlag, Sicht und Böen sind noch strenger, QFF bleibt bewusst toleranter.
- Feldbezogene Zeitstempel und Datenintervalle verhindern, dass ein neuer Wert eines Parameters einen alten Wert eines anderen Parameters künstlich verjüngt.
- Restfeldkorrektur ohne früheren festen 45-%-Mindestanteil; schwache Evidenz geht gegen null.
- Regionaler hochaufgelöster Modellhintergrund nach Land vor Best Match; bestehende Modellverfügbarkeitsregeln bleiben erhalten.
- Stadt/Land/Suburban-Klassifikation verfeinert und generischen PPL-Urban-Fehler entfernt; stärkere feldabhängige Standortdämpfung.
- DWD/GeoSphere 10-min-Metadaten durchgängig transportiert; MeteoSwiss/KNMI-Adapter als 10-min klassifiziert; SMHI nutzt verfügbare Minutenparameter für Temperatur, Feuchte, Druck, Windrichtung/-geschwindigkeit und Sicht sowie 5-min-Bewölkung.
- Aktuelles Wetter, Kurzfrist und Event-Temperaturanker verwenden die identische feldbezogene Verwendbarkeitsprüfung.
- Verbindlicher `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` plus Required-Regression.

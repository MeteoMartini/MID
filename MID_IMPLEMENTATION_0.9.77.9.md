# MID Implementation v0.9.77.9

## Witterungstrend Tag 15–46
- **Temperatur ist der Standardparameter**, wenn noch keine gültige letzte Auswahl gespeichert ist.
- Die zuletzt ausgewählte Trend-Metrik bleibt unter `mid:subseasonal-trend:metric` persistent.
- **Windböen wurden vollständig entfernt**, weil die verwendeten Subseasonal-Endpunkte dafür keinen verlässlichen numerischen Schlüssel liefern. Keine Böen-Schaltfläche, -Kurve, -Legende, -Vergleichszeile oder Tooltip-Zeile bleibt zurück.
- ECMWF wird explizit als **EC46 / 51 Member / 46 Tage** geladen; NOAA als **GEFS 0,5° (`ncep_gefs05`) / 31 Member / 35 Tage**.
- Die Klimareferenz wurde appweit mit dem 14-Tage-Temperaturdiagramm vereinheitlicht: **ERA5-Land 1991–2020 am Ort**, kalendergleich für Tmax, Tmin, Wochen-Niederschlag, mittleren MSL-Luftdruck, Bewölkung und Wind aggregiert.
- P10–P90 und P25–P75 sind sowohl in Legende als auch Fläche klar getrennt. Das innere P25–P75-Band ist dunkler/kräftiger als P10–P90.
- Im kombinierten Temperaturdiagramm besitzt Tmax einen roten und Tmin einen blauen Unsicherheitsbereich; die bisherige CSS-Übersteuerung auf rot ist entfernt.
- Punkt-Tooltips wurden lesbarer und strukturieren Mittel, P25–P75, P10–P90 sowie Klimamittel zeilenweise.

## Appweiter Parameter-Farbvertrag
Die zentralen CSS-Variablen bleiben die einzige generische Farbquelle für wiederkehrende Wetterparameter:
- Temperatur/Tmax: rot
- Tmin: blau
- Niederschlag: blau
- Luftdruck: violett
- Wind: grün
- Böen: olivgrün
- Bewölkung: graublau
- Schnee: hellblau

Nachgezogen wurden insbesondere:
- 14-Tage-Temperatur- und Wind-Ensemblelegenden sowie Kurven/Bänder,
- 14-Tage-Niederschlagsdiagramm,
- Meteogramm-Linien für Temperatur, 850-hPa-Temperatur, Luftdruck, Wind, Böen und generischen Niederschlag,
- Prognose-Cockpit: Temperatur-, Niederschlags- und Wind/Böen-Minis/Tracks.

Warnstufen, Niederschlagsphasen, Gewitter-, Eis-/Hagel- und Anomaliefarben bleiben bewusst eigenständig, weil sie Gefahren-/Phasenintensität statt Parameteridentität kodieren.

## Extremwetter-Ausblick
- Mehr Abstand unter der eingeklappten/ausgeklappten Modul-Shell zum nachfolgenden Prognose-Cockpit.
- Mobil etwas größerer Abstand gemäß dem bestehenden Karten-/Modulrhythmus.

## Mitgeführte vorherige, noch nicht produktiv abgeschlossene Fachänderungen
Der Arbeitsbaum behält die bereits vorbereiteten Prüfungen/Verbesserungen für Berg-/Wasserwetter und die Schneefallgrenzen-Ensembleansicht bei; sie werden nicht zurückgerollt.

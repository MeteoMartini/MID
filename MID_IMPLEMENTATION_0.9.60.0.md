# MID v0.9.60.1 – Model Skill & Twin Consistency

Funktionsneutrale Konsolidierung der Modellbewertung und des Wetterzwillings mit fachlicher Verbesserung der Gewichtung:

- abgeleitete MID-Fusionsprodukte sind ausschließlich Kontroll-/Diagnoseprodukte und keine eigenständigen Lernmodelle;
- tägliche Niederschlagswahrscheinlichkeit verwendet einen einheitlichen Tagesereignis-Vertrag, während Stunden-Maxima separat bleiben;
- stabile Modellarchitekturen und Unabhängigkeitsgruppen werden in Ensemble, Forecast-Fusion und Wetterzwilling konsistent behandelt;
- Architekturgeschwister teilen ein Provider-/Unabhängigkeitsgruppenbudget;
- Vertrauens-, Kalibrierungs- und Validierungsstärke basiert auf eindeutigen Zieltagen statt mehrfach gezählten Vorlaufzeiten;
- tatsächliche Modelllauf-Frische fließt in Ensemble und deterministische Fusion ein;
- MeteoSwiss CH1 und CH2 werden nach ihrer jeweiligen Reichweite getrennt behandelt;
- Auflösungs-/Updateprior werden horizons- und parameterspezifisch begrenzt;
- Mean/Spread liefert Unsicherheitsinformation, wird aber nicht als native Member-PoP behandelt.

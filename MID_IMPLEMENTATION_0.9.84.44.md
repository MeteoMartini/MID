# MID v0.9.84.44 – 14d-Ensemble-Hinweise

## Ziel
Den bereits etablierten probabilistischen Hinweisvertrag mit räumlicher Umfeldbetrachtung und fachlich sinnvollen Rundungen auf das 14-Tage-Ensemble-Meteogramm übertragen, ohne Scheingenauigkeit zu erzeugen.

## Umsetzung
- Kurzfristig verfügbare 12-km-Umfeldanalyse wird zusätzlich zu den 14d-Ensemblequantilen genutzt.
- Böen: P90; Hitze: Tmax P90; Frost: Tmin P10.
- Starkregen: räumliche P90-Stundenmenge ausschließlich bei echter stündlicher Umfeldanalyse.
- Dauerregen: P90-Tagesmenge als passender Ensemblekontext.
- Niederschlagswahrscheinlichkeit in 5-%-Schritten.
- Schnee, Glätte, Nebel und Gewitter erhalten keine erfundenen Langfrist-Umfeldzahlen, solange Phase/Sicht/Konvektion im 14d-Datensatz nicht belastbar räumlich aufgelöst sind.
- Warnstufen werden nicht aus dem Kontextwert hochgestuft.

## Rundungsvertrag
- Wind/Böen: aufwärts auf 5 km/h, 5 kt, 5 mph bzw. 2 m/s.
- Temperatur: ganze °C, bei Hitze aufwärts / bei Frost abwärts.
- Niederschlag: aufwärts auf ganze mm.
- Wahrscheinlichkeit: nächster 5-%-Schritt.

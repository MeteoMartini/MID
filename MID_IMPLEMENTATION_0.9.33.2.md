# MID v0.9.33.2

## Langfrist · Gitterpunkt-/Ensemble-Ausbau

- Open-Meteo Seasonal wird mit `cell_selection=nearest` abgefragt.
- Der vom API tatsächlich gelieferte ECMWF-Gitterpunkt und die Distanz zum gewählten Ort werden ausgewiesen.
- 51 Ensemble-Mitglieder werden pro Monat zu Mittelwert sowie 10./90. Perzentil ausgewertet.
- Temperaturdiagramm: abgestuft blau (kälter) bis rot (wärmer).
- Niederschlagsdiagramm: abgestuft braun (trockener) bis türkis/blau (feuchter).
- C3S-Modellregister ist als ensemblefähige 1°-Gitterpunktbasis für ECMWF, Met Office, Météo-France, DWD, CMCC, NCEP, JMA, ECCC und BOM vorbereitet.
- Mehrere numerisch verfügbare saisonale Punktmodelle können ohne UI-Umbau parallel auswählbar dargestellt werden.

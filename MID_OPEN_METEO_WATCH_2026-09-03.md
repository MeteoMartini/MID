# MID · Open-Meteo-Watch 2026-09-03

## Zweck

Dieser Vertrag konsolidiert den heutigen separaten Wartungszweig „Open-Meteo MID Watch“ mit dem parallel entstandenen MID-Niederschlagsfusionszweig. Beide Zweige waren zwischenzeitlich als `v0.9.78.6` bezeichnet. Ab `v0.9.78.7` ist nur noch der zusammengeführte Stand verbindlich.

## Offizielles Upstream-Fenster

Geprüft wurde der offizielle Open-Meteo-Quellstand zwischen dem vorherigen Watchfenster und 2026-09-03 08:10 MESZ. Für MID relevant bzw. prüfpflichtig waren insbesondere:

- `1ee749460f68e83f02485ab79f328c5a4bccd504` — Korrekturen an Forecast-/FlatBuffers-Metadaten:
  - `dew_point_2m_mean` wird als Taupunkt statt Temperatur abgebildet,
  - `surface_temperature_anomaly_gt0` wird als Oberflächentemperatur statt Oberflächendruck abgebildet,
  - `precipitation_sot90` verwendet tatsächlich SOT90 statt SOT10,
  - EC46 `temperature_2m_sot10`/`temperature_2m_sot90` und `precipitation_efi` sind dimensionslos,
  - `wave_peak_period` bleibt ein eigenständiger Marineparameter,
  - Soil-Moisture-Index-Metadaten sind von volumetrischer Bodenfeuchte getrennt.
- `833fbb57525834bd577894bcbcfc1342c209cf71` — GloFAS nutzt die tatsächliche Ensemblegröße der Domain statt einer fest verdrahteten 51 und berechnet Median/P25/P75 mit linear interpolierten Perzentilen über `(n-1)*p`.
- `05176417d08df50de7c715de40e325a567550f4c` — Copernicus-DEM-Korrektur für ganzzahlige südliche Breiten.
- `e3e55ba86a69ffa4eae2ec5358833cac32a91e2d` — Météo-France-Downloader behandelt unbekannte GRIB-Editionen als Fehler statt Server-Fatalabbruch.
- S3-/Dateisystem-/Health-Änderungen im selben Fenster sind Open-Meteo-serverintern; eine kurzzeitig eingeführte Ein-Server-Ausnahme wurde upstream anschließend wieder zurückgenommen. MID repliziert diese Serverlogik nicht clientseitig.

## Auswirkung auf MID

### EC46 / Witterungstrend

MID fordert für den operativen Tag-15–46-Witterungstrend `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `pressure_msl_mean`, `cloud_cover_mean` und `wind_speed_10m_mean` an. Die upstream korrigierten EFI-/SOT-/Taupunkt-/Surface-Temperature-Felder werden dort derzeit nicht als operative Werte interpretiert. Deshalb darf aus der Upstream-Korrektur keine künstliche Einheitenkonvertierung in MID entstehen.

Der saisonale Monatsvergleich nutzt `temperature_2m_mean`, `temperature_2m_anomaly`, `precipitation_mean` und `precipitation_anomaly`. Auch dort werden die korrigierten EFI-/SOT-Felder nicht implizit eingemischt.

### Marine

`wave_period` und `wave_peak_period` bleiben in MID getrennte Open-Meteo-Marineparameter. Der Peak-Period-Wert darf weder aus `wave_period` abgeleitet noch unter dessen Metadatenbezeichner geführt werden.

### GloFAS

MID besitzt aktuell keinen eigenen Clientpfad, der GloFAS-Member selbst lädt oder P25/P50/P75 aus Rohmembern lokal neu berechnet. Daher darf MID weder eine feste GloFAS-Anzahl von 51 voraussetzen noch die inzwischen upstream korrigierte alte Perzentilformel nachbauen. Falls ein eigener GloFAS-Pfad später ergänzt wird, muss die Ensemblegröße aus der Quelle/Domain kommen und das Perzentil linear auf `(n-1)*p` bestimmt werden.

### DEM

MID nutzt für Geländehöhen und Morphologie die Open-Meteo-Elevation-API und führt keine eigene Copernicus-DEM-Kachelindexierung nach ganzzahliger südlicher Breite durch. Die Upstream-Korrektur wirkt damit automatisch; MID darf den alten fehlerhaften Indexalgorithmus nicht lokal duplizieren.

### Météo-France / Serverbetrieb

MID konsumiert die Open-Meteo-HTTP-APIs und decodiert den internen Météo-France-GRIB-Downloadstrom von Open-Meteo nicht selbst. Die GRIB-Fehlerbehandlung bleibt daher upstream. MID behält seine vorhandenen Request-/Fallback-Schutzmechanismen und bildet die vorübergehende S3-Health-Ausnahme nicht nach.

## Zusammenführung mit dem parallelen v0.9.78.6-Niederschlagszweig

Die in `MID_IMPLEMENTATION_0.9.78.6.md` festgeschriebene DWD-RUC-/MOSMIX-Niederschlagskonsenslogik bleibt vollständig erhalten. `v0.9.78.7` ist die erste eindeutige gemeinsame Nachfolgeversion beider zuvor gleich bezeichneten v0.9.78.6-Zweige.

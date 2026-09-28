# MID v0.9.47.0 – amtlicher Beobachtungsbroker und zusätzliche Ensembles

## Ziel

Der Stand baut v0.9.46.0 aus, ohne die bestehende hyperlokale Restfeldanalyse oder die Open-Meteo-/METAR-Rückfallwege zu ersetzen. Neue Quellen werden parameterbezogen bewertet und ihre konkrete Herkunft wird bis in die Oberfläche transportiert.

## Aktuelles Wetter

- Deutschland: direkte DWD-SYNOP-Beobachtungen aus `stationlist_synoptic_germany.csv` und den aktuellen `*-BEOB.csv`-POI-Dateien. Bright Sky wird nur verwendet, wenn keine direkte DWD-SYNOP-Zeitreihe verfügbar ist.
- Österreich: bestehender GeoSphere-Pfad bleibt erhalten.
- Schweden: SMHI MetObs; Finnland: FMI Open Data; USA: NWS/MADIS; Kanada: ECCC SWOB/GeoMet.
- Spanien: AEMET OpenData, wenn `MID_AEMET_API_KEY` als Worker-Secret gesetzt ist.
- Schweiz, Niederlande und Frankreich: explizite numerische Punktadapter; ohne Konfiguration bleiben die bisherigen METAR-/professionellen Rückfälle erhalten.
- DWD GMA/SWS: eigener Quellentyp `road-weather`. Temperatur/Taupunkt können lokal beitragen; allgemeine Wind-, Sicht-, Wolken-, Druck- und Niederschlagsfelder werden stark begrenzt.
- METAR bleibt globaler amtlicher Flugplatz-Fallback für besonders geeignete Parameter wie Sicht, Ceiling, Wind und Wettererscheinungen.

## Herkunft und Qualität

`Station.fieldSources` führt für jedes analysierte Feld bis zu vier gewichtete Quellreferenzen mit Provider, Stationsname/-ID, Entfernung, Messzeit, Quellentyp, Gewicht und QC. Die Info-Popover in „Aktuelles Wetter“ zeigen in der Standardansicht die verständliche konkrete Quelle/Station mit Entfernung und Messzeit; im erweiterten Modus kommen Quellentyp und QC-Details hinzu.

Die bestehende Gewichtung berücksichtigt weiterhin Quelle, Aktualität, Distanz, Standorttyp und Parameter-Eignung. Straßenwetter ist ausdrücklich nicht als allgemeine „nächste Station gewinnt“-Quelle implementiert.

## Ensembles

- `ncep_hgefs025_ensemble_mean`: ausschließlich Ensemble-Mittel und Spread. Daraus erzeugte interne Quantil-Stützkurven sind als `mean-spread` markiert; sie erhöhen keinen sichtbaren Member-Zähler und erzeugen keine Mitgliederszenarien.
- `knmi_harmonie_arome_cy43_eps`: regional, 2,5 km Metadaten, max. 2,5 Tage, UWC-West/HARMONIE-Abhängigkeitsgruppe.
- `eccc_reps`: regional, 10 km Metadaten, max. 3 Tage, eigene ECCC-REPS-Gruppe.
- Beide Regionalensembles benötigen dekodierte numerische Punktadapter. Fehlt der Adapter, wird das Modell als nicht verfügbar behandelt; es erfolgt kein Open-Meteo-Fallback mit einer nicht unterstützten Modellkennung.

## Bewusste Grenzen

MID enthält weiterhin keinen generischen BUFR- oder GRIB-Decoder im Cloudflare Worker. Binäre Spezialprodukte werden nicht aus Kartenbildern rekonstruiert. Das verhindert unnötige Worker-Größe, CPU-Kosten und schwer prüfbare Datenumwandlungen.

## Worker-Konfiguration

Optionale Variablen sind in `.env.example` dokumentiert. Direkt angebundene DWD-SYNOP-, SMHI-, FMI-, NWS- und ECCC-Beobachtungen benötigen keine zusätzlichen Schlüssel. Adapter- und API-Zugangsdaten werden ausschließlich im Worker gehalten.


## Prüfung

- 393 von 407 vorhandenen Regressionstests wurden in der isolierten Arbeitsumgebung erfolgreich ausgeführt.
- 14 weitere Tests waren dort nicht ausführbar: zwölf benötigen TypeScript-/Typ-Pakete, die wegen eines abgebrochenen bzw. auslaufenden `npm ci` nicht vollständig installiert wurden; zwei setzen GitHub-Workflowdateien voraus, die im übergebenen Professional-Release-ZIP nicht enthalten sind.
- Der neue v0.9.47.0-Quellen-/Ensemblevertrag, Baseline-/Lineage-Schutz, Hyperlokal-/Quellenqualitäts- sowie relevante Ensemble-, Druck-, METAR- und Cache-Regressionen bestehen.
- `worker/metar-proxy.js` besteht die Node-Syntaxprüfung. Die geänderten TypeScript-/TSX-Dateien wurden zusätzlich mit der vorhandenen globalen TypeScript-Installation parsergeprüft.
- Ein vollständiger lokaler Produktionsbuild kann in dieser isolierten Umgebung deshalb nicht belastbar behauptet werden.

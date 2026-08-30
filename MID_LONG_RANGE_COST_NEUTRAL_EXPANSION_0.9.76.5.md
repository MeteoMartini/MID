# MID Langfrist – kostenneutrale Quellenerweiterung (v0.9.76.5)

## Verbindlicher Ausgangspunkt

MID besitzt bereits vier numerische Pfade: ECMWF EC46/SEAS5 über die Open-Meteo Seasonal API, NOAA CPC NMME/CFSv2 direkt aus öffentlichen NetCDF-Daten, einen vorbereiteten C3S-CDS-Punktgateway und DWD GCFS2.2/EPISODES als separate Deutschland-Perspektive. Modellvarianten derselben Familie dürfen im Multi-Modell nicht mehrfach gewichtet werden.

## Priorität A – C3S vollständig numerisch aktivieren

Der vorhandene C3S-Katalog umfasst ECMWF, UKMO, Météo-France, DWD, CMCC, NCEP, JMA, ECCC und BOM. Statt neun neue Direktadapter zu bauen, soll ein gemeinsamer Preprocessor die monatlichen C3S-Daten über die CDS API laden, auf die für MID benötigten Variablen/Member reduzieren und kleine normalisierte Punkt-/Gitterdateien veröffentlichen. Geeigneter kostenneutraler Betriebsweg: geplanter GitHub-Action-Lauf mit CDS-Zugangsdaten als Repository Secret und Veröffentlichung des kompakten Ergebnisses über den bestehenden Pages-Pfad. Keine Rohdatenwürfel an den Browser liefern.

## Priorität B – DWD GCFS2.2 / EPISODES direkt aus ClimatePredictionsDE

Der vorbereitete Worker-Gateway soll perspektivisch keinen extern betriebenen Adapter benötigen. Ein monatlicher GitHub-Preprocessor kann die öffentlichen ClimatePredictionsDE/ESGF-Dateien für GCFS2.2 + EPISODES sowie die QA-Produkte lesen und Temperatur-/Niederschlagsanomalien plus Skill-Maße für das Deutschlandraster normalisieren. Die App behält DWD bewusst als eigene Deutschland-Perspektive und mischt diese Werte nicht unkontrolliert in die C3S-Monatsrauchfahne.

## Priorität C – NOAA NMME vertiefen

Der direkte NOAA-NMME-ENSMEAN-Pfad ist bereits produktiv vorbereitet. Erweiterbar sind insbesondere probabilistische NMME-Produkte, Hindcast-Klimatologien und – soweit Bandbreite/Dateigröße sinnvoll bleiben – Memberstatistiken. Die unabhängigen Modellfamilien werden weiterhin gleich gewichtet; CFSv2 ist nicht zusätzlich zu einer identischen NMME-CFSv2-Familie zu gewichten.

## Priorität D – subseasonal ergänzen, aber getrennt darstellen

Für 3–6 Wochen sollte eine eigene "Witterung/Extended Range"-Ebene neben der saisonalen Monatsansicht entstehen. Sie darf nicht als präzise lokale Tagesvorhersage erscheinen. Geeignete numerische Quellen sind nur dann einzubinden, wenn echte Zahlenwerte und Hindcast-/Skillinformationen vorliegen; Kartenfarben oder Bildprodukte werden niemals rückgerechnet.

## Betriebs- und Kostenvertrag

- keine kostenpflichtige API oder zusätzliche Cloud-Instanz ohne ausdrückliche Freigabe;
- bevorzugt öffentliche Daten + GitHub Actions/Pages + bestehender Worker als Gateway/Cache;
- CDS kann einen kostenlosen Account/API-Key und einmalige Lizenzannahme erfordern; das ist ein manueller Konfigurationsschritt, aber kein Kauf;
- Roh-NetCDF/GRIB nur server-/CI-seitig verarbeiten, Browser erhält normalisierte kleine JSON/Binärprodukte;
- monatliche/saisonale Quellen aggressiv cachen (mindestens 4 h, Stale-if-error wie bestehend 36 h);
- Modellfamilien deduplizieren und Quelle, Init/Run, Referenzzeitraum, Ensemblegröße und Skill transparent ausweisen.

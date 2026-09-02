# MID Saison-/Langfristmodelle – Quellen- und Unabhängigkeitsaudit v0.9.77.27

Stand: 2026-09-02

## Ziel

MID soll für den numerischen saisonalen Langfristtrend möglichst viele tatsächlich verfügbare Modellsysteme nutzen, ohne dieselbe physikalische Modelllinie über mehrere Datenanbieter mehrfach zu gewichten. Das Poor-Man’s-Ensemble ist deshalb kein Member-Großensemble, sondern ein einfacher Multi-Modell-Konsens aus **einer Stimme je unabhängiger Modelllinie**. Reine Katalogeinträge werden nicht in der Oberfläche dargestellt und erhalten keine Stimme.

## 1. Direkt bzw. über den bestehenden MID-Adapter numerisch nutzbarer Monats-Pool

### C3S Seasonal Multi-System – aktuell 10 operationelle Systeme

Der C3S-CDS-Pfad ist die vollständigste einheitliche Quelle für monatliche Saisonvorhersagen. Der aktuelle MID-Katalog führt die seit April 2026 operationellen Systeme getrennt:

1. ECMWF SEAS5 / System 51
2. UK Met Office GloSea6-GC5.1 / System 610
3. Météo-France System 9
4. DWD GCFS2.2 / System 22
5. CMCC SPS4 / System 4
6. NCEP CFSv2 / System 2
7. JMA CPS4 / System 4
8. ECCC CanESM5.1p1bc / System 4
9. ECCC GEM5.2-NEMO / System 5
10. BOM ACCESS-S2 / System 2

ECCC System 4 und 5 sind zwei verschiedene numerische Systeme und dürfen deshalb nicht mehr in einem einzigen Katalogobjekt zusammenfallen.

Der C3S-Pfad bleibt ein sicherer serverseitiger Adapter. Er wird nur numerisch aktiv, wenn `MID_C3S_SEASONAL_POINT_ENDPOINT` konfiguriert ist. CDS-Zugangsdaten werden niemals ins Frontend gelegt; ohne Adapter entstehen keine Mockwerte.

### NOAA CPC NMME – dynamischer aktueller Direktpfad

MID liest nicht mehr eine statische Modellliste, sondern den jeweils neuesten `ENSMEAN`-Lauf und übernimmt jedes dort tatsächlich vorhandene Modell, für das sowohl `tmp2m` als auch `prate` als Monatsanomalie vorliegen. Im aktuellen NOAA-ENSMEAN-Lauf `2026080800` sind für `tmp2m` und `prate` gemeinsam sechs Systeme numerisch vorhanden:

1. NCEP CFSv2
2. ECCC CanESM5
3. ECCC GEM5.2-NEMO
4. NASA GEOS-S2S-2
5. NCAR CESM1
6. NCAR CCSM4

`GFDL_SPEAR` bleibt im Decoder bekannt, wird aber nur dann aufgenommen, wenn es in einem künftigen **aktuellen** ENSMEAN-Lauf wieder tatsächlich numerisch vorhanden ist. Ein alter/staler Modellordner reicht nicht für eine Stimme.

### Open-Meteo Seasonal / ECMWF

Open-Meteo liefert ECMWF-SEAS5/EC46 numerisch und bleibt der kostenneutrale öffentliche ECMWF-Fallback. Für das Poor-Man’s-Ensemble ist dies **keine zusätzliche ECMWF-Stimme**, wenn derselbe ECMWF-SEAS5-Systemstand bereits über C3S vorliegt.

## 2. Kanonische Modellidentität und maximaler unabhängiger Pool

MID trennt jetzt `modelKey` (konkretes Modellsystem) und `independenceKey` (Poor-Man-Stimme). Datenanbieter oder API-Namen sind ausdrücklich keine Unabhängigkeitskriterien.

Bei vollständig aktivem C3S plus aktuellem NMME ergeben sich derzeit maximal 13 unabhängige Systeme/Modelllinien:

1. ECMWF SEAS5
2. UK Met Office GloSea6-GC5.1
3. Météo-France System 9
4. DWD GCFS2.2
5. CMCC SPS4
6. NCEP CFSv2
7. JMA CPS4
8. ECCC CanESM5-Linie
9. ECCC GEM5.2-NEMO
10. BOM ACCESS-S2
11. NASA GEOS-S2S-2
12. NCAR CESM1
13. NCAR CCSM4

Konservative Doppelzählungssperren:

- C3S NCEP CFSv2 = NOAA-NMME CFSv2 -> eine Stimme.
- C3S ECCC GEM5.2-NEMO = NOAA-NMME GEM5.2-NEMO -> eine Stimme.
- C3S ECCC CanESM5.1p1bc und NOAA-NMME CanESM5 werden wegen der eng gekoppelten CanESM5-Linie konservativ als eine Stimme behandelt.
- C3S ECMWF SEAS5 = Open-Meteo ECMWF Seasonal -> eine Stimme.

Falls ein künftiger aktueller NMME-Lauf ein zusätzliches, nicht überlappendes System wie GFDL SPEAR enthält, wird es automatisch als weitere unabhängige Stimme aufgenommen.

## 3. Poor-Man’s-Ensemble

Für jeden Monat und Parameter:

1. pro `independenceKey` höchstens ein numerischer Modellbeitrag,
2. arithmetisches Mittel der verfügbaren Modellmittel = Poor-Man’s-Ensemble-Mittel,
3. P10/P25/P75/P90 werden aus der Streuung der unabhängigen Modellmittel gebildet,
4. Memberzahl eines Einzelmodells ändert dessen Modellgewicht **nicht**,
5. fehlende Modelle oder Monate werden nicht mit Null ersetzt,
6. bei nur einem numerischen Modell bleibt dessen echte Rauchfahne sichtbar; erst ab zwei unabhängigen Systemen wird der Multi-Modell-Konsens gebildet.

Diese einfache Gleichgewichtung entspricht dem fachlichen Grundprinzip des Simple Composite Method (SCM): Modellmittel werden nach Bias-/Klimareferenzbezug modellweise gleich gewichtet. Eine spätere skillbasierte Gewichtung darf erst erfolgen, wenn MID die lokale Prognosegüte belastbar verifiziert; sie darf diesen transparenten Referenzkonsens nicht still ersetzen.

## 4. Weitere geprüfte Quellen – bewusst nicht als zusätzliche Stimme eingemischt

### ECCC CanSIPSv3

CanSIPSv3 ist meteorologisch wertvoll und reicht bis 12 Monate, besteht aber aus den beiden ECCC-Systemen CanESM5 und GEM5.2-NEMO. Diese sind bereits über C3S/NMME im Modellpool vertreten. CanSIPS kann künftig als direkter ECCC-Fallback bzw. zur Reichweitenverlängerung dienen, wäre aber **keine dritte kanadische Modellstimme**.

### WMO Lead Centre for Long-Range Forecast Multi-Model Ensemble

Das WMO Lead Centre veröffentlicht aktuell digitale Saisonprodukte zahlreicher Global Producing Centres, darunter u. a. Montreal, Beijing, CMCC, ECMWF, Moscow, Seoul, Tokyo, Toulouse, Washington, Exeter, Melbourne, CPTEC, Offenbach und Pune. Die Datenbörse dokumentiert monatliche und 3-Monats-/Saisonprodukte auf 2,5°-Raster in GRIB/NetCDF; der eigentliche Datenaustausch ist jedoch zugangsbeschränkt und verlangt nach WMO-Angaben ein Access Request sowie Login-ID/Passwort. Ohne diesen Zugang darf MID die dortigen Einzel-GPCs nicht als numerisch verfügbar vortäuschen. Die 3-Monats-Achse ist zudem nicht identisch mit der monatlichen C3S/NMME-Konsensachse. MID rekonstruiert daraus **keine künstlichen Monatswerte**. Ein zukünftiger WMO-Adapter kann diese GPCs als separate saisonale 3-Monats-Perspektive aufnehmen, sobald Downloadvertrag, Modellidentitäten und numerische Dekodierung vollständig verifiziert sind.

### APCC MME / Einzelmodelle

APCC führt einen besonders großen Modellpool und bietet Monats-/Saisonprodukte sowie Einzelmodelldaten. Der aktuelle Auswahlkatalog nennt APCC, BCC, BOM, CMCC, CWA, ECCC, HMC, KMA, Météo-France, MGO, MSC, NASA, NCEP, PKNU, PNU, PNU-RDA und UKMO; die tatsächlich operationelle Verfügbarkeit kann monatlich variieren. Der Download der Einzelmodelle erfordert jedoch eine Anmeldung bzw. Authentifizierung. APCC-MME/SCM selbst ist bereits ein Multi-Modell-Produkt; es zusätzlich zu seinen Einzelmodellen als weitere Stimme einzumischen würde Modelle doppelt zählen. Daher dient APCC derzeit als methodische Referenz und potenzieller zukünftiger authentifizierter Einzelmodellpfad, nicht als zusätzlicher ungeprüfter Vote.

### DWD GCFS2.2 / EPISODES

Die Deutschland-Perspektive liefert überlappende 3-Monats-Anomalien und Skill-/QA-Information. Sie bleibt bewusst separat sichtbar. Die 3-Monats-Werte werden nicht mathematisch in die monatliche C3S/NMME-Achse umgerechnet.

## 5. Produktive NMME-Lastreduktion

Der frühere NMME-Direktpfad musste pro Ortsabruf für sechs aktuelle Modelle zwölf vollständige NetCDF-Dateien laden (`tmp2m` + `prate`, aktuell jeweils rund 2,2 MB). Das entspricht grob 26 MB Rohdaten vor Protokolloverhead.

v0.9.77.27 liest deshalb:

- zunächst nur einen kleinen NetCDF-Header per HTTP Byte-Range,
- berechnet daraus Gitterpunkt und exakte Byte-Offets der Monatswerte,
- lädt die benötigten Scalars je Datei gesammelt über HTTP Multi-Range,
- fällt nur bei fehlender Range-Unterstützung oder nicht dekodierbarer Struktur auf den bisherigen Volldownload zurück,
- begrenzt parallele NOAA-Modellabrufe, damit ein einzelner Ortsabruf den Origin nicht unnötig mit zwölf gleichzeitigen Dateipaaren belastet.

Damit bleibt die Datenquelle unverändert amtlich/NOAA; geändert wird nur die kostensparende Punktentnahme.

## 6. UI-Vertrag

- Die Season-Hauptansicht zeigt ausschließlich tatsächlich numerisch geladene Modellsysteme.
- Keine Kästchen für theoretisch verfügbare, aber nicht geladene Modelle.
- Ab zwei unabhängigen Systemen: Poor-Man’s-Ensemble + gemeinsames Einzelmodell-Diagramm.
- Bei einem System: dessen echte Rauchfahne, kein leerer Hinweisersatz.
- Das gemeinsame Einzelmodell-Diagramm bleibt auch mit >12 Systemen eindeutig unterscheidbar (Farben plus Linienmuster), ohne den meteorologischen Parameterfarbvertrag zu verändern.

## Ergebnis

MID vereinigt damit alle derzeit **vergleichbar, numerisch und regelkonform erreichbaren** Monats-Saisonmodelle in einem kanonischen Pool. Quellen mit anderer Zeitachse, bereits aggregierten MMEs, Authentifizierungsgates oder noch nicht verifiziertem Maschinenzugriff werden nicht vorgespiegelt und nicht doppelt gewichtet.

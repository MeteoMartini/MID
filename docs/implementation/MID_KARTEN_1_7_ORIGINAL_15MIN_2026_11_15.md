# MID-Karten 1.7 – echte 15-Minuten-Originale und synoptische Herkunft (QA-Only)

**Geprüfte stabile Ausgangsbasis:** MID v0.9.85.482, `main=mid-stable=f9c0b182b0e11278651e2afa13039015e1aa0f0b`. UI/CSS und erste Teilregression sind aus PR #817 (HEAD `e51f0a6343ec7d2848320030f8fe55b171d7c842`) nach objektidentischer Ausgangsbasis übernommen. Neuer Source-PR bleibt Draft; kein autonomes Release.

## Priorität und Datenqualität

1. Die gesamte Umfeld-Auswahl erfolgt auf festen UTC-Viertelstundenterminen (`:00/:15/:30/:45`), 0–9 Schritte ab dem zuletzt vergangenen Viertelstundenstempel (die zehnte Position deckt auch kurz vor der nächsten Viertelstundengrenze mindestens +120 Minuten ab). Relative Anzeige `in X min` bezieht sich auf die wirkliche aktuelle Uhrzeit. Eine angeforderte Viertelstunde belegt **nicht** die gleichnamige native Modellauflösung.
2. Die vorhandenen synoptischen Wolken-/SigWx-Felder bleiben SHA-, Run-, Gültigkeitszeit-, Gitter- und Ortsabdeckungs-geprüft. Ein **exakt am Ziel** vorliegendes Originalfeld eines zulässigen Modells hat Priorität vor einem aus Stundenoriginalen berechneten Zwischenfeld. Bei mehreren exakten Quellen bleibt die etablierte ICON-Familienreihenfolge maßgeblich. Eine echte 15-Minuten-Kachel wird nur dann `original` genannt, wenn ihre Herkunft tatsächlich im MID-Feldinventar belegt ist.
3. Nur wenn kein exaktes Original vorhanden ist, gelten die bestehenden engen Zwischenbildregeln: kontinuierlicher Wolkenanteil ausschließlich zwischen gleichlaufenden gleichen Rasterdaten binnen 60 min, keine Glättung abrupter oder unvollständiger Werte. Diskrete WMO-4677-Wettercodes behalten den exakten nächstgelegenen Originalcode mit eigener Quellzeit; niemals als originales 15-min-`WW` darstellen. Ohne tragfähiges Paar den tatsächlich gültigen Originaltermin zeigen oder NoData.
4. Open-Meteo Best Match `hourly=temperature_2m` liefert getrennte belegte Stundenoriginale für benannte reale Orte. Ein genau passender Originaltermin schlägt eine Zwischenwertberechnung. Eine gültige Viertelstunden-Interpolation kann beim vorhandenen Stundenprodukt ausdrücklich gekennzeichnet werden, ist aber **kein 15-Minuten-Originalwert**. Eine zusätzliche Abfrage `minutely_15=temperature_2m` von ICON-D2 wäre laut Anbieter ebenfalls berechnet und darf nicht durch das API-Zeitraster als native 15-Minuten-Quelle gelten. Ohne echten Zelllauf keine erfundene Best-Match-Modellinitialisierung. ECMWF-orientierte Farben sind Darstellung, keine Datenherkunft.
5. Der Termin-Handoff in den Hauptkartenbereich und die separate ortsgebundene Temperatur-/Wolkenanzeige nutzen dieselbe absolute Zielzeit. Die bereits vorhandene PseudoSat-Rasterdarstellung wird nicht über eine zweite Wetter-Pipeline dupliziert. Radar/Satellit und amtliche Warnungen bleiben unverändert.

## Qualifizierbare echte Originaldaten (noch kein MID-Produkt)

- DWD ICON-D2-RUC `SYNMSG_BT_CL_IR10.8` ist nach der offiziellen DWD-Parametertabelle ein **15-minütliches modelliertes Infrarot-Helligkeitstemperaturfeld**. Es ist keine `CLCT`-Prozentangabe, kein echtes Satellitenbild und kein WMO-`WW`-Code. Die existierende MID-Cloud-Weather-Raster-Pipeline konsumiert nicht dieses IR-Feld. Vor Aktivierung erforderlich: originales GRIB-Inventar, Parameter/Einheiten (K), Gitter/Projektion, Lauf und Vorhersagetermine, SHA/Bytes/NoData, zulässige strahlungsbezogene PseudoSat-Farbskala, Kartenkomposit mit unverändertem SigWx-Signalkanal, echte 320–834px-/Tablet- und Speicher-/Netzwerkbudgets. Keine Freischaltung auf Basis eines bloßen Verzeichnisnamens.
- RUC-5-/15-min-Niederschlags-/Konvektions-Originale sind keine austauschbaren stündlichen WMO-`WW`-Codes. Modellausgaben `CLCT`, `T_2M`, `WW` bleiben in der betrachteten DWD-Standard-/RUC-Pipeline stündlich. Bei Open-Meteo kann `weather_code` in 15-min-Schritten angeboten werden; dies beweist weder einen nativen DWD-`WW`-GRIB-Datensatz noch identischen Modelllauf.

Amtliche Dokumentation:
- DWD Parameterkapitel: https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf?nn=344870&view=nasPublication
- Open-Meteo 15-Minuten-Variablen und Abweichung von nativ: https://open-meteo.com/en/docs
- DWD-API-Feldübersicht: https://open-meteo.com/en/docs/dwd-api

## Umsetzungsnachweis / Rest-Gates

**Geändert:** `src/surroundingsQuarterHour.ts`, `src/CurrentSurroundings.tsx`, `src/currentSurroundingsCloudImage.ts`, `src/CurrentSurroundings.css`, bestehende deterministische Regression und dieses Dokument. Aus PR #817 wird die kompakte Metadaten-Anzeige / einheitliche PseudoSat-Filterung integriert; PR #817 nicht doppelt freigeben.

**Vor Release:** Echte Source-/Core-/Heavy-/Build-/Installer-/Pages-/Worker-/Stable-Gates am finalen identischen SHA, browserbasierte Gerätematrix (320/390/430/834px, Tablet hoch/quer, Light/Dark, Dynamic Type, Touch), tatsächlich verfügbare Karten-/Originalframes, Fehl-/Stale-/NoData und IR-Spezialuntersuchung; RUC-Größen-/Speicher-/Kaltstartbudgets beachten. Synthetische Regression belegt nur deterministische Reihenfolge und Zeitachsen, **keine echte neue 15-min-DWD-IR-Quelle**. Kein Admin-Bypass, kein Force-Push, keine direkten `main`/`mid-stable`-Writes. Versionierung aller Spiegel und Changelog erst beim realen Release-Train.


## Nachtrag: isolierte lokale IR10.8-Originaldatenqualifikation (QA, kein Live-Feed)

Die neue `tools/ruc/ir108_original_probe.py` prüft **nur lokal vorhandene, separat gehashte** GRIB2-Kandidaten. Es gibt keine neuen Netzwerkabrufe im Worker, RUC-Preprocessor, Frontend oder Browser. Der Befehl

```bash
python tools/ruc/ir108_original_probe.py --manifest /sichere/staging/manifest.json
```

verwendet ausschließlich eine anforderungsgebundene Manifeststruktur `mid.dwd.icon-d2-ruc.ir108.shadow.v1` mit `run`, `firstValid` und zehn `frames` (jeweils `name`, `sourceUrl`, `sha256`). Die GRIB-Dateien müssen als reguläre Dateien im benachbarten `frames/`-Verzeichnis liegen. Symlinks und Pfadübertritte, nichtamtliche HTTP-Herkunft, fehlende oder falsche Digests, fehlerhafte Stunden-/Viertelstundenachsen, fremde Modellläufe und DWD-fremde GRIB-Header werden abgewiesen. Rohdateien sind einzeln auf 8 MiB, dekomprimierte bzip2-Objekte auf 64 MiB begrenzt. Der echte Headerabruf erfolgt ausschließlich mit vorhandenem ecCodes; ohne ecCodes wird nicht ersatzweise geparst.

Fachliche Metadatenprüfung: `GRIB edition=2`, DWD centre 78, `discipline/category/number=3/1/14`, momentane Helligkeitstemperatur in **K**, bekannte native ICON-D2-RUC-Gitterkennung und Zellzahl, zeitlich exakte `startStep=endStep` auf Viertelstunden, INIT+Lead=Gültigkeit in UTC, keine geerbten GRIB-Bitmaps, zehn lückenlose Originaltermine bis +135 Minuten ab der letzten Viertelstundengrenze (mindestens +120 Minuten ab jetzt). Die DWD-Dokumentation nennt `3/1/14` aber **für IR10.8 und WV6.2**. Daher ist die Parameterkennung *nicht kanaltrennscharf*. Ein behaupteter Dateipfad und ein lokal errechneter SHA sind ebenfalls kein unabhängiger Beleg für die richtige ursprüngliche Payload.

**Sicherheitsergebnis:** Auch bei formal bestandenem Header-/Cadence-Audit bleibt `activationAuthorized: false` mit ausdrücklich offenen Prüfungen für IR/WV-Identität, Bitmap/Missing/physikalische Werte, CLAT/CLON-Georeferenzierung, Bildrenderer, Lastbudget und Source-/Release-Gates. Der QA-Pfad erzeugt weder veröffentlichte Raster noch PseudoSat-Bilder und verändert keine bestehende MID-Wettersemantik. Keine stillschweigende Übernahme als `CLCT` oder `WW`.

Die deterministische Python-Negativ-/Positivtestreihe `tools/ruc/test_ir108_original_probe.py` ist an die bereits selektierte GitHub-Draft-Regression `scripts/test-current-surroundings-temperature-0985476.mjs` angebunden, mit synthetischen Rohheadern und ohne DWD-/Netzwerkabruf. Das **beweist keine tatsächliche Datenabdeckung**, sondern schützt die fachliche Zulassungslogik. Ein echter unabhängiger, reproduzierbarer zehn-Frame-DWD-GRIB-Decode- und Datensatzabgleich steht weiterhin vor einer eventuellen späteren Aktivierung.

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


## Amtlich live verifizierte Originaldateinamen und begrenztes Staging (15.11.2026)

Ein tatsächlicher **Live-Verzeichnisabruf** beim DWD am 15.11.2026 zeigte den ICON-D2-RUC-IR10.8-Lauf vom **15.11.2026 15:00 UTC** und echte Viertelstunden-Dateieinträge:
https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/SYNMSG_BT_CL_IR10.8/r/2026-11-15T15%3A00/s/

Die amtliche Verzeichnisauflistung verzeichnet:
- PT000H00M.grib2 – 827 804 Byte,
- PT000H15M.grib2 – 827 488 Byte,
- PT000H30M.grib2 – 827 894 Byte,
- PT001H00M.grib2 – 826 661 Byte,
- PT002H00M.grib2 – 827 672 Byte,
- PT002H15M.grib2 – 829 150 Byte.

Diese Live-Verzeichniseinträge belegen native Viertelstunden-Angebote an der Quelle. Sie ersetzen **keinen** Download der Binärinhalte, kein GRIB-Werte-/Bitmap-Audit, keinen Kanalidentitätsnachweis und kein tatsächliches georeferenziertes Bild. Für neue Abrufe immer den neuesten DWD-Lauf erneut bestimmen.

**Korrektur gegenüber dem früheren QA-Entwurf:** Das Original-DWD-Layout lautet .../p/SYNMSG_BT_CL_IR10.8/r/<YYYY-MM-DDTHH:MM>/s/PTxxxHyyM.grib2. Die zuvor angenommene direkt unter dem Laufverzeichnis liegende Datei ohne s/ bzw. frei benannte .bz2-Datei entspricht dem amtlichen Katalog **nicht**. Der Quellvalidator prüft jetzt zwingend die s/-Ebene und den aus dem Dateinamen stammenden Vorhersageschritt gegen die tatsächlich decodierte GRIB-Gültigkeit.

**Nichtproduktiver Originaldaten-Stager:** tools/ruc/ir108_stage_originals.py kann nach explizitem lokalen Start den offiziellen DWD-Verzeichnisindex prüfen, einen vollständigen Satz von zehn benachbarten Originalterminen auswählen und ausschließlich diese zehn öffentlichen Dateien in ein neues privates Verzeichnis herunterladen. HTTPS-Herkunft ist fest auf den DWD gebunden, Redirects bleiben untersagt, jede Datei ist auf maximal 8 MiB begrenzt. Rohes GRIB-Magic/Endmarkierung, Content-Length, SHA-256 und eindeutige Pfade werden geprüft. Erst nach vollständigem Satz wird das lokale Kandidatenverzeichnis atomar angelegt; bei Fehlern wird die gesamte Zwischenstufe verworfen. Manifest und lokale GRIB-Dateien werden **nicht** zu MID, GitHub Pages, Worker oder Browser veröffentlicht.

Beispiel für ein explizit gestartetes lokales QA-Staging:

    python tools/ruc/ir108_stage_originals.py \
      --run 2026-11-15T15:00:00Z \
      --first-valid 2026-11-15T15:30:00Z \
      --output /privates/verzeichnis/ir108-20261115T1500

    python tools/ruc/ir108_original_probe.py \
      --manifest /privates/verzeichnis/ir108-20261115T1500/manifest.json

**Keine eigenständige Source-/Produktfreigabe:** Der Stager ist weder ein MID-Worker noch Teil des produktiven RUC-Preprocessors. Er rendert keine Wetterkarte, publiziert nichts und verändert keine Vorhersagewerte. Die CI-Regressionsprüfung verwendet ausschließlich synthetische HTML-/GRIB-Transport-Fixtures **ohne DWD-Netzwerk**. Ein positiver Download plus Headernachweis lässt activationAuthorized=false, bis IR10.8 gegenüber WV6.2 zweifelsfrei unterschieden wird, Werte/Bitmap/CLAT-/CLON-Koordinaten samt Kartenrenderer, Quelle/Gültigkeitszeit/Wettercode-Kombination, Performance und alle MID-Release-Gates real validiert wurden. Kein amtliches Satellitenbild und keine Umdeutung in CLCT-Prozent.


## Spektrale IR10.8-/WV6.2-Unterscheidung – historisch kalibrierter GRIB-Nachweis

Die amtliche DWD-Modellreferenz für ältere COSMO-D2-SynSat-Produkte beschreibt für **beide** Kanäle denselben GRIB-Parameter 3/1/14, aber die zusätzlichen Satelliten-/Instrumentwerte 333/72/207 und **verschiedene zentrale Wellenzahlen**: 92 592 m⁻¹ (10,8 µm) gegenüber 161 290 m⁻¹ (6,2 µm). Die offizielle ECMWF/WMO-GRIB2-Satellitentemplate-4.31-Referenz belegt die Schlüssel numberOfContributingSpectralBands, satelliteSeries, satelliteNumber, instrumentType, scaleFactorOfCentralWaveNumber und scaledValueOfCentralWaveNumber. Quellen:
- https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/cosmo_d2/cosmo_d2_dbbeschr_version_1_0_201805.pdf
- https://codes-test.ecmwf.int/grib/format/grib2/templates/4/31/
- https://docs.icon-model.org/2026.04/documentation/buildrun/buildrun_namelist_overview.html

tools/ruc/ir108_original_probe.py liest diese **optionalen Rohfelder** aus dem echten GRIB-Header und prüft bei vollständigem vorhandenem Satz: ein spektrales Band, bekannte historische SEVIRI-Instrumentkennung und zu IR10.8 passende aus skalierter Wellenzahl errechnete Frequenz. Ein 6,2-µm-Wasserdampfkanal wird aktiv abgewiesen. Fehlt eines der spektralen Schlüsselfelder, ist das Ergebnis ausdrücklich AMBIGUOUS_IR_OR_WV und **keine** IR10.8-Zulassung. Der positive Status lautet bewusst HISTORICAL_DWD_SEVIRI_IR108_SPECTRAL_MATCH und **nicht** CURRENT_ICON_D2_IR108_QUALIFIED.

Diese historischen 2018er Spektralwerte sind ein nachvollziehbarer, unabhängigerer Kanaltest als das Verzeichnis allein. Sie belegen **noch nicht** dieselbe Belegung in aktuellen ICON-D2-RUC-Payloads von November 2026. Ohne einen realen, zur amtlichen aktuellen Datenquelle gehörenden eCCodes-/Wellenzahl-/Wert-/Bitmap-Befund bleibt die Freigabescharte geschlossen. Der Status activationAuthorized bleibt unverändert false; RUC-/Browser-/Worker-Pipelines und bestehende Warn-/Signifikantwetterlogik werden nicht freigeschaltet. Die CI-Tests enthalten einen synthetischen IR10.8-Positivfall, einen ausdrücklich abgewiesenen WV6.2-Fall, abweichende Satelliteninstrumente und unvollständige Headerdaten.


## Aktuelle DWD-Binärheader IR10.8 vs. WV6.2 – Live-Referenz vom 15.11.2026

**Vorrangiger Nachweis gegenüber der zuvor nur historischen Kalibrierung:** Aus dem offiziellen Laufverzeichnis 2026-11-15T15:00 UTC wurden zwei echte GRIB2-Antwortkörper mit GRIB-Magic und 7777-Endmarkierung für Prognoselead PT000H15M gelesen. Der direkt aus Rohbytes geprüfte WMO-Satellitenheader ergibt:

| Feld | SYNMSG_BT_CL_IR10.8 | SYNMSG_BT_CL_WV6.2 |
| --- | --- | --- |
| Größe | 827488 Byte | 768809 Byte |
| GRIB-Edition / Disziplin | 2 / 3 | 2 / 3 |
| Produktdefinition | 4.32 | 4.32 |
| Kategorie / Parameter | 1 / 14 | 1 / 14 |
| Satellitenserie / Satellit / Instrument | 333 / 72 / 207 | 333 / 72 / 207 |
| Anzahl spektraler Bänder | 1 | 1 |
| Wellenzahlskala / skalierter Wert | 0 / 92592 | 0 / 161290 |
| GRIB2-Abschnitt 6 | vorhanden, Länge 67761 Byte | vorhanden, Länge 67761 Byte |

Die Werte sind mit der amtlichen WMO-/ECMWF-Produktdefinition 4.32 und dem historischen DWD-PseudoSat-Profil konsistent:
https://codes.ecmwf.int/grib/format/grib2/templates/4/32/

Wichtig: Das ist ein **aktueller Zwei-Dateien-Headernachweis**, kein Wertedecode, keine Bitmap-Zellprüfung und kein vollständiger zehn-Frame-Originalsatz. Ein positiver Header beweist weder tatsächliche Wolkentypen noch eine korrekte georeferenzierte Prognosekarte. Die IR-Kanäle sind synthetische Modell-Helligkeitstemperaturen, keine gemessenen Satellitenbilder.

Der QA-Prüfer fordert für ICON-D2-RUC-SynSat dieses Datenformats ab jetzt Template 4.32 mit genau einem Band, Serie 333, Satellit 72, Instrument 207 und zentraler Wellenzahl innerhalb des engen nachgewiesenen IR10.8-Fensters. WMO-Template 4.30/4.31, Wasserdampfkanal 6.2 µm, unbekannte Kanäle oder unvollständige ecCodes-Metadaten dürfen nicht still als qualifizierter IR10.8-Datensatz durchgehen. Die Zustandskennung lautet DWD_PDT32_SEVIRI_IR108_SPECTRAL_MATCH; trotz Matching bleibt activationAuthorized=false, bis **alle zehn Dateien**, native Bitmapwerte, Zell-/Geografiezugriff, Renderer, Ressourcengrenzen und die MID-Release-Gates unabhängig nachgewiesen sind. Es werden keine zusätzlichen Datenquellen, Gebühren oder Produktionsschreibrechte eingeführt.

Die weitere ressourcenschonende Kartenimplementierung soll den bestehenden, SHA-verifizierten nearest-native-cell-RUC-Kartenlookup wiederverwenden, statt eine zweite räumliche Interpolationspipeline zu erzeugen. Dieser Ansatz ist noch nicht freigeschaltet und bedarf eines identischen GRID-/CLAT-/CLON-Nachweises am realen Source-SHA.

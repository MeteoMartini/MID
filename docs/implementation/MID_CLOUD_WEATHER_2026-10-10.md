# Wolken und signifikantes Wetter · .231

Der Benutzer wünscht die Kombination nach dem Vorbild der gezeigten Kachelmann-Karte. MID verwendet eigene Datenaufbereitung und Farben, keine fremde Kartenkopie. Persistierte Parameter-ID sigwx bleibt kompatibel; deutsch sichtbare Modelle/Parameter bleiben alphabetisch sortiert.

## Datenvertrag

ICON-D2: zwei bestehende SHA-geprüfte native Wolken-/WW-Raster. Run, Gültigkeit, beide Achsen müssen exakt übereinstimmen. Missing bleibt null, trockene/nullfreie0 bleibt gültig. ICON-EU/Global: optionale Anreicherung derselben immutable Synoptikdateien aus DWD CLCT und WW. Raw centre78, discipline0, category6/number1 bzw category19/number25, Surface1/0/255, instant und Lauf/Gültigkeit verpflichtend. CLCT %, WW Numeric und ganze0..99. EU0,125°-Originalsampling; Global vorhandenes nearest-native-Mapping mit geprüftem Grid. Keine Kategorienmittelung.

Sechs reale Header des Laufs2026-10-10T12Z +3h sind mit URL/Hash in MID_CLOUD_WEATHER_PRIMARY_2026-10-10.json dokumentiert. EU-Felder wurden zusätzlich mit dem Produktionsdecoder dekodiert:329×689; CLCT0..100%, WW0..96. Global-Headerbeleg ist keine vollständige reale Global-Aufbereitungsabnahme.

Aktuelle DWD-WMS-Capabilities boten keine bestätigte CLCT/WW-Kombination; deshalb keine hypothetischen WW-Layer. GFS/IFS/AICON liefern hier keinen verifizierten gemeinsamen Wettercodevertrag und werden für diesen Parameter nicht behauptet. EU/Global werden ausschließlich nach bestätigtem cloudWeather-Flag angeboten. Die optionalen6 Termine0/3/6/12/24/48h haben einen gemeinsamen180s-Anreicherungsrahmen; fehlende Komponente lässt das bestehende Synoptikprodukt unverändert.

GDPS: GDPS_15km_TotalCloudCover/CLOUD und GDPS_15km_PrecipType-Instant/INSTPRECIPITATIONTYPE tatsächlich in ECCC-Capabilities vorhanden. Schnittmenge von Zeit/Referenzlauf und bestätigten Styles, zwei getrennte allowlisted Requests; beide müssen geladen sein. Fehler blendet gesamte Kombination aus. GDPS ist Wolken plus momentane Niederschlagsart, keine vollständige Nebel-/Gewitterkarte und keine Niederschlagssumme. Keine erfundenen numerischen Ortswerte aus WMS-Pixeln.

## Darstellung und Verbraucher

Ein gemeinsamer Renderer zeigt Wolken in Grau und direkte WMO-Wetterkategorien farbig. WMO4677-Grenzen bleiben erhalten:81/86 sowie57/67/69/84 kennzeichnen mäßig oder stark;36..39 sind Schneetreiben, keine Sandstürme.91..94 bezeichnen vergangenes Gewitter mit aktuellem Niederschlag, keine aktuelle Gewitterzelle. Kategorien werden im Datenrenderer und MapLibre nearest gezeichnet. Native Ortswerte/PNG/SVG verwenden dieselben Raster, Werte und Legenden, auch im bisherigen NativeModelMap-Verbraucher.

Primärquellen: DWD GRIB-URLs im JSON-Beleg; ECCC https://eccc-msc.github.io/open-data/msc-data/nwp_gdps/readme_gdps-geomet_en/ ; WMO4677 im NOAA-Archiv https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM . Header allein belegen keine vollständige Live-Datenverfügbarkeit. Veröffentlichung und Stable-Promotion ausschließlich durch bestehende Source-/Installer-Gates.

## Lokale Abschlussprüfung

958/958 verpflichtende App-Regressionen,57 RUC-Pflichtfälle,13 Synoptikfälle und3 Temperaturfälle erfolgreich; Types, Worker-Syntax, Produktionsbuild und Diff-Prüfung bestanden.24 echte Vite/MapLibre-Browserfälle:320/390/412/844/1024/1440px, light/dark und next/classic. Neue Kombination, GDPS-Laufparameter, Native-Ortswerte, EU75%-Fixture, Legende, unveränderte Karteninstanz und alphabetische Auswahllisten geprüft. Synthetische Fixtures sind keine Live-Wetterverifikation. Smartphone-Screenshot manuell geprüft. Main-JS1424342/1500000B; Haupt-CSS1752171/1760000B. Übernommene alte dist-Assets vor sauberem Build reversibel gesichert; kein Budget verändert. Source-PR enthält keine generierte dist-Ausgabe.

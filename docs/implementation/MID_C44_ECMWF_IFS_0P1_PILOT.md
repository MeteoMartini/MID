# MID-C44 – Direkter ECMWF IFS 0,1°-Open-Data-Pilot

Source of truth am Start: main=mid-stable=438bfb7838a727ad8753940872c8b8ab140bb7c2 (v0.9.85.304). Die offenen RUC-Modellkarten-Drafts #431/#432 bleiben unverändert. Diese Änderung ist diagnostisch und wird nicht veröffentlicht.

ECMWF veröffentlicht seit 20.10.2026 (06 UTC) IFS-Felder auf einem interpolierten regulären 0,1°-Lat/Lon-Raster parallel zum bisherigen 0,25°-Produkt. Es ist **nicht** das interne O1280-Gitter. AIFS ist von 0,1° ausgenommen. Quelle: https://www.ecmwf.int/en/forecasts/datasets/open-data . Licence: CC BY 4.0 und ECMWF Terms of Use mit Quellenhinweis. 0,1° ist rund 2 Stunden später verfügbar als 0,25°. Kein kostenpflichtiger ECMWF-Service wird beauftragt.

Read-only GitHub-Pilot: Offizieller, für 0p1 dokumentierter ecmwf-opendata-Client 0.3.35 lädt über den selektiven .index/Range-Datenweg nur drei Felder desselben explizit festgelegten IFS-Laufs: 2t, msl (je sfc), z in 500hPa (pl), step 0. ecCodes prüft GRIB2, ECMWF-Zentrum, Init/ValidTime UTC, Höhe/Druckfläche, ursprüngliche Einheiten, globale 0,1°-Gitterauflösung, Bitmap und Bits-per-Value. Je Feld nur sieben numerische Stützproben statt vollständiger Rasterprüfung. Fehlt ein Feld oder stimmt der Lauf nicht überein, wird fail-closed abgebrochen. Rohdateien werden nur temporär gespeichert, niemals publiziert. 64 MiB Einzeldateilimit, 110 MiB Gesamtdownloadlimit; einzig ein kompaktes JSON-Artefakt wird für 7 Tage behalten. Keine Scheduler, Secrets, CI-Ausnahme oder Produktion.

ECMWF IFS 9km ist schon in der MID-Prognose über Open-Meteo vorhanden. Eine zweite unabhängige ECMWF-Konsensstimme ist ausgeschlossen. Für den produktiven zusätzlichen Kartenpfad braucht MID erst eine Run-atomare ECMWF-spezifische Karten-Pipeline mit sha-verifizierter Provenienz, kleinem geografischem Zuschnitt, Akumulations-/Bitmap-/Extreme-Validierung, Units, Druckflächen, Zeitachsen, Versionsvertrag, ECMWF-Quellenangabe in Karte und PNG/SVG, speichereffizienten Payloads und Rollback; danach Device- und End-to-End-Gates. Bestehende ICON/DWD-Modellkarten dürfen nicht beeinträchtigt werden. Das Pilot-JOB-Ergebnis genehmigt keinen direkten Modellkatalogeintrag.

Bei verifizierter Datenreife folgt erst ein gesonderter versionierter Source-PR über reguläre MID-Release-Gates bis zur Stable-Promotion. Kein automatischer Merge, kein produktiver ECMWF-Umschaltpfad.

## Weiterführender Gate-1-Nachweis nach erfolgreicher Erstprobe

[Live-Run #39510094453](https://github.com/MeteoMartini/MID/actions/runs/39510094453) konnte drei direkt geladene Felder desselben IFS-12UTC-Laufs (20.10.2026) bei +0h dekodieren: 2t 1.377.018 Bytes, MSL 2.318.182 Bytes, Z500 4.784.272 Bytes, insgesamt 8.479.472 Bytes. Alle drei Felder: reguläres 0,1°-Globalraster 3600x1801, ECMWF, GRIB2, native Einheiten und sieben endliche Samplewerte. Dies ist kein Nachweis gesamter Raster- oder Prognosehorizont-Konsistenz. Die nächste Testversion fordert dieselben drei Felder für +0 UND +24 h vom selben ausdrücklich gepinnten Lauf an; die Gültigkeit muss jeweils Referenzzeit+Lead sein. Kein Publish; bisherige Maps unverändert.


## MID-C41: separat auf Stable .321 geprüft (24.10.2026)

Ausgangsbasis dieses Integrationschecks: 205d4c6bf8f9799c9f4ef38f31d20b7940470ced, main = mid-stable. Historische Basisangaben oben beschreiben den ursprünglichen Pilot. Keine Produktionsaktivierung und keine neue App-Version.

Die sieben Pilotdateien wurden selektiv auf .321 angewendet; 9/9 Python-Regressionen erfolgreich. Neuer echter ECMWF-Pilot vom 24.10.2026: Lauf 06Z, sechs GRIB2-Felder (2t/msl/z500 je +0/+24h), 17.016.423 Bytes, sämtliche Pilotprüfungen bestanden. Gitter 3600x1801, 0,1 Grad. fullSpatialValidation=false, readyForProduction=false, fusionEnabled=false, mapsEnabled=false, published=false. Kein Beleg für vollständige Modellkartenintegration.

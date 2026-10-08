# MID-C23 · v0.9.85.204

Verifizierte Integrationsbasis: main = mid-stable = .203 `19447694b3077dc2332784d3feb6477de06eef5c` (Installer erfolgreich). Die vollständig SHA-verifizierte .203-Refreshkorrektur aus PR296 ist erhalten. Lokale Entwicklung isoliert ab .202 mit identischem .203-Quellstand; API-Integration direkt auf dem freigegebenen .203-Tree. Keine alte Replit-Arbeit übernommen (lesender Connector HTTP504).

## Bewölkung / Skybar

Screenshot: Do 08.10., 20 Uhr, Gesamt 41 %, H/M/L 0/0/41 %, leicht bewölkt. Unter dem vorhandenen MID-50-%-Bandvertrag darf nachts kein starkes Bewölkungsband erscheinen. Die frühere leere Nachtzelle hieß dennoch pauschal „Klare Nacht“, und Nullwerte wurden über Number(null) als Beobachtung gezählt. Beide Befunde sind im gemeinsamen Renderer behoben: explizite Messwertprüfung und tatsächliche Bewölkungsangabe. Die vorhandenen 50-%-Band- und vier Dickenstufen bleiben unverändert; sie sind Visualisierungsschwellen, keine Wettertextklassifikation.

24h-Basisband und Stundenzellen verwenden dieselben kanonischen Stundenpunkte wie Wolkenwerte, Tooltip und Piktogramme. Vorher konnte das Viertelstundenband die 50-%-Schwelle überschreiten, obwohl der Tooltip den Stundenwert darunter zeigte. 90m bleibt explizit fein aufgelöst; Viertelstunden-Niederschlagsüberlagerung in 24h bleibt erhalten. Dies präzisiert bewusst die .152-Darstellungsregel; ihr Test schützt weiterhin den gemeinsamen Viertelstundenrenderer und fehlende/echte Nullwerte, zusätzlich nun den gleichen Stunden-Datenstand im 24h-Profil. Keine Modellwerte geändert, kein erneuter RUC-/Stationsblend in der UI.

Verbraucher: gemeinsamer detailSkyBar-Pfad für Aktuell/12h, 90m, Profil24h, 7d/14d, Stundendetails und Widgets/URL/PNG. Tages- und Nachtbewölkung behalten ihre fachlichen zentralen Texte/Icons; fehlende Gesamtbewölkung wird nicht aus Schichtwolken erfunden.

## Synoptik

DWD ICON Global ist ein neuer optionaler nativer Anbieter. Ausschließlich direkte pressure-level/single-level GRIB2 und die laufidentischen CLAT/CLON-Daten, mit SHA-Provenienz. UUID, Punktanzahl, Einheiten, Parameter/Druckfläche, Lauf und Gültigkeit werden geprüft. Sphärische Zuordnung zur nächsten nativen Dreieckszelle auf 0.25° Europa-Übersicht, maximal 30 km Distanz; keine Extrapolation, keine Rückrechnung aus Bildern. Identische Zuordnung für alle sieben Eingänge. ICON-Grundprodukt zunächst neun Kerntermine, ohne zusätzliche Kurzfristverdichtung.

Horizonte: D2 48 h, EU 120 h, ICON 00/12 bis180 h bzw06/18 bis120 h, GFS384 h, IFS360 h. Es sind Obergrenzen für die jeweils überprüften Felder, keine garantierte vollständige Publikation. Endpunkt zuerst und danach 24h-Kontext/+60/+72, round-robin über Modelle, strikt gleicher Zyklus ohne älteren Zusatzlauf. Fehlende Komponenten lassen die vorhandenen Kerntermine bestehen. Browser akzeptiert nur freigegebene, SHA-/zeitgebundene Termine mit modell-/zyklusbezogener Obergrenze und höchstens30 Frames.

Nach72h werden alle Komponenten gemeinsam um Faktor2 abgetastet; tatsächliche Rasterauflösung steht in Feld und Referenz und wird in der Legende gezeigt. Dies begrenzt Datenlast bei geringerem Detailbedarf im langen Horizont. Zusätzliche Aufbereitung hat nach den etablierten Kernen ein 360s-Budget zwischen Terminen; Requests behalten begrenzte Timeouts/4 Worker. Neue ICON-Grunddaten sind optional; bei unzureichendem Platz entfallen sie vor etablierten Kernen. Speicherpruning schützt Modellendpunkte nach Möglichkeit, ohne 900-MB-, RUC-/EPS- oder Releasegates zu verändern. Eine erfolgreiche reale Datenpublikation wird separat vom Frontendrelease nachgewiesen.

Gemeinsames Kartentermin-Dropdown und Navigationsanzeige enthalten `weekday:short` in de-DE (Mo/Di/Mi/Do/Fr/Sa/So) in der Standort-Zeitzone, inklusive Datum gegen Mehrtagesverwechslung.

## Quellen

DWD ICON-Datenbankbeschreibung: https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon/icon_dbbeschr_aktuell.pdf
DWD Originalfelder: https://opendata.dwd.de/weather/nwp/icon/grib/
ECMWF Open Data: https://www.ecmwf.int/en/forecasts/datasets/open-data
NOAA GFS-Inventar: https://www.nco.ncep.noaa.gov/pmb/products/gfs/

## Validierung

Reales DWD ICON Global 2026-10-08 00Z, +180h (15.10. 12Z): sieben native meteorologische Felder plus CLAT/CLON, 83×173 Übersichtspunkte, 56-km-Raster. Komprimiertes Feld 113849 Bytes, SHA256 `b565e6e262747b86a6b5f76538c6d72fc27264dc67cc831ce17f66b4b5844ba2`; vollständige unveränderte Frontend-Feldprüfung erfolgreich. Die Windvektordichte verwendet ceiling statt rounding, damit auch das gröbere Raster die unveränderte Obergrenze einhält.

24 Kartenfälle und 24 Skybarfälle über Smartphone/Tablet/Desktop, Classic/Next und Hell/Dunkel erfolgreich. Zusätzlicher C23-Test prüft die 41-%-Nacht, fehlende Werte, alle Bandschwellen, verschiedene Tooltipwerte bei gleicher Dicke, Stundenmittel und konsistente Icons einschließlich erhaltener Niederschlagsphänomene sowie zyklusabhängige Horizontgrenzen.

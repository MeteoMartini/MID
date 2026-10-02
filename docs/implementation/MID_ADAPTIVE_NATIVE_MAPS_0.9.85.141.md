# MID-C11 · adaptive Spannen und direkte Wetterkarten · .141

Basis: veröffentlichte .140, main = mid-stable = 87875585c773edf5fcb508cbe3466c7f98c08481. Vor Integration erneut abgeglichen; keine überlappende offene Produkt-PR.

## Daten- und Darstellungsverträge

- Tagesprognosen: valide P10/P25/P75/P90 je Parameter getrennt; Temperaturmaxima/-minima, Tagessumme, maximaler Mittelwind und Böen. Vergleichbare Skalen je Parameter über sichtbare Tage; ausgewählte Windeinheit aus dem kanonischen kt-Vertrag. Fehlende Spannen bleiben unbekannt. Keine künstliche Umrechnung von Tagesquantilen zu Stundenquantilen. Kurzfrist weist diese Grenze aus; bestehende Radarspannen bleiben Szenariospannen, nicht kalibrierte Konfidenzintervalle.
- Niederschlag: echte Null `0`, positive Werte unter Anzeigepräzision `<0,1` bzw. `<0,01`, unbekannte/negative Werte `–`. Keine Änderung physikalischer Schwellen oder Akkumulationen.
- RADOLAN RW: stationsangeeichte stündliche Radaranalyse. Das Produkt wird alle zehn Minuten rollierend aktualisiert; summiert werden ausschließlich nicht überlappende Stunden mit Endminute :50. Zeitstempel, INT 60, PR und 900×900-Geometrie werden geprüft. Native 1-km-Zellen werden für die Darstellung auf ein 0,04°-Raster abgetastet; Ortswerte stammen exakt aus diesem dargestellten Raster. Fehlende Stunden entfernen das gesamte betroffene Fenster; fehlende Zellen erhalten Sentinel -1, graue Maske und unbekannten Ortswert, niemals Null.
- ICON-D2: direkte DWD-GRIB2-Lat/Lon-Aufbereitung 0,02° im bestehenden Deutschlandausschnitt. Acht Parameter, Termine T+1/+3/+6/+12/+24/+48. Keine zeitliche Interpolation. Temperatur 2 m, MSL-Druck, Wind/Böen 10 m, Gesamtbewölkung, WW und ThetaE 850 hPa. Einstündliche Niederschlagsmenge = gleichlaufendes TOT_PREC(T) − TOT_PREC(T−1), nicht kumulierte Summe oder durch Vorlauf geteilte Menge. Böen beziehen sich auf das tatsächliche GRIB-Maximumintervall. Druckkonturen sind zur Darstellung ausgedünnt, Ortswerte nicht.
- Karten: Basemap, Grenzen/Ortsnamen über Wetterfeld, Favoritenauswahl, transparente Fehlermeldungen, PNG/SVG mit Lauf, Termin, Einheit und Quellenhinweis. Mess-/Prognosekarten bleiben getrennt. Legacy-ICON-D2-Kombinationen nutzen nun volle native Felder statt des 99-Punkte-API-Rasters.
- Andere Modelle bleiben auf dem DWD-WMS-Pfad; ein flächiger nativer Globaladapter ist nicht Bestandteil dieser Version. Drei nicht im verifizierten GetCapabilities gelistete WW-Layer werden aus der Auswahl gefiltert; bestehende IDs bleiben migrationsfähig. WMS-Bilder liefern keine verifizierten numerischen Ortswerte: solche Werte werden nicht erfunden.

## Kosten, Lizenzen und Publikation

Keine neue kostenpflichtige API, keine Registrierungs- oder Schlüsselpflicht. DWD CC BY 4.0 mit Attribution/bearbeitet-durch-MID, Grenzen Natural Earth Public Domain, OSM-Basemap ODbL. Neue Datensätze laufen in der vorhandenen RUC-Pages-Pipeline; Inhaltshashes verhindern mutierende Cache-URLs. Objekte besitzen SHA256 und Bytezahl, bestehendes 900-MB-Budget bleibt unverändert. Browser lädt nur das gewählte Feld, nicht sämtliche 48 Felder. Live-Test: 410×505 Zellen, 48 Feldobjekte, insgesamt ca. 39,5 MB; RADOLAN fünf vollständige Fenster ca. 0,68 MB.

Ein Release bewahrt den vorhandenen RUC-Snapshot; neue Produkte erscheinen mit der nächsten erfolgreichen regulären Datenaufbereitung. Fehlende neue Manifest-Einträge erscheinen ehrlich als „wird vorbereitet“, nicht als scheinbare Nullfelder.

## Prüfungen

- Required Node regression `scripts/test-adaptive-native-maps-0985141.mjs`: Parameterunabhängigkeit, Mengenformat, Messzeitfenster, Sentinel, raster/time/kind/unit validity, SHA256.
- Python `tools/ruc/test_native_map_products.py`: RW Flags/Einheiten/Zeitstempel, vollständige Summen, ThetaE/Isobaren und immutable Pages-Objekte inklusive Hashfehler. Bestehende Tests bleiben unverändert meteorologisch verbindlich.
- Ältere Textformatregression erwartet bewusst neuen kompakten Helfer; ältere Funktionsauslese endet jetzt vor neuem Typblock. Keine Abschwächung eines gültigen Datenvertrags.
- Browser-Radarprüfung mit vollständigen Ensemble-Mittelwerten im Fixture; 24 Geräte/Theme/Coverage-Varianten. Native Karten erhalten ergänzende Browserprüfung.

Release nur Source-PR-Gate → Agent Source Release → Installer/Worker/Pages → verified mid-stable. Keine manuelle Promotion.

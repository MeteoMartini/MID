# MID v0.9.85.138 · Radar-Intensität, Niederschlagskonsistenz und UTCI appweit

Verifizierte Basis: `main == mid-stable == b013e6664966111fa2c466ba8cabb3520421b435` (v0.9.85.137). Der vorhandene Entwicklungszweig wurde übernommen, nicht neu aufgebaut.

## Radar-Nowcast
Die Balkenhöhe war an den final kalibrierten/aufgeteilten Mengenbeitrag `segment.amount` gekoppelt. Für die Achse `mm/5 min` ist jedoch die jeweilige Radarintensität maßgeblich. Skala und Balkenhöhe verwenden deshalb jetzt `rate × 5/60`; die kalibrierte Reihe bleibt ausschließlich für die vollständige/partielle 120-Minuten-Summe erhalten. Maximum, Halbwert und Null liegen im Smartphone-Layout auf demselben 24-px-Raster; Datenlücken bleiben schraffiert.

## Niederschlagsintensität
`precipitationIntensityDescriptor` bleibt die einzige zentrale Klassifikation für Texte, Piktogramme, Skybar und Radar. Bei vorhandener Rate priorisiert auch die Aktuell-Kachel diesen Deskriptor, damit Zahlenwert und Textstufe denselben Intervallvertrag nutzen. Für Dauerregen: leicht bis 0,5 mm/h, mäßig >0,5 bis 4 mm/h, stark >4 mm/h; Schauer, Sprühregen, Schnee und weitere Phasen behalten ihre eigenen WMO-/DWD-Regeln. 1,9 mm/h Dauerregen ist damit „mäßig“. DWD-Hintergrund zur mengen-/zeitbezogenen Niederschlagsintensität: https://www.dwd.de/DE/leistungen/pbfb_verlag_leitfaeden/pdf_einzelbaende/leitfaden6_pdf.pdf?__blob=publicationFile&v=3

## UTCI
`src/utci.ts` ist die zentrale UTCI-Implementierung. Die kanonische stündliche Reihe schreibt `Hour.apparent` nach lokalen/fachlichen Forecast-Korrekturen mit UTCI und markiert `apparentKind: 'utci'`. Kurzfrist, Profil/Cockpit, Event, Wasser und Bergwetter verwenden damit denselben Index. Tmrt wird mangels Direktfeld getrennt vom UTCI-Polynom aus UVI, Bewölkung, Tageszeit und Höhe geschätzt. Die Stressklassen folgen den Standardgrenzen <−40, −40/−27/−13/0/9/26/32/38/46 °C. Referenz: https://climate.copernicus.eu/GCH2025-about-data-and-methods

Regression: `scripts/test-radar-utci-consistency-0985138.mjs`. Kein neuer Datenanbieter oder API-Key. Veröffentlichung ausschließlich über den etablierten Source-PR-/Releasepfad.

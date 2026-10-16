# MID v0.9.85.277 · Modell-Wolkenbild: Beobachtungsübergang und Isobaren

## Quelle, Grenze
Verifizierter `main=mid-stable=ff30648863744759aca9b28c524662e3f65ba496`, v0.9.85.276. GitHub Issue #386. Keine Replit-/Chat-Artefakte als Quelle. Alle bestehenden Modelle, Niederschlagsarten und Renderstandards erhalten.

## Beobachtung → Modell
Die vorhandene gemeinsame Beobachtungs-/Nowcast-/Prognosezeitachse aus `RadarPanel.tsx` und `CompositeTimeline.ts` bleibt die einzige kanonische Zeitquelle. Bei Wolken-/signifikantem Wetter blendet der gemeinsame Kartenrenderer den Modell-Overlay während **aller** Beobachtungs- und Nowcastframes aus. Nur bei explizit bestätigtem Modellframe erscheint die Wolken-/WW-Karte. Für den schematischen Modellwolkenmodus erhält der Forecast-Quellenmarker `Modell-Wolkenbild (schematisch)`; echtes Satellitenmaterial behält seine Messherkunft und exakte Zeit. Radar/Nowcast bleibt getrennt. Satellitenbeobachtungen sind nur sichtbar, wenn Nutzer die bestehende Satellitenebene aktiviert haben und Daten verfügbar sind. Kein erzwungenes Aktivieren, keine künstlichen Beobachtungen, keine WMO-Interpolation und keine wissenschaftlich unzulässige IR-Äquivalenz.

## Optionale MSLP-Isobaren
Persistenter Schalter auf beiden Kartenansichten. DWD ICON-D2 verwendet das geprüfte native Druckfeld und bei Bedarf seine Synoptikquelle; ICON-EU und ICON Global verwenden ihre jeweils eigenen geprüften Synoptikdruckkonturen. Alle Quellen müssen exakt zum gewählten CLCT+WW-Modell, Initialisierungslauf **und** Valid Time passen. Einheit hPa, bestehende native Konturvisualisierung; keine Vermischung mit fremden WMS-/GDPS-/Modellterminen. Bei fehlendem paarigem Konturfeld bleibt Karte ohne Isobaren; kein altes Konturfeld zeigen. Exportiert werden dieselben ausgewählten Konturpfade sowohl im SVG als auch im daraus abgeleiteten PNG. Ausgeschaltete / fehlende Konturen erscheinen auch im Export nicht.

## Tests und technische Grenzen
Neue Pflichtregression `scripts/test-pseudo-satellite-isobars-0985277.mjs`: echte Beobachtung/Modellframes ohne erfundene Schritte, Sichtbarkeitsgating, identische Run-/Time-Prüfungen, Persistenz, beide Kartenverbraucher und SVG/PNG-Export. Bestehende WMO-/Missing-/Cloud-Regression 0.9.85.276 bleibt Pflicht. Browser-/Simulatorprüfung ist keine reale iOS-/VoiceOver-Abnahme. Kein Release ohne Source-Core + Heavy + MID-Installer + Worker/Pages + Stable-Promotion.

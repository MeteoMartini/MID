# MID-C18 · Bergwetter und Gefrierregen · 0.9.85.176

Integrationsbasis: freigegebene .175 6672724f5db666ead24e244ea04f0870c37f8fe2 (main = mid-stable). Parallelrelease .175 (Widget-Exportprofile, PR265) vollständig erhalten; Integration aus neuem Stable-Arbeitsbaum ohne Übernahme alter Widgetdateien. Keine Workflow-, Runner- oder Gateänderung.

## Darstellung

7d-Wind: getrennte Maxima aus derselben gewählten Höhenreihe; heute nur verbleibende Prognosestunden. Richtung gehört zur stärksten Böe. Fehlende Wind-/Böenwerte bleiben unbekannt. Farbstufen ab 22/34/48 kt (Bft 6/8/10), unabhängig von Anzeigeeinheit. Neuschneefarben nach Menge pro gezeigtem Zeitraum: positive Spur, 1/5/20 cm. Keine zusätzliche Warnklassifikation.

Tablet 621–1280 px: gleich breite untere Kennwertspalten, statt einer Sonnenscheinspalte auf dem 24-px-Pfeilraster. Stundenwettertexte ohne Ellipse. Gleiche Höhenreihe und unveränderte Datenlückenverträge.

## Gefrierregen

WMO 56/57 und 66/67 bedeuten gefrierenden Sprühregen/Regen; 68/69 bedeuten Regen und Schnee gemischt. Keine Umbenennung zu Schneeregen. Die zusätzliche Prognose-Plausibilitätsprüfung ist eine konservative Heuristik: Temperatur mindestens 4 °C und approximierte Feuchtkugeltemperatur mindestens 2 °C. Sie korrigiert den Wettercode zur flüssigen Phase, ohne Schnee zu erfinden. Der bestehende breitere Wärmefilter bleibt erhalten. Explizite Beobachtungen und bekannte Oberflächentemperatur ≤0,5 °C erhalten das Gefrier-Signal. Fehlende Feuchte oder trockene Luft genügen dem Zusatzfilter nicht. Ohne Bodeninformation sind lokale Vereisung und kalte Oberflächen weiterhin nicht ausgeschlossen.

Berg-Stundenintervalle verwenden für die Phasenplausibilität den kälteren bekannten Intervallendpunkt und dessen Feuchte. Ein Temperaturabfall zum Intervallende darf nicht durch den warmen Startwert überstimmt werden. Anzeigezeit und Momentantemperatur bleiben unverändert.

## Neuschnee: bestätigte Grenzen

Der Abruf verwendet snowfall des Höhenmodells und summiert vollständige Stundenintervalle. Open-Meteo leitet für die verwendeten Modellfamilien Neuschnee aus dem modellierten gefrorenen Wasseranteil mit 0,7 cm/mm ab. Nicht das gesamte Niederschlagswasser wird zu Schnee. Lufttemperatur wirkt im Modell auf die Phase; die ausgegebene Höhe hat jedoch keine dynamische Schneedichte. Bodenwärme, Setzung und Schmelzen betreffen die Schneedecke, nicht allein die fallende Schneemenge. snow_depth und Stationsmessung bleiben getrennte Produkte. Eine bloß lufttemperaturabhängige zweite Umrechnung oder pauschale Boden-Abschmelzkorrektur wäre ohne vertikale Mikrophysik, Schneezustand und Energieflüsse nicht belastbar. Deshalb keine erfundene Akkumulationsbilanz; Methodik im UI offengelegt.

Primärquellen: https://open-meteo.com/en/docs/dwd-api und https://open-meteo.com/en/docs/ecmwf-api (0,7 cm/mm); https://www.weather.gov/ama/preciptypes (Gefrierregen, vertikales Temperaturprofil und Oberfläche).

## Prüfung

Neue Verhaltenstests: warme/kalte/trockene/observierte Gefrierregenfälle, kalte Oberfläche, Schneeregen getrennt von Gefrierregen, Temperaturabfall im Folgeintervall, fehlende Farbwerte und Schwellen. Bestehende Refactoring-Fingerprints werden ausschließlich für bewusst geänderte Bergfunktionen und CSS-Kaskade aktualisiert; Widget-Fingerprints, alle Tests und Sicherheitsschranken erhalten. Vollständiges Source-/Installer-Gate bleibt Pflicht. Lokale Browsermatrix benötigt Chromium; fehlender Browser wird nicht als visuelle Verifikation behauptet.

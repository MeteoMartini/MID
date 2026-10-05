# MID-C17 · gemeinsame Wetterkarte · 0.9.85.167

Verifizierte Basis: main = mid-stable = a40e2fbc12ea4c24b206e4904c3f03a3293fadc6 (.166). Bestehende Prognose- und ECMWF-Einstellungsarbeiten bleiben unverändert.

## Aufbau

MapWorkspacePanel lädt genau eine memoisierten UnifiedWeatherMap. RadarPanel liefert den gemeinsamen MapLibre-Viewport, bestätigte Produktzeitachse und bestehende Radar-/Satelliten-/Blitz-/Zellen-/Zugspur-/Warnungsfunktionen. Frühere Modus-Tabs, Synoptikbilder und Konturenabrufe sind hier nicht aktiv; historische Komponenten bleiben zur Vertrags- und Rückwärtskompatibilität im Repository. Kein RainViewer-Abruf oder Renderfallback, keine groben Satellitenprodukte mit unbekannter oder über 1 km Rasterweite.

OpenFreeMap/OpenMapTiles-Vektorgeographie bildet eine ruhige Basis. Reihenfolge: Modell/Messraster, Satellit, Radar, Warnungen/Isobaren, Grenzen/Ortsnamen, Ortsmarker. Wetterlayer sind unabhängig schaltbar; Deckkraft ist je Layer erreichbar. Länder-/Verwaltungsgrenzen und Ortsnamen bleiben oberhalb der Wetterflächen. Natural-Earth-Kontext und Ortsmarker ergänzen die Vektorkarte.

## Wissenschaftlicher Vertrag

- ICON-D2: acht direkte GRIB2-Felder, keine Karten-Screenshots. Bestehende unveränderliche Laufobjekte, SHA256-/Byte-/gzip-/Raster-/Einheitenprüfungen, kanonische Skalen und Windformatter gelten weiterhin.
- Summen: bestehende ICON-D2-/RADOLAN-Publikationsstrecke. Kleines Manifest entdeckt publizierte Produkte; große Raster laden erst bei Auswahl. Vollständigkeit und Zeitfenster werden vor Darstellung geprüft. Fehlende Messzellen bleiben unbekannt, keine Ersatznullen.
- Weitere Modelle: nur freigegebene DWD-WMS-Feldprodukte, mit 512-px-Kacheln, bestätigter Gültigkeit, Lauf und Höhen-/Druckfläche. Originaleinheiten und Originalfarben sind ausdrücklich beschriftet. Nicht verfügbare Wettercodeprodukte werden nicht angeboten. Temporäre Ausfälle bleiben sichtbar und erzeugen keinen Ersatzwert.
- Eine Fähigkeitsmatrix unterstützt Parameter-zuerst und Modell-zuerst. Rollende 1/3/6/24-h-Summen, Laufakkumulation, D2-Summenfenster, Messsummen, Höhen und EPS-Produkte sind verschiedene Parameter. Böenwahrscheinlichkeit ist keine Böengeschwindigkeit; Ensemblefelder sind keine deterministischen Felder.
- Zeitachse: nur bestätigte Produktstände, maximal bestehendes Workerfenster +204 h. D2 zeigt nur tatsächlich publizierte Termine. Kein interpoliertes Modellraster: nächster realer D2- oder WMS-Termin nur innerhalb 90 Minuten, tatsächlicher Rastertermin steht im Status. Radar/Satellit werden außerhalb eigener Gültigkeit ausgeblendet; keine Beobachtung als mehrtägige Prognose. Die Browsermatrix enthält absichtlich einen Radarstand zwischen den stündlichen Modellterminen.
- D2-Isobaren: derselbe Modelltermin wie die D2-Fläche. Keine analysierten Fronten aus ThetaE und keine amtliche Warnung aus Modell-Wettercodes behaupten.
- Legenden, Abfrage, Favoritenwerte und PNG/SVG verwenden dieselben kanonischen Felder/Einheiten. Export ist ein numerisches Raster mit Ortswerten, keine Radar-/Satellitenmontage. WMS-Abfragen prüfen Quelle, Lauf, Termin, Position, Niveau und Einheit; unbestätigte Ortswerte bleiben leer.

## Bedienung, Speicherung und Budget

Eine Karteninstanz bleibt bei Modell-/Parameterwechsel erhalten. Abbrechbare Abrufe, maximal acht native Cachefelder und ein verifiziertes Nachbarfeld im Prefetch. WMS lädt aktiven und nächsten bestätigten Termin zusätzlich zu MapLibres Kachelcache; maximal 16 Bereitschaftsmarken. Auswahlrichtung, Layer, Deckkraft, Fenster und Isobaren werden synchron über writeDurableStorageValue unter mid:unified-map:v1 geschrieben. Alte Summeneinstiege bleiben Navigationsalias, überschreiben aber gespeicherte ausgeschaltete Layer beim Neustart nicht.

## Prüfungen und bewusster Vertragswechsel

Neue Pflichtregression test-unified-map-layers-0985167.mjs; unter CI echte vollständige Komponenten in Chromium. Zwölf Fälle: 320/390/412/844/1024/1440 px × hell/dunkel; ein Viewport, keine getrennten Tabs/alten Abrufe, Integrität echter Fixture-Raster, gezeichnete Grenzen/Orte, Matrix in beiden Richtungen, Prognosewechsel, On-demand-Summen und Speicherung bei sofortigem Reload. Keine Konsolen-/Laufzeitfehler oder Seitenüberläufe erlaubt. Kontrollierte Netzwerk-Fixtures, kein behaupteter Live-DWD-Integrationsnachweis.

Historische Assertions auf zwei lazy Karten oder Radar-Synoptik-Autostart wechseln absichtlich zu einer lazy Karte und ausgeschalteter alter Synoptik. Numerische Zeit-, Raster-, Probe-, Export-, Einheiten- und Meteorologieprüfungen bleiben bestehen. Dormante alte Kartenkomponenten werden ausdrücklich in der Graphprüfung erfasst, nicht wieder in die Live-Oberfläche eingebunden.

Release nur Source-PR → SHA-gebundener Release-Bot → Installer → Pages/Worker → mid-stable. Keine direkte Produktions-/Stable-Schreiboperation.

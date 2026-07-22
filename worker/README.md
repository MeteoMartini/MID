# MID Daten-, Warnungs- und Radarproxy v0.7.59

Funktionale Änderung in v0.7.59: Die DWD-RV-Punktabfrage per GetFeatureInfo wird nun auch bei zunächst trocken wirkenden Kartenpixeln durchgeführt. Dadurch können schwache Echos die vereinfachte Farbauswertung korrigieren; Diagnosewerte weisen Punkt- und Kartenfallbacks getrennt aus.

Funktionale Änderung in v0.7.41: `best_match` wird für das vertikale Meteogramm auf eine konsistente ECMWF-IFS-HRES-Druckniveauzeitreihe abgebildet. Dadurch entstehen nach dem Ende eines kurz laufenden Regionalmodells keine leeren Profilfelder. Der Worker liefert weiterhin die tatsächliche Modelllaufzeit über `forecastHours`.

## Druckniveau-Meteogramm v0.7.41

`?mode=meteogram&lat=...&lon=...&elevation=...&model=...` lädt und cached stündliche Open-Meteo-Druckniveauprofile von Stationsniveau bis 300 hPa für maximal 168 Stunden. Zulässig sind Best Match, DWD ICON-D2/EU/Global, Météo-France ARPEGE Europa, ECMWF IFS HRES und NOAA GFS 0,25°.


Der Cloudflare Worker stellt browserkompatibel Stationsdaten, amtliche Warnungen und die standortbezogene Radar-Nowcast-Auswertung bereit. Ein zweiter Worker ist nicht erforderlich.

## Komposit- und Modellrouten v0.7.41

- `rainviewer-meta` stellt die öffentliche RainViewer-Historie CORS-sicher und 120 Sekunden gecacht bereit. Zukunftsframes werden nur weitergereicht, wenn der Anbieter sie tatsächlich meldet.
- `composite-times` liefert bis zu 150 Minuten Satelliten- und 130 Minuten Blitzhistorie sowie einen Publikationspuffer für verspätet eintreffende Satellitenprodukte.
- H-SAF-Niederschlagsprodukte werden in der Reihenfolge MTG H40B (sobald als WMS-Layer vorhanden) und MSG H60B ausgewählt.
- `model-contours` lädt ein großräumiges 17×25-Stützraster in kurzen Zeilenabfragen, erzeugt geglättete dynamische Isobaren und 500-hPa-Isohypsen im Abstand 8 gpdm und erkennt zusätzlich räumlich getrennte H-/T-Druckzentren. Die Antwort wird 15 Minuten gecacht.
- `composite-wms` akzeptiert die neuen freigegebenen H-SAF-Layer und berücksichtigt die längere Veröffentlichungsverzögerung von Satellitenprodukten.


## Hochauflösendes Radar v0.7.41

Der Endpunkt `px250-meta` prüft für deutsche Orte zuerst das nationale DWD-HX-Komposit (`weather/radar/composite/hx`) mit 250-m-Raster. Ein aktuelles PX250-Standortprodukt dient nur noch als Fallback. `px250-file` validiert Produkt, Dateiname und Aktualität erneut.

## Kompatibilität v0.7.41

Der Worker wurde funktional erweitert. Die Route `mode=composite-wms` leitet ausschließlich freigegebene Layer, valide Zeitstempel und notwendige WMS-Kartenparameter an DWD beziehungsweise EUMETSAT weiter, setzt CORS-Header und verwendet beim DWD automatisch den Ausfallserver. `composite-times` liefert Zeitwerte einheitlich als ISO-Zeit, ergänzt den tatsächlich verwendeten DWD-Radar-Layer und die Serverzeit und trennt jede Zeitdimension strikt nach Produkt. DWD-RV stellt für die Oberfläche – soweit vom Dienst angeboten – ein reales relatives Fenster von −1 Stunde bis +2 Stunden bereit; künstliche Zukunftsframes werden nicht erzeugt.


### Zusätzliche Absicherung in v0.7.41

- `px250-meta` akzeptiert nur frische Standortprodukte und prüft mehrere nahe Radarstandorte. `px250-file` validiert den Zeitstempel des Dateinamens erneut, sodass alte Cache-Verweise nicht mehr ausgeliefert werden.
- `composite-wms` weist Zeitpunkte außerhalb des jeweils zulässigen Radar-, Satelliten- oder Blitzfensters zurück.
- Satellitenprodukte ohne vollständige Zeitreihe werden als `latestOnly` gemeldet; sofern die Capabilities einen letzten exakten Zeitpunkt enthalten, wird dieser zusätzlich als `latestTime` fixiert.
- Blitzortung.org ist keine Worker-Quelle. Die Anwendung übernimmt lediglich eine ähnliche alterscodierte Darstellung; Rohdaten werden ausschließlich aus freigegebenen DWD- beziehungsweise autorisierten kommerziellen Quellen bezogen.

Der Worker erweitert die bestehenden Stations-, Warnungs- und Nowcast-Dienste um zeitlich begrenzte Radar-/OPERA-Filmfenster und eine ortsabhängige Blitzquellenwahl. Mit autorisierten Xweather-Zugangsdaten werden weltweite Vaisala-/GLD360-Punktdaten genutzt; ohne Zugangsdaten bleiben DWD-Blitzgeometrien in Deutschland und EUMETSAT MTG-LI als freier Satelliten-Fallback erhalten. Die bisherigen Schnittstellen bleiben kompatibel.

## Enthaltene Dienste

- NOAA AviationWeather METAR – weltweit, ohne eigenes Secret
- DWD Open Data über Bright Sky – Deutschland, mehrere deduplizierte Messpunkte ohne eigenes Secret
- GeoSphere Austria/TAWES – Österreich, ohne eigenes Secret
- openSenseMap/senseBox – offene Außenmessungen, ohne Secret und nur als niedrig gewichtete Zusatzquelle
- Weather Underground/The Weather Company PWS – optional
- Netatmo öffentliche Außenmessungen – optional
- Synoptic Data Latest – optional, mit QC
- Xweather Observations/PWS – optional, mit QC-/Vertrauenswerten
- DWD-Warnungen – Deutschland
- MeteoAlarm/CAP – unterstützte europäische Länder
- NOAA/NWS Active Alerts – USA
- Radar-Nowcast: DWD-RV in Deutschland, EUMETNET OPERA/ORD in Europa und RainViewer als Fallback
- PX250-Metadaten und HDF5-Dateiproxy für das hochaufgelöste lokale DWD-Radarprodukt
- EUMETNET-OPERA-RATE-Punktraster einschließlich kompakter Historie bis ungefähr 60 Minuten für die europäische Kartenvisualisierung
- Ortsabhängige Blitzquelle: optional weltweite Vaisala-Xweather-/GLD360-Punktdaten, sonst DWD-Blitzgeometrien in Deutschland und MTG-LI-Raster im Satellitenabdeckungsbereich
- Reale, layergebundene WMS-Produktzeitpunkte sowie dynamische Satellitenproduktwahl (`composite-times`)
- CORS-sicherer DWD-/EUMETSAT-Kartenproxy mit DWD-Ausfallserver (`composite-wms`)

## Bereitstellung

1. In Cloudflare einen Worker anlegen oder den vorhandenen MID-Worker öffnen.
2. Den gesamten Inhalt von `worker.js` in den Codeeditor einsetzen.
3. **Deploy** ausführen.
4. Die Worker-Adresse in GitHub als Repository-Variable `VITE_METAR_PROXY_URL` hinterlegen.

Optional kann dieselbe Adresse als `VITE_ALERT_PROXY_URL` und `VITE_RADAR_PROXY_URL` gesetzt werden. Ohne diese Variablen verwendet MID automatisch `VITE_METAR_PROXY_URL` auch für Warnungen und Radar.

## Optionale Secrets

Unter **Worker → Settings → Variables and Secrets** können folgende Secrets gesetzt werden:

```text
WEATHER_COM_API_KEY       # alternativ WU_API_KEY
NETATMO_ACCESS_TOKEN
SYNOPTIC_TOKEN
XWEATHER_CLIENT_ID
XWEATHER_CLIENT_SECRET
XWEATHER_LIGHTNING_ENTERPRISE  # optional: true bei freigeschalteter Lightning-Enterprise-Historie
ENABLE_OPENSENSEMAP        # optional: false deaktiviert die offene Citizen-Science-Quelle
```

Alle Secrets sind optional. Ohne sie bleiben NOAA-METAR, DWD Open Data/Bright Sky, GeoSphere Austria/TAWES, openSenseMap und amtliche Warnungen aktiv. `ENABLE_OPENSENSEMAP=false` ist eine normale Worker-Variable, kein Secret.

- Weather Underground, Netatmo und Xweather werden nur über offizielle, entsprechend berechtigte API-Zugänge verwendet.
- Die Xweather-Zugangsdaten werden zusätzlich für den weltweiten Lightning-Endpunkt genutzt. Der Standardzugang liefert die letzten fünf Minuten; mit `XWEATHER_LIGHTNING_ENTERPRISE=true` fordert MID eine auf 2.500 Treffer begrenzte Historie bis 60 Minuten an. Ohne passenden Tarif bleibt die globale Punktquelle deaktiviert; MID fällt transparent auf die freien regionalen Quellen zurück.
- `SYNOPTIC_TOKEN` ist ein Synoptic-Weather-API-Token.
- Netatmo benötigt einen gültigen OAuth-Access-Token. Ein statisch hinterlegter Access-Token muss nach Ablauf erneuert werden; der Worker führt ohne zusätzliche persistente OAuth-Infrastruktur keine automatische Tokenrotation durch.
- Secrets niemals als öffentliche GitHub-Variable oder `VITE_*`-Variable eintragen.

## Diagnose

Gesundheitstest:

```text
https://DEIN-WORKER.workers.dev/?mode=health
```

Beispielantwort:

```json
{
  "ok": true,
  "version": "0.7.36",
  "services": ["stations", "alerts", "hyperlocal-networks", "model-assisted-local-analysis", "radar-nowcast", "px250-proxy", "opera-grid-history", "rainviewer-metadata", "best-location-lightning", "composite-product-times", "model-contours", "cors-safe-composite-wms"],
  "providers": {
    "NOAA AviationWeather": true,
    "DWD Open Data / Bright Sky": true,
    "GeoSphere Austria": true,
    "openSenseMap / senseBox": true,
    "Weather Underground": false,
    "Netatmo": false,
    "Synoptic Data": false,
    "Xweather": false
  }
}
```

Kompositbild-Diagnose für Niederkassel:

```text
https://DEIN-WORKER.workers.dev/?mode=px250-meta&lat=50.82&lon=7.04
https://DEIN-WORKER.workers.dev/?mode=opera-grid&lat=50.82&lon=7.04
https://DEIN-WORKER.workers.dev/?mode=lightning-points&lat=50.82&lon=7.04
https://DEIN-WORKER.workers.dev/?mode=composite-times&lat=50.82&lon=7.04
https://DEIN-WORKER.workers.dev/?mode=rainviewer-meta&lat=50.82&lon=7.04
https://DEIN-WORKER.workers.dev/?mode=model-contours&lat=50.82&lon=7.04
```

Der von `px250-meta` zurückgegebene `fileUrl` verweist auf denselben Worker und darf direkt vom Frontend geladen werden. PX250, OPERA und die freien DWD-/MTG-LI-Fallbacks benötigen keine zusätzlichen Secrets. Für weltweite Xweather-/GLD360-Blitzpunkte sind `XWEATHER_CLIENT_ID` und `XWEATHER_CLIENT_SECRET` erforderlich.

Stationsabruf für Innsbruck:

```text
https://DEIN-WORKER.workers.dev/?lat=47.26&lon=11.39&radius_km=140
```

Für einen funktionierenden österreichischen Abruf sollte `diagnostics.sourceRows["GeoSphere Austria"]` größer als `0` sein.

Stationsabruf für Cagliari:

```text
https://DEIN-WORKER.workers.dev/?lat=39.2238&lon=9.1217&radius_km=140
```

Die Antwort enthält:

- `data`: verfügbare Einzelstationen
- `providers`: aktivierte optionale Anbieter
- `diagnostics.sourceRows`: Treffer je Quelle
- `diagnostics.errors`: Fehler je Quelle

Die eigentliche Analyse erfolgt anschließend im MID-Frontend. Für Zielort und Stationsstandorte wird derselbe Best-Match-Modellhintergrund auf der jeweiligen Höhe abgefragt. MID interpoliert die Messungs-minus-Modell-Abweichungen statt rohe Stationswerte zu mitteln. Entfernung, Höhe, Aktualität, Netzqualität, Stadt-/Landlage und robuste räumliche Ausreißerprüfungen bestimmen das Gewicht. Citizen-Science-Sensoren besitzen bewusst kurze Reichweiten und deutlich niedrigere Gewichte.

Synoptic-Abfragen verwenden `qc_checks=synopticlabs` und entfernen Werte, die grundlegende oder erweiterte Qualitätsprüfungen nicht bestehen.

## Warnungstests

Deutschland:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=50.82&lon=7.04&country=DE&name=Niederkassel&region=Nordrhein-Westfalen&language=de
```

Italien:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=39.2238&lon=9.1217&country=IT&name=Cagliari&region=Sardegna&language=de
```

Eine leere Warnungsliste kann korrekt sein. Ein Feld `error` weist dagegen auf einen Abruf- oder Parserfehler hin.


## Radar-Nowcast testen

Deutschland/DWD:

```text
https://DEIN-WORKER.workers.dev/?mode=radar-nowcast&lat=50.82&lon=7.04&country=DE
```

Europa/OPERA:

```text
https://DEIN-WORKER.workers.dev/?mode=radar-nowcast&lat=39.2238&lon=9.1217&country=IT
```

Außerhalb Europas/RainViewer-Fallback:

```text
https://DEIN-WORKER.workers.dev/?mode=radar-nowcast&lat=35.68&lon=139.76&country=JP
```

Die Antwort enthält `source`, `provider`, `quality`, `radarProbability`, `currentRate`, optionale Ankunfts-/Endzeiten und Diagnosewerte. OPERA-Komposite werden unter CC BY 4.0 verarbeitet; die RainViewer-Nutzung ist für persönliche, schulische und kleine Community-Projekte vorgesehen und benötigt eine sichtbare Quellenangabe.

## DWD-Radarrobustheit v0.7.13

- allgemeiner DWD-WMS-Capabilities-Endpunkt statt abgeleiteter, layerspezifischer URL
- gezielte Auswertung der Zeitdimension des tatsächlich verwendeten Layers
- stabiler Alias `dwd:Niederschlagsradar` vor dem konkreten RV-Layer
- kleine transparente `GetMap`-PNG je Zeitschritt als primäre Datenprüfung
- `0 mm/h` aus transparentem Kartenpixel gilt als erfolgreiche DWD-Auswertung
- Mittelpunkt und 2/4/7-km-Umgebung werden aus derselben PNG abgetastet
- `GetFeatureInfo` wird nur zur Verfeinerung sichtbar nasser Pixel verwendet
- auffällige Rasterbandwerte werden gegen die Kartenfarbe plausibilisiert
- Primär- und Backup-Geoserver sowie OPERA-/RainViewer-Fallback bleiben erhalten

## Änderungen in v0.7.13

- DWD-Capabilities berücksichtigen geerbte WMS-Zeitdimensionen.
- Bei laufendem Niederschlag wird das Ende aus dem ersten nachhaltig trockenen Zukunftsfenster berechnet.
- Ein bis zum Ende des Nowcast-Horizonts anhaltendes Echo wird mit `endOpenEnded: true` zurückgegeben.
- `endUncertain: true` kennzeichnet eine Endzeit, die nur auf einem einzelnen trockenen Randframe beruht.
- Die zurückgegebene `timeline` enthält die verfügbare DWD-Zeitachse für die Radarfilm-Steuerung.


## Modelllinien v0.7.41

`mode=model-contours` liefert großräumige, geglättete Konturen. In Europa wird ein einheitlicher ICON-EU-Lauf genutzt, um Modellnähte zu vermeiden. Isobaren werden abhängig vom Druckgradienten mit 1, 2 oder 4 hPa Abstand berechnet; 500-hPa-Isohypsen haben 8 gpdm Abstand.

EuCom ist ein vom DWD für Flugsicherungs-/Flugwetterkunden erzeugtes europäisches Radarkomposit. In den öffentlich auffindbaren DWD-Unterlagen ist kein frei zugänglicher WMS-, Open-Data- oder API-Endpunkt dokumentiert. Der Worker bindet EuCom deshalb nicht ohne kundenspezifische Berechtigung ein.

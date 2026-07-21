# MID Daten-, Warnungs- und Radarproxy v0.7.20.2

Der Cloudflare Worker stellt browserkompatibel Stationsdaten, amtliche Warnungen und die standortbezogene Radar-Nowcast-Auswertung bereit. Ein zweiter Worker ist nicht erforderlich.

## Kompatibilität v0.7.20.2

Der Worker liefert nun zusätzliche Einzelmesspunkte für die modellgestützte hyperlokale Analyse im Frontend. Radar und Warnungen bleiben kompatibel. Offizielle DWD-Beobachtungen werden über Bright Sky an mehreren Suchpunkten gesammelt; openSenseMap kann als niedrig gewichtete offene Zusatzquelle zugeschaltet beziehungsweise deaktiviert werden.

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
ENABLE_OPENSENSEMAP        # optional: false deaktiviert die offene Citizen-Science-Quelle
```

Alle Secrets sind optional. Ohne sie bleiben NOAA-METAR, DWD Open Data/Bright Sky, GeoSphere Austria/TAWES, openSenseMap und amtliche Warnungen aktiv. `ENABLE_OPENSENSEMAP=false` ist eine normale Worker-Variable, kein Secret.

- Weather Underground, Netatmo und Xweather werden nur über offizielle, entsprechend berechtigte API-Zugänge verwendet.
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
  "version": "0.7.20.2",
  "services": ["stations", "alerts", "hyperlocal-networks", "model-assisted-local-analysis", "radar-nowcast"],
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


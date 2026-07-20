# MID Daten-, Warnungs- und Radarproxy v0.7.11

Der Cloudflare Worker stellt browserkompatibel Stationsdaten, amtliche Warnungen und die standortbezogene Radar-Nowcast-Auswertung bereit. Ein zweiter Worker ist nicht erforderlich.

## Enthaltene Dienste

- NOAA AviationWeather METAR – weltweit, ohne eigenes Secret
- GeoSphere Austria/TAWES – Österreich, ohne eigenes Secret
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
2. Den gesamten Inhalt von `metar-proxy.js` in den Codeeditor einsetzen.
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
```

Alle sind optional. Ohne sie bleiben NOAA-METAR, GeoSphere Austria/TAWES und amtliche Warnungen aktiv.

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
  "version": "0.7.11",
  "services": ["stations", "alerts", "hyperlocal-networks", "radar-nowcast"],
  "providers": {
    "NOAA AviationWeather": true,
    "GeoSphere Austria": true,
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

Die robuste Zusammenführung und Ausreißerunterdrückung erfolgt anschließend im MID-Frontend. Dabei werden Entfernung, Höhenunterschied, Aktualität, Anbieterqualität und QC berücksichtigt.

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

## DWD-Radarrobustheit v0.7.11

- Zeitpunkte stammen aus der tatsächlichen WMS-Zeitdimension.
- Primär- und Backup-Geoserver sowie `dwd:Radar_rv_product_1x1km_ger` und der offizielle Alias `dwd:Niederschlagsradar` werden validiert.
- Erst nach einer erfolgreichen Punktabfrage wird die vollständige Zeitreihe geladen.
- Die Anzahl externer Unterabfragen bleibt deutlich unter dem bisherigen Stand.
- `0 mm/h` ist ein gültiger trockener Radarwert.
- Bei einem externen Fehler meldet der Worker `coverageExpected`/`temporaryUnavailable`, statt fälschlich fehlende Abdeckung zu behaupten.

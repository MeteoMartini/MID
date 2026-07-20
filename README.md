# MID – Meteorological Information Dashboard

**Aktuelle Version: v0.7.0**

MID ist ein GitHub-Pages-fähiges Wetterdashboard auf Basis von React, TypeScript und Open-Meteo. Es verbindet Vorhersagen, Ensemblemodelle, aktuelle Stationsmessungen, amtliche Warnungen, Radar, Luftqualität und exportierbare Wetterwidgets.

## Neuerungen in v0.7.0

- aktuelle Wetterdaten können aus mehreren amtlichen und hyperlokalen Stationsnetzen zusammengeführt werden
- robuste, entfernungs-, höhen-, aktualitäts- und qualitätsgewichtete Mittelung mehrerer Stationen
- automatische Ausreißerunterdrückung statt unkritischer Übernahme einer einzelnen privaten Wetterstation
- ENS-Mittel im 14-Tage-Temperaturdiagramm direkt über die Legende ein- und ausblendbar
- klimatologisches Mittel 1991–2020 für tägliche Tmin und Tmax ergänzt und ebenfalls über die Legende schaltbar

## Funktionen

- aktuelles Wetter einschließlich gefühlter Temperatur und Bewölkung in Achteln (n/8)
- Abgleich mit geeigneten amtlichen und optionalen hyperlokalen Messstationen
- kompakte 7-Tage-Übersicht mit gewichtetem Tagescharakter, Tmin/Tmax, Wind, Böen, Niederschlag und Hazards
- interaktive stündliche Detailansicht mit auswählbarer Stunde
- 14-Tage-Ensembleübersicht mit Best Match, P10–P90, ENS-Mittel, Konsistenz und Klimamittel
- amtliche Warnungen: Deutschland über DWD, international über CAP/MeteoAlarm beziehungsweise NWS
- OpenStreetMap-Karte mit DWD-/RainViewer-Radar
- Luftqualität, Dark Mode und Widget-/PNG-Export
- responsive Darstellung für Smartphone, Tablet und Desktop

## Entwicklung

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
```

## GitHub Pages

Unter **Settings → Pages → Source** muss **GitHub Actions** ausgewählt sein. Der Workflow in `.github/workflows/deploy.yml` baut den Branch `main`.

Die öffentliche Worker-Adresse wird in GitHub unter **Settings → Secrets and variables → Actions → Variables** hinterlegt:

```text
VITE_METAR_PROXY_URL=https://DEIN-WORKER.workers.dev/
```

Eine separate Warnungsadresse ist nicht nötig. Optional kann dieselbe Adresse zusätzlich als `VITE_ALERT_PROXY_URL` gesetzt werden.

## Ein gemeinsamer Cloudflare Worker

MID benötigt weiterhin nur **einen** Cloudflare Worker. `worker/metar-proxy.js` übernimmt:

- weltweite NOAA-AviationWeather-METAR-Daten
- optionale hyperlokale Beobachtungsnetze
- deutsche DWD-Warnungen
- europäische MeteoAlarm-/CAP-Warnungen
- NWS-Warnungen für die USA

Nach einer Aktualisierung von `worker/metar-proxy.js` muss der Code im vorhandenen Cloudflare Worker ersetzt und erneut mit **Deploy** bereitgestellt werden.

Gesundheitstest:

```text
https://DEIN-WORKER.workers.dev/?mode=health
```

Die Antwort nennt Version und aktivierte optionale Anbieter, ohne Zugangsdaten offenzulegen.

## Aktuelle Stationsdaten und hyperlokale Netze

MID nutzt je nach Standort und Konfiguration folgende Quellen:

- **NOAA AviationWeather:** weltweite METAR-/Flugplatzbeobachtungen
- **Bright Sky/DWD-WMO:** zusätzliche amtliche Beobachtungen in Deutschland
- **GeoSphere Austria/TAWES:** aktuelle österreichische Stationsdaten
- **Weather Underground / The Weather Company:** optionale PWS-Daten mit berechtigtem API-Schlüssel
- **Netatmo:** optional öffentlich freigegebene Außenmodule über die offizielle API
- **Synoptic Data:** optional Stationen aus Mesonet-/MesoWest-/MADIS-nahen Netzen einschließlich API-QC
- **Xweather Observations:** optional globale Stations- und PWS-Beobachtungen mit QC-/Vertrauenswerten

Es werden keine Anbieter-Webseiten gescrapt. Geschützte Quellen werden ausschließlich über offizielle APIs und nur mit selbst hinterlegten, dafür berechtigten Zugangsdaten abgefragt.

### Robustes lokales Stationsmittel

Der Worker liefert die verfügbaren Einzelstationen an MID. MID bewertet diese anschließend anhand von:

- Entfernung zum Zielort
- Höhendifferenz, in Bergregionen mit strengeren Grenzen
- Alter der Messung
- Anbieter- und QC-Qualität
- Anzahl der zugrunde liegenden Stationen

Ausreißer werden je Messgröße über Median und robuste Abweichungsgrenzen entfernt. Erst danach entsteht ein gewichtetes Mittel für Temperatur, Feuchte, Taupunkt, Druck, Wind und – soweit vorhanden – Niederschlag. Die Windrichtung wird zirkulär gemittelt, damit beispielsweise 359° und 1° korrekt als Nord und nicht als Süd behandelt werden.

Sind zu wenige geeignete Stationen vorhanden, verwendet MID die bestgeeignete Einzelstation. Sind keine ausreichend aktuellen Messwerte verfügbar, bleibt Open-Meteo Best Match der Fallback.

### Optionale Cloudflare-Secrets

Alle folgenden Werte gehören in **Cloudflare → Worker → Settings → Variables and Secrets** und niemals in öffentliche `VITE_*`-Variablen:

```text
WEATHER_COM_API_KEY       # alternativ WU_API_KEY
NETATMO_ACCESS_TOKEN
SYNOPTIC_TOKEN
XWEATHER_CLIENT_ID
XWEATHER_CLIENT_SECRET
```

Ohne diese Secrets funktionieren METAR, Bright Sky/DWD und GeoSphere weiterhin. Die optionalen Netze werden dann einfach übersprungen.

**Netatmo-Hinweis:** Der aktuelle Worker akzeptiert einen gültigen OAuth-Access-Token. Netatmo-Access-Tokens sind nicht als dauerhaftes statisches Secret gedacht und müssen entsprechend dem OAuth-Verfahren erneuert werden. MID speichert oder erschleicht keine Zugangsdaten und greift nur auf öffentlich freigegebene Außenmessungen zu.

Stationsdiagnose, beispielsweise für Cagliari:

```text
https://DEIN-WORKER.workers.dev/?lat=39.2238&lon=9.1217&radius_km=140
```

Unter `diagnostics.sourceRows` ist sichtbar, welche Quellen Treffer geliefert haben. `providers` zeigt, welche optionalen Zugänge im Worker aktiviert sind.

## 14-Tage-Diagramm und Klimamittel

Im Diagramm **Temperaturtrend und Prognoseunsicherheit** sind folgende Darstellungen enthalten:

- Best-Match-Tmin und -Tmax
- gewichtete P10–P90-Spannen der Ensemblemodelle
- ENS-Mittel für Tmin und Tmax
- klimatologisches Mittel für Tmin und Tmax

Die Legendenpunkte **ENS-Mittel** und **Klimamittel Tmin/Tmax** sind Schaltflächen. Ein Klick blendet die zugehörigen Linien ein oder aus; die Y-Achse passt sich an die sichtbaren Reihen an.

Das Klimamittel wird standort- und höhenbezogen aus Open-Meteo ERA5-Land für die Referenzperiode **1991–2020** berechnet. Verwendet werden die Mittel der täglichen Höchst- und Tiefsttemperatur für den jeweiligen Kalendertag. Die auf 366 Kalendertage verdichteten Ergebnisse werden lokal für 180 Tage zwischengespeichert. Es handelt sich um Reanalyse-Klimatologie mit ungefähr 0,1° Rasterweite, nicht um ein Mittel einer einzelnen Ortsstation.

## Amtliche Wetterwarnungen

- **Deutschland:** DWD-WFS auf Gemeindeebene, DWD-CAP als Rückfallquelle
- **Europa:** MeteoAlarm-Atom-/CAP-Feeds der nationalen Wetterdienste
- **USA:** NOAA/National Weather Service Active Alerts

MID zeigt zunächst nur die Überschriften. Der vollständige Meldungstext und vorhandene Handlungshinweise öffnen sich per Klick.

Warnungstest für Niederkassel:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=50.82&lon=7.04&country=DE&name=Niederkassel&region=Nordrhein-Westfalen&language=de
```

Warnungstest für Cagliari:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=39.2238&lon=9.1217&country=IT&name=Cagliari&region=Sardegna&language=de
```

Eine leere Liste `"alerts": []` kann korrekt sein, wenn aktuell keine standortbezogene amtliche Warnung aktiv ist. Fehler werden getrennt ausgewiesen.

## Datenquellen

- Open-Meteo: Best Match, Ensemblemodelle, Geocoding, Luftqualität und ERA5-Land-Historie
- Deutscher Wetterdienst: Warnungen, Radar/Nowcast und über Bright Sky zugängliche DWD-/WMO-Beobachtungen
- GeoSphere Austria: TAWES-Beobachtungen
- NOAA AviationWeather: METAR
- MeteoAlarm und nationale Wetterdienste: internationale CAP-Warnungen
- NOAA/NWS: US-Warnungen
- optional The Weather Company/Weather Underground, Netatmo, Synoptic Data und Xweather
- RainViewer: Radar außerhalb der DWD-Abdeckung
- OpenStreetMap: Kartenbasis
- BigDataCloud: Reverse-Geocoding-Fallback

## Lizenz- und Nutzungshinweise

Die jeweiligen Nutzungsbedingungen, Abruflimits und Lizenzanforderungen der Datenanbieter gelten zusätzlich. MID enthält keine API-Zugangsdaten. Für kommerzielle oder öffentliche Bereitstellungen müssen Betreiber selbst prüfen, ob ihre Tarife und Lizenzen die konkrete Nutzung und Weitergabe erlauben.

## Versionsschema

- Patch (`0.x.y`): gezielte Korrekturen und kleinere Verbesserungen
- Minor (`0.x.0`): neue wesentliche Funktion oder größere Daten-/UI-Architektur
- Major (`1.0.0`): stabiler, dokumentierter Funktionsumfang

v0.7.0 ist ein Minor-Release, weil sowohl die Stationsdatenarchitektur als auch das 14-Tage-Diagramm substanziell erweitert wurden.

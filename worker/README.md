# MID Daten- und Warnungsproxy v0.6.2

Der Cloudflare Worker stellt browserkompatibel folgende Daten bereit:

- weltweite METAR-Beobachtungen über NOAA AviationWeather
- optional Weather-Underground-PWS-Daten über einen lizenzierten The-Weather-Company-Zugang
- amtliche Wetterwarnungen für Deutschland, Europa und die USA

## Bereitstellung

1. Einen einzigen Cloudflare Worker anlegen. Derselbe Worker versorgt Stationsdaten und Warnungen.
2. Den gesamten Inhalt aus `metar-proxy.js` in den Cloudflare-Codeeditor übernehmen.
3. **Deploy** ausführen.
4. In GitHub unter **Settings → Secrets and variables → Actions → Variables** die Worker-Adresse als `VITE_METAR_PROXY_URL` hinterlegen.

Optional kann dieselbe Adresse zusätzlich als `VITE_ALERT_PROXY_URL` gesetzt werden. Ein zweiter Worker ist nicht erforderlich. Der mitgelieferte GitHub-Actions-Workflow übernimmt automatisch `VITE_METAR_PROXY_URL` als Warnungsproxy, wenn keine separate Warnungsadresse gesetzt ist.

## Diagnose

```text
https://DEIN-WORKER.workers.dev/?mode=health
```

Erwartet wird unter anderem:

```json
{"ok":true,"version":"0.6.2"}
```

Beispiel für Deutschland:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=50.82&lon=7.04&country=DE&name=Niederkassel&region=Nordrhein-Westfalen&language=de
```

Beispiel für weltweite METAR-Daten bei Cagliari:

```text
https://DEIN-WORKER.workers.dev/?lat=39.2238&lon=9.1217&radius_km=140
```

Beispiel für amtliche Warnungen bei Cagliari:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=39.2238&lon=9.1217&country=IT&name=Cagliari&region=Sardegna&language=de
```

Die Warnungsantwort muss `"countryCode":"IT"` enthalten. Eine leere Warnungsliste kann zum jeweiligen Zeitpunkt korrekt sein; die Meldung, Italien besitze keinen hinterlegten Feed, ist dagegen nicht mehr korrekt.

## Amtliche Warnungen

- Deutschland: primär offizieller DWD-WFS-Layer `dwd:Warnungen_Gemeinden`, standortgenau über Warnpolygone; DWD-CAP-Atom als Rückfallquelle
- Europa: aktiv gepflegte MeteoAlarm-Atom-Feeds und verknüpfte CAP-Dokumente der nationalen Wetterdienste
- USA: NOAA/National Weather Service Active Alerts

Bei MeteoAlarm werden Länderbezeichnungen auf ISO-Codes normalisiert. Fehlende Codes werden aus Ort/Region, Reverse-Geocoding und konservativen geografischen Rückfällen bestimmt. Der Parser berücksichtigt eingebettete, XML-maskierte und relativ verlinkte CAP-Meldungen; Feed-Einträge werden anhand von Ort, Bezirk und Region priorisiert und die CAP-Unteranfragen begrenzt.

## Optionale Weather-Underground-PWS-Daten

Weather Underground wird nicht gescrapt und ist standardmäßig deaktiviert. Die Ergänzung funktioniert nur mit einem offiziellen, für die verwendeten Endpunkte berechtigten API-Schlüssel.

```bash
wrangler secret put WEATHER_COM_API_KEY
```

Alternativ wird auch `WU_API_KEY` erkannt. API-Schlüssel dürfen nicht als öffentliche `VITE_*`-Variablen gesetzt werden.

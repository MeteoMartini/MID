# MID Daten- und Warnungsproxy v0.6.1

Der Cloudflare Worker stellt browserkompatibel folgende Daten bereit:

- weltweite METAR-/WMO-Beobachtungen
- optional Weather-Underground-PWS-Daten über einen lizenzierten The-Weather-Company-Zugang
- amtliche Wetterwarnungen für Deutschland, Europa und die USA

## Bereitstellung

1. Einen Cloudflare Worker anlegen.
2. Den gesamten Inhalt aus `metar-proxy.js` in den Cloudflare-Codeeditor übernehmen.
3. **Deploy** ausführen.
4. In GitHub unter **Settings → Secrets and variables → Actions → Variables** die Worker-Adresse als `VITE_METAR_PROXY_URL` hinterlegen.

Optional kann dieselbe Adresse zusätzlich als `VITE_ALERT_PROXY_URL` gesetzt werden. Der mitgelieferte GitHub-Actions-Workflow übernimmt automatisch `VITE_METAR_PROXY_URL` als Warnungsproxy, wenn keine separate Warnungsadresse gesetzt ist.

## Diagnose

```text
https://DEIN-WORKER.workers.dev/?mode=health
```

Erwartet wird unter anderem:

```json
{"ok":true,"version":"0.6.1"}
```

Beispiel für Deutschland:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=50.82&lon=7.04&country=DE&name=Niederkassel&region=Nordrhein-Westfalen&language=de
```

## Amtliche Warnungen

- Deutschland: primär offizieller DWD-WFS-Layer `dwd:Warnungen_Gemeinden`, standortgenau über Warnpolygone; DWD-CAP-Atom als Rückfallquelle
- Europa: aktiv gepflegte MeteoAlarm-Atom-Feeds und verknüpfte CAP-Dokumente der nationalen Wetterdienste
- USA: NOAA/National Weather Service Active Alerts

Bei MeteoAlarm werden die Feed-Einträge anhand von Ort, Bezirk und Region priorisiert und die CAP-Unteranfragen begrenzt. So bleibt der Abruf innerhalb des Limits des kostenlosen Cloudflare-Workers.

## Optionale Weather-Underground-PWS-Daten

Weather Underground wird nicht gescrapt und ist standardmäßig deaktiviert. Die Ergänzung funktioniert nur mit einem offiziellen, für die verwendeten Endpunkte berechtigten API-Schlüssel.

```bash
wrangler secret put WEATHER_COM_API_KEY
```

Alternativ wird auch `WU_API_KEY` erkannt. API-Schlüssel dürfen nicht als öffentliche `VITE_*`-Variablen gesetzt werden.

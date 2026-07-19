# MID Daten- und CAP-Proxy

Der Cloudflare Worker stellt browserkompatibel folgende Daten bereit:

- weltweite METAR-/WMO-Beobachtungen
- optional Weather-Underground-PWS-Daten über einen lizenzierten The-Weather-Company-Zugang
- amtliche Wetterwarnungen im Common Alerting Protocol (CAP)

## Bereitstellung

1. Einen Cloudflare Worker anlegen.
2. Den Inhalt aus `metar-proxy.js` übernehmen.
3. Die öffentliche Worker-URL beim MID-Build setzen:

```text
VITE_METAR_PROXY_URL=https://DEIN-WORKER.workers.dev/
VITE_ALERT_PROXY_URL=https://DEIN-WORKER.workers.dev/
```

`VITE_ALERT_PROXY_URL` ist optional. Fehlt sie, nutzt MID automatisch `VITE_METAR_PROXY_URL` auch für Warnungen.

## Amtliche CAP-Warnungen

Der Worker nutzt standortabhängig:

- Deutschland: DWD CAP-Feed „Amtliche Warnungen“
- Europa: öffentliche MeteoAlarm-Atom-Feeds mit CAP-Meldungen der nationalen Wetterdienste
- USA: NOAA/National Weather Service Active Alerts

Warnungen werden anhand der CAP-Geometrie (Polygon oder Kreis) auf den gewählten Standort gefiltert. In MID erscheinen zunächst nur die Überschriften; ein Klick blendet Meldungs- und Handlungstext ein.

## Optionale Weather-Underground-PWS-Daten

Weather Underground wird nicht gescrapt und ist standardmäßig deaktiviert. Die Ergänzung funktioniert nur mit einem offiziellen, für die verwendeten Endpunkte berechtigten API-Schlüssel.

```bash
wrangler secret put WEATHER_COM_API_KEY
```

Alternativ wird auch `WU_API_KEY` erkannt. API-Schlüssel dürfen nicht als öffentliche `VITE_*`-Variablen gesetzt werden.

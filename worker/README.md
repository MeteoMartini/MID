# METAR-/WMO-Proxy für MID

AviationWeather.gov stellt weltweite METAR-Daten bereit, erlaubt aber keine direkten CORS-Abfragen aus GitHub Pages. `metar-proxy.js` ist deshalb als Cloudflare Worker oder gleichwertige Serverless-Funktion vorgesehen.

Der Worker:

- fragt METARs innerhalb einer standortbezogenen Bounding Box ab
- liefert höchstens 50 nahe Stationen zurück
- setzt CORS-Header für MID
- cached Antworten fünf Minuten

Nach der Bereitstellung die Worker-Adresse beim Vite-Build setzen:

```text
VITE_METAR_PROXY_URL=https://DEIN-WORKER.workers.dev/
```

Die App kombiniert diese Daten mit Bright Sky/DWD-WMO und wählt die passendste aktuelle Station nach Entfernung, Höhenunterschied und Beobachtungsalter.

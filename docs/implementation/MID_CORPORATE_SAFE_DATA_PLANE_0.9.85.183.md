# MID v0.9.85.183 · Corporate-safe Same-Origin Data Plane

Basis: `main = mid-stable = 34d41442de1bb8e984dedca0e786dabb5b9f5ee1` (v0.9.85.182).

## Ziel

Restriktive Unternehmensnetze dürfen MID nicht dadurch funktionsunfähig machen, dass Cloudflare-Worker-, DWD-, EUMETSAT-, RainViewer- oder Kartenhosts im Browser mit 403 bzw. Inhaltsfilter blockiert werden. Im produktiven Web/PWA unter `https://www.midwx.app` ist daher `/api/mid-worker` der einzige Browser-Datenpfad für die kritischen MID-Funktionen Warnungen, ICON-D2-RUC/RUC-EPS, Radar, Satellit und die moderne Vektorkartenbasis.

## Laufzeitvertrag

- `workerClient.ts` erkennt ausschließlich den kanonischen HTTPS-Webhost `www.midwx.app` als produktiven Same-Origin-Modus.
- In diesem Modus besteht die Worker-Kandidatenliste exakt aus `https://www.midwx.app/api/mid-worker`. Gespeicherte oder kompilierte externe Worker-Fallbacks werden nicht versucht.
- Native Capacitor-/Entwicklungsumgebungen behalten ihre konfigurierten Worker-Endpunkte. Der Web-Schutz erzeugt keinen Plattformfork.
- DWD-/EUMETSAT-WMS bleibt serverseitig hinter `mode=composite-wms`.
- RainViewer-Rastertiles werden über `mode=rainviewer-tile` ausgeliefert. Host, bestätigter Frame, Pfad und Tilekoordinaten werden serverseitig allowlist-/kataloggebunden validiert; es existiert kein frei adressierbarer URL-Proxy.
- OpenFreeMap-Vektortiles und Glyphen werden über `basemap-vector-tile` bzw. `basemap-glyph` ausgeliefert. Parameter sind eng validiert und langfristig cachebar.
- Die bestehenden OPERA-/PX250-/RADOLAN-Dateipfade bleiben request-origin-basiert und werden bei Same-Origin-Metadaten dadurch ebenfalls über MID ausgeliefert.

## Infrastrukturvertrag

Die exakte Cloudflare Workers Route lautet:

`www.midwx.app/api/mid-worker* -> <bestehender MID Worker>`

`tools/cloudflare/ensure_same_origin_route.mjs` darf ausschließlich diese Route anlegen oder bestätigen. Eine vorhandene Route desselben Patterns auf einen anderen Worker blockiert fail-closed. Das Skript verändert weder DNS noch TLS noch andere Routes. Die Zone wird aus `MID_CLOUDFLARE_ZONE_ID` oder eindeutig per aktiver Zone `midwx.app` ermittelt.

Nach einer fachlichen Worker-Promotion wird der Same-Origin-Endpunkt mit dem erwarteten MID-Versionsstand geprüft. Bei fachlich unverändertem Worker wird dessen bestehende plausible Version akzeptiert, solange `health.ok=true` gilt. Bei aktiver RUC-Pipeline kommt in beiden Fällen das bestehende RUC-Health-Gate hinzu. Erst danach dürfen Pages und Stable fortfahren.

Voraussetzung außerhalb des Codes: `www.midwx.app` muss bereits durch die Cloudflare-Zone geroutet/proxied sein und der bestehende CI-Token muss Workers-Routes-Schreibzugriff besitzen. Fehlt dies, wird nicht auf DNS-Schreibrechte, `workers.dev`, abgeschaltete TLS-Prüfung oder andere unsichere Fallbacks ausgewichen; der Release stoppt.

## Bedienung und Diagnose

Unter **Einstellungen → Daten & Qualität → Verbindungsdiagnose** prüft MID getrennt:
- Datendienst/Version,
- amtliche Warnungen,
- RUC-Health,
- ICON-D2-RUC-Laufmetadaten,
- Radar-/Satelliten-Produktkatalog.

403/Block-/Timeout-Befunde werden als Verbindungsfehler und nicht als „keine Warnung“ bzw. „keine Wetterdaten“ dargestellt.

## Regression

`scripts/test-corporate-safe-data-plane-0985183.mjs` schützt den produktiven Same-Origin-Lock, die geschlossenen Tile-Proxys, Workflow-/Route-Gates, Diagnose und die Synchronität der aktiven/kanonischen Workflows.

Die meteorologische Warn-, RUC-, Radar- und Satellitenlogik selbst wird nicht umdefiniert; geändert wird ausschließlich Transport, Ausfallsicherheit und Transparenz.

# MID v0.9.85.184 · www.midwx.app Cloudflare-Proxy-Hotfix

## Ausgangslage

Der v0.9.85.183-Releasekandidat bestand den Worker-Staging-Smoke, die 100-%-Promotion und den RUC-Health-Check. Anschließend wurde die exakte Workers Route `www.midwx.app/api/mid-worker*` erfolgreich bestätigt. Der Aufruf `https://www.midwx.app/api/mid-worker?mode=health` lieferte dennoch HTTP 404. Der Release wurde korrekt zurückgerollt und weder Pages noch `mid-stable` wurden weitergeschaltet.

Das Verhalten belegt, dass die Workers Route konfiguriert war, der Host `www.midwx.app` aber nicht durch den Cloudflare-Proxy lief. Eine Workers Route greift nur auf Traffic, der die Cloudflare-Zone tatsächlich passiert.

## Hotfix-Vertrag

`tools/cloudflare/ensure_www_proxy.mjs` darf ausschließlich den bereits vorhandenen DNS-Record für `www.midwx.app` prüfen und gegebenenfalls dessen Proxy-Status aktivieren.

Zulässig:
- genau ein bestehender CNAME für `www.midwx.app`;
- keine parallelen A-/AAAA-Records für denselben Namen;
- Record muss laut Cloudflare proxyfähig sein;
- einzige Mutation: `PATCH .../dns_records/<id>` mit `{"proxied":true}`;
- nach der Mutation müssen Record-ID, Name, Typ und Zielwert unverändert sein.

Nicht zulässig:
- neuer DNS-Record;
- `PUT`/vollständiger Record-Ersatz;
- Änderung von CNAME-Ziel, Name oder Typ;
- Änderung von TLS-, SSL- oder sonstigen Zone-Settings;
- Änderung anderer DNS-Einträge;
- Umgehung über zusätzliche Hostnamen, abgeschaltete Zertifikatsprüfung oder breit berechtigte Fallback-Schlüssel.

## Release-Reihenfolge

1. Worker-Releasekandidat wie bisher stagen und prüfen.
2. Falls fachlich geändert, Worker auf 100 % promoten und erneut prüfen.
3. Bestehenden `www.midwx.app`-CNAME fail-closed auf `proxied=true` prüfen/setzen.
4. Exakte Workers Route `www.midwx.app/api/mid-worker* -> <MID Worker>` prüfen/setzen.
5. Same-Origin `mode=health` prüfen; bei aktiver RUC-Pipeline zusätzlich RUC-Health.
6. Erst danach Pages veröffentlichen.
7. Erst nach grünem Pages-/Worker-/Same-Origin-Gate `mid-stable` promoten.

## Berechtigung

Der CI-Token benötigt zusätzlich **Zone:DNS Edit** ausschließlich für die Zone `midwx.app`. Diese Berechtigung ist enger als ein globaler DNS-Schreibzugriff und wird nur für die oben beschriebene bestehende Record-ID verwendet. Ist die Berechtigung nicht vorhanden, stoppt der Release fail-closed.

## Regression

`scripts/test-www-proxy-hotfix-0985184.mjs` schützt:
- exakten Zonennamen und Host;
- eindeutigen CNAME-Vertrag;
- ausschließlich `proxied=true` per PATCH;
- Verbot von POST/PUT sowie TLS-/Settings-Änderungen;
- Workflowreihenfolge DNS-Proxy -> Workers Route -> Same-Origin-Health;
- Bytegleichheit von aktivem, kanonischem und Transport-Installer.

Keine meteorologische Fachlogik wird geändert.

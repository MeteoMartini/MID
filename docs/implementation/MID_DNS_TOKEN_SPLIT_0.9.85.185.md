# MID v0.9.85.185 · Getrennter Cloudflare-DNS-Credential-Pfad

## Ausgangslage

Der v0.9.85.184-Releasekandidat bestand erneut Worker-Staging, Versionsoverride-Smoke, 100-%-Promotion und den produktiven Worker-Health-Check. Der folgende Schritt zum Lesen bzw. Proxien des bestehenden `www.midwx.app`-CNAME scheiterte jedoch erneut mit HTTP 403. Der Worker wurde daraufhin automatisch auf die vorherige Version zurückgerollt; Pages und `mid-stable` blieben unangetastet.

Der DNS-Schritt verwendete noch `secrets.CLOUDFLARE_API_TOKEN`, also denselben Credential-Pfad wie Worker-Upload, Worker-Promotion und Workers Route. Für die bewusst eng begrenzte DNS-Berechtigung ist stattdessen ein eigener Repository-Secret-Pfad vorgesehen.

## Verbindlicher Credential-Vertrag

- DNS-Proxy-Schritt: ausschließlich `secrets.CLOUDFLARE_DNS_API_TOKEN`.
- Worker-Upload/-Promotion: weiterhin `secrets.CLOUDFLARE_API_TOKEN`.
- Workers Route: weiterhin `secrets.CLOUDFLARE_API_TOKEN`.
- Kein Fallback zwischen beiden Credentials.
- Fehlt `CLOUDFLARE_DNS_API_TOKEN`, ist es leer oder unzureichend berechtigt, stoppt der Release fail-closed.
- Der DNS-Token soll nur die für den bestehenden `www.midwx.app`-Record erforderliche DNS-Schreibberechtigung für die Zone `midwx.app` besitzen.
- Der DNS-Hotfix darf weiterhin ausschließlich `proxied=true` am bestehenden eindeutigen CNAME setzen; Name, Typ, Zielwert, TLS-/Zone-Settings und andere DNS-Einträge bleiben unverändert.

## Release-Reihenfolge

1. Release-ZIP installieren und vollständig prüfen.
2. Worker-Kandidat stagen und smoken.
3. Fachlich geänderten Worker auf 100 % promoten und erneut smoken.
4. Bestehenden `www.midwx.app`-CNAME mit dem separaten DNS-Token prüfen/ggf. proxien.
5. Same-Origin-Workers-Route mit dem bestehenden Worker-Token prüfen/setzen.
6. Same-Origin-Health und bei aktivierter Pipeline RUC-Health prüfen.
7. Erst danach Pages deployen.
8. Erst nach grünem Pages-/Worker-/Same-Origin-Gate `mid-stable` promoten.

## Regression

`scripts/test-www-proxy-dns-token-0985185.mjs` schützt:
- die exakte Credential-Trennung zwischen DNS und Worker/Route;
- das Verbot eines gegenseitigen Fallbacks;
- die Reihenfolge DNS -> Route -> Same-Origin-Health;
- die Bytegleichheit von aktivem, kanonischem und Transport-Installer;
- die Versions-/Baseline-Registrierung des Release.

Keine meteorologische Fachlogik wird geändert.

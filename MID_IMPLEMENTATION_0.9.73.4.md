# MID v0.9.73.4 – RUC-Preprocessing und Favoriten-Dauerhaftigkeit

## Anlass

Der erste reale kostenlose DWD-ICON-D2-RUC/RUC-EPS-Lauf auf GitHub Actions zeigte nach erfolgreicher Run-Erkennung einen unnötig langen Download-/Dekodierschritt. Gleichzeitig wurde erneut beobachtet, dass Favoritenänderungen nach einem Neustart nicht zuverlässig erhalten blieben.

## RUC-Optimierung

`tools/ruc/fetch_and_build_ruc.py` inventarisiert die DWD-Dateibäume weiterhin vollständig, lädt für das kanonische MID-Fenster 0–14 h aber nur noch Dateien, deren DWD-Lead-Name `PTxxxHyyM` auf einer vollen Stunde innerhalb dieses Fensters liegt. Unbekannte Dateinamen werden aus Fail-safe-Gründen nicht verworfen. Für `TOT_PREC` entfällt damit insbesondere der Download der für dieses Bundle nicht benötigten 5-Minuten-Zwischenstände.

Die Downloadparallelität ist auf acht Worker begrenzt und über `MID_RUC_DOWNLOAD_WORKERS` konfigurierbar. Der Fetcher meldet Auswahl- und Downloadfortschritt mit explizitem `flush=True`, sodass längere Schritte auch ohne zusätzliche Workflow-ENV-Änderung nicht mehr wie ein stiller Hänger wirken.

`tools/ruc/build_ruc_bundle.py` extrahiert das native Lat/Lon-Gitter mit ecCodes pro Parameter und für RUC-EPS nur beim ersten benötigten GRIB-Message-Gitter. Die Werte aller Zielstunden und EPS-Mitglieder werden unverändert ausgewertet; Gitterkonsistenz, 0–14-h-Vertrag, EPS-Vollständigkeit und fail-closed-Publikation bleiben bestehen.

## Favoriten-Recovery-Fix

Die StorageSafety-Recovery behandelte den technischen `DurableRecord.updatedAt` des IndexedDB-Mirrors bislang als stärker als einen nativen `mid:favorites`-Array ohne eingebetteten Zeitstempel. Wenn ein neuer Favoritenstand synchron in LocalStorage geschrieben war, sein asynchroner Mirror aber vor Suspend/Reload noch nicht aktualisiert worden war, konnte der ältere Mirror beim nächsten Start den neueren nativen Stand zurückspielen.

Ab v0.9.73.4 werden `mid:favorites` und `mid:favorites:shadow:v1` über die bereits vorhandene semantische Companion-Revision `mid:favorites:updated-at` verglichen. Order-Snapshot und Tombstones verwenden ebenfalls ihre fachlichen Revisionen. Bei gleicher Revision gewinnt ein erfolgreich nativ commiteter Stand; ein nachweislich nicht nativ commiteter Mirror bleibt dagegen als Quota-Recovery autoritativ.

Damit bleibt der bestehende Vertrag erhalten: Favoritenmutationen werden synchron vor dem React-Statewechsel persistiert, Shadow/Tombstones/Order bleiben geschützt und Geräte-Sync arbeitet weiterhin mengen-erhaltend.

## Worker / Kosten / Apple

Keine fachliche Worker-Änderung, keine neue Cloudflare-Ressource, kein R2 und keine kostenpflichtige Aktivierung. Keine Apple-Capability oder Signierung wird verändert.

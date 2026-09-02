# MID KNMI HARMONIE EPS Productive Cache Contract

Stand: v0.9.77.19

## Zweck

Der produktive Cache dient ausschließlich dazu, die wiederholte Ermittlung von Bytepositionen innerhalb der stündlichen KNMI-HARMONIE-AROME-Cy43-P4a-TAR-Archive zu vermeiden. Er ist Infrastruktur des gemeinsamen MID-Workers und **kein zweiter Forecast-, Modell- oder Member-Fusionspfad**.

Der Cache speichert nur stabile Archivstruktur. Ab v0.9.77.19 nutzt die kanonische Worker-Anbindung diesen Index für sechs aufeinanderfolgende Startzeiten, die zeitabhängige 5er-Memberzuordnung und die exakten Sparse-Range-Manifeste. Die Membernummern selbst bleiben ausdrücklich außerhalb des persistierten Index.

## Verbindliche Cache-Ebene

- Persistenter Cache: bestehendes Cloudflare-KV-Binding `MID_PUSH_SUBSCRIPTIONS`.
- Eigenes, strikt getrenntes Key-Präfix: `cache:knmi-eps:tar-index:v1:`.
- Der vorhandene Push-Scheduler listet ausschließlich `sub:`-Keys. Der KNMI-Cache darf deshalb weder Push-Abonnements listen noch verändern.
- Für diesen Meilenstein wird **kein neues KV-Namespace, kein R2-Bucket, kein Service-Binding und kein neuer GitHub-Workflow** angelegt.
- Fehlt das vorhandene KV-Binding, fällt der Cache auf den kurzlebigen Isolate-Memory-Cache zurück; der Health-Status muss dann `persistent:false` melden.

## Persistierter Inhalt

Zulässig sind ausschließlich kompakte, reproduzierbare Archivmetadaten:

- Dataset und Dataset-Version,
- Archivdateiname,
- TAR-Dateiname je Eintrag,
- Header-/Datenoffset,
- Dateilänge und gepaddete TAR-Länge,
- Forecast-Lead, soweit aus dem Dateinamen ableitbar,
- Initialisierungszeit, soweit aus dem Dateinamen ableitbar,
- technische Indexmetadaten wie Erstellungszeit und Zahl der Headerabrufe.

Nicht persistiert werden:

- KNMI-API-Keys, Cloudflare-Secrets oder andere Zugangsdaten,
- temporäre/signed Download-URLs,
- komplette TAR- oder GRIB-Dateien,
- dekodierte Punktprognosen oder nutzerbezogene Daten,
- zeitabhängige Rolling-Membernummern.

### Rolling-Member-Isolation

Eine konkrete Stunden-TAR ist strukturell stabil, ihre Rolle innerhalb des rollierenden 30-Member-Ensembles ist jedoch zeitabhängig. Deshalb gehören `members` **nicht** in den langlebigen TAR-Index und nicht in dessen Cacheidentität. Derselbe Archivindex muss bei einer späteren Zuordnung derselben TAR zu einer anderen 5er-Membergruppe unverändert wiederverwendbar sein.

## Lebensdauer

- Persistenter TAR-Index: **72 Stunden**.
- Isolate-Memory-Cache: **10 Minuten**.
- Der persistente Cache wird nur bei einem echten Cache-Miss neu aufgebaut.
- Gleichzeitige Misses desselben Archivs innerhalb eines Worker-Isolates werden über ein Inflight-Deduping zusammengeführt.

## Sparse-Range-Vertrag

- Der Index wird aus 512-Byte-POSIX-TAR-Headern aufgebaut; Dateiinhalte werden beim Indexbau nicht angefordert.
- Nach bekanntem Offset werden benötigte Dateien ausschließlich über Byte-Ranges adressiert.
- Disjunkte Member-/Lead-Bereiche werden in HTTP-Multi-Range-Requests gepackt.
- Maximal **16 Range-Teile je Request**; zusätzlich gilt eine feste Obergrenze für die Range-Headerlänge.
- Überlappende Bereiche dürfen vereinigt werden.
- Nicht benötigte Zwischenräume dürfen nicht mitangefordert werden.
- Ein Fallback auf vollständige TAR-/GRIB-Downloads ist in diesem Cachevertrag nicht zulässig.

## Worker- und Deployment-Vertrag

- Kanonisches Modul: `worker-src/05-knmi-eps-cache.js`.
- Es wird durch `scripts/build-maintenance-aggregates.mjs` in `worker/metar-proxy.js` und `worker.js` aufgenommen.
- Diagnose: `?mode=knmi-eps-cache-health`.
- Das bestehende Worker-Auto-Deploy spiegelt das vorhandene KV-Binding unverändert; es wird keine neue Cloudflare-Ressource provisioniert.
- `?mode=health` weist den produktiven Cache als eigenen Dienst/Provider aus.
- Secrets und Dashboard-Variablen bleiben vollständig unter dem bestehenden `MID_WORKER_AUTO_DEPLOY_CONTRACT.md` geschützt.

## KV-Budget und Push-Isolation

Der KNMI-Cache darf:

- `get` für einen bekannten, gehashten Archivkey verwenden,
- `put` nur nach einem echten Index-Miss verwenden.

Der KNMI-Cache darf **kein `KV.list()`** verwenden. Damit bleibt das Listenbudget des Push-Schedulers unverändert, und der neue Cache skaliert nicht mit der Zahl vorhandener Push-Abonnements.

## Worker-Anbindung ab v0.9.77.19

Der Worker übernimmt jetzt KNMI-Listing, kurzlebige Download-URL, Cache-gestützte TAR-Indizes, sechs lückenlose Startzeiten, 6×5-Memberzuordnung und das auf 0–54 h ausgerichtete Sparse-/Multi-Range-Manifest.

Der ältere Projektvertrag bleibt vorrangig: **Cloudflare dekodiert kein GRIB/eccodes.** Die eigentliche Punktdekodierung erfolgt am explizit konfigurierten HTTPS-Decoder. Dieser erhält das Worker-Manifest und darf deshalb keinen zweiten KNMI-Listing-/Indexpfad erzeugen. Fehlt ein Decoder, bleibt die Quelle fail-open unkonfiguriert und bestehende Ensemblequellen übernehmen.

## Pflichtregression

`scripts/test-knmi-eps-productive-cache-097718.mjs`

Sie schützt insbesondere:

- Header-only-TAR-Indexierung,
- 72-h-KV-TTL und 10-min-Memory-Vertrag,
- Prefix-Isolation im bestehenden `MID_PUSH_SUBSCRIPTIONS`-Namespace,
- Verzicht auf `KV.list()`,
- Rolling-Member-Isolation,
- Sparse-/Multi-Range-Packing ohne Gap-Overfetch,
- Health-Endpunkt und Worker-Aggregation.

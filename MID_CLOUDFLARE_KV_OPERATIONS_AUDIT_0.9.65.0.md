# Cloudflare Workers KV – Operations-Audit v0.9.65.0

## Gegenüber v0.9.64.8/9 zusätzlich umgesetzt

### Scheduler-Index statt `list()` alle fünf Minuten

Der Push-Cron läuft unverändert alle fünf Minuten. Statt dabei jedes Mal den `sub:`-Namensraum per `KV.list()` zu enumerieren, liest der Worker im Normalbetrieb einen kleinen Scheduler-Index. Die echte KV-Liste wird automatisch nur noch um 00, 06, 12 und 18 UTC sowie beim Bootstrap/Recovery abgeglichen.

Bei einer KV-Seite sinkt damit der reguläre Modellwert von 288 List-Operationen pro Tag auf höchstens 4 pro Tag (ca. −98,6 %). Dafür entsteht ein kleiner Index-Read pro Cronlauf; das verschiebt Last bewusst aus dem knappen List-Budget in das wesentlich größere Read-Budget.

### Wetterzwilling-Vollarchive gebündelt

Lokale Wetterzwilling-Daten werden unverändert sofort in LocalStorage/IndexedDB gesichert. Cloud-Vollarchive werden jedoch nicht mehr nach jeder fachlich identischen oder dicht aufeinanderfolgenden Änderung neu verschlüsselt und vollständig in KV-Chunks geschrieben.

- identische Beobachtungsslots: kein neuer Archivstand,
- unveränderte 3-h-Forecast-Captures: kein neuer Archivstand,
- unveränderte Referenzreihen/Imports: kein neuer Archivstand,
- tatsächliche Archivänderungen: Zusammenfassung in einem 10-Minuten-Fenster.

Damit sinken insbesondere die Chunk-Writes und die beim Commit bisher entstehenden Deletes der Vorrevision stark, ohne Archivdatensätze zu entfernen.

### Geräte-Sync mit Inhaltssignatur

Portable Geräte-Snapshots werden SHA-256-signiert. Ist der fachliche Inhalt identisch zum letzten gesicherten Stand, entfällt der KV-Write auch dann, wenn zwischenzeitlich lokale UI-/Persistenzereignisse stattgefunden haben. Änderungen werden zusätzlich drei Sekunden gebündelt.

## Unverändert geschützt

- 5-Minuten-Niederschlags-/Gewitterprüfung,
- 15-Minuten-Lüftungsprüfung,
- 60-Minuten-Prognoseänderungsprüfung,
- alle bisherigen Datenquellen und Warnregeln,
- sofortige lokale Wetterzwilling-Persistenz,
- verschlüsselter vollständiger Geräte-/Archiv-Sync,
- 30-Minuten-Erfolgsheartbeat und sofortiger Fehlerheartbeat.

## Audit-Endpunkt

`POST ?mode=push-kv-operations-audit` liefert nun `mid.kv-operations-audit.v3` mit Scheduler-Index-Status, geschätztem List-Rückgang und den fortgeführten Read-/Write-Kadenzen.

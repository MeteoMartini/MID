# MID Implementation 0.9.84.17

## Anlass
GitHub Release #972 scheiterte erneut im TypeScript-7-Schritt an `src/main.tsx(43,30)` mit TS18047 (`status` möglicherweise `null`). Die v0.9.84.16-Fassung nutzte zwar `status && ...`, ließ TypeScript 7 aber weiterhin eine Objekt-Narrowing-Entscheidung treffen.

## Änderung
Der Status wird weiterhin fehlertolerant geladen. `pendingVersion` und `appVersion` werden danach ausschließlich per optionalem Zugriff in zwei skalare Variablen übernommen. Der Rollback-Vergleich arbeitet nur noch mit diesen Werten und dereferenziert das nullable Statusobjekt nicht mehr.

## Wirkung
Keine fachliche oder sichtbare Änderung. Post-Update-Healthcheck, gezielter Pending-Rollback und alle Recovery-Regeln bleiben erhalten.

## Worker
Keine fachliche Workeränderung; nur Versionssynchronisation.

# MID v0.9.32.21

## Kompositbild – dauerhafte Satelliten-Snapshot- und Cache-Lösung

- Same-Origin-Worker/API/WMS-Requests werden vom Service Worker strikt network-only behandelt.
- Queryparameter wie TIME, BBOX, `_mid_frame` und `_mid_revision` können nicht mehr durch `ignoreSearch` verloren gehen.
- Alte dynamische WMS-Einträge werden aus vorhandenen MID-Shell-Caches entfernt.
- Statische App-Ressourcen bleiben weiterhin offline cachebar; der Offline-/Rollback-Schutz bleibt erhalten.
- Satellitenbilder mit verifizierter Zeitdimension werden mit exakt einem Aufnahmezeitpunkt gerendert; keine Kreuzblendung zweier RGB-Zeitstände.
- EUMETSAT-Capabilities werden mit maximal 60 s Metadaten-Cache aktualisiert.

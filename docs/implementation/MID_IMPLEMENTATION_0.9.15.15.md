# MID v0.9.15.15 – K3D-Komplettdarstellung robuster wiederhergestellt

## Umgesetzt

- Die K3D-Einblendung im Kompositbild blendet sichtbare KONRAD3D-Zellen nicht mehr vollständig aus, wenn der Radaranker-Abgleich lokal zu restriktiv ausfällt. Stattdessen werden radarplausible Zellen bevorzugt gewichtet, aber weitere sichtbare relevante Zellen weiterhin gerendert.
- Der sichtbare Kartenpuffer für K3D-Objekte wurde erweitert, damit aktuelle Zellfläche, Zugbahn, Unsicherheitskorridor, Unsicherheitsellipsen und Prognosepunkte auch am Kartenrand stabil sichtbar bleiben.
- Die zeitliche Render-Schwelle für die K3D-Darstellung wurde gelockert, sodass das vollständige K3D-Paket im Kurzfrist-Komposit nicht unnötig verschwindet.

## Betroffene Dateien

- `src/RadarPanel.tsx`

## Hinweise

- Keine funktionale Workeränderung erforderlich.
- Geprüft mit `npm run test:ensemble-desktop-composite-k3d` und `npm run test:composite-visibility-quality`.
- Ein vollständiger `npm run build` konnte in dieser Umgebung mangels installierter Node-Abhängigkeiten nicht ausgeführt werden.

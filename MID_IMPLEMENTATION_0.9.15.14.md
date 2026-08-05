# MID v0.9.15.14 – K3D-Vollrendering im Kompositbild

## Umgesetzt

- Das Kompositbild rendert die vollständigen KONRAD3D-Vektorelemente nun für bis zu drei relevante sichtbare Zellen statt nur für eine einzelne Top-Zelle.
- Dadurch werden aktuelle Zellfläche, Zugbahn, Unsicherheitskorridor, Unsicherheitsellipsen und Prognosepunkte im sichtbaren Kartenausschnitt wieder vollständig dargestellt.
- Die K3D-Vektorstyles wurden nachgeschärft, damit Spur- und Flächenelemente oberhalb des Radars auch im dunklen Theme besser sichtbar bleiben.
- Die Unsicherheitsellipsen werden etwas dichter eingeblendet, damit die K3D-Prognose nicht fragmentiert wirkt.

## Betroffene Dateien

- `src/RadarPanel.tsx`
- `src/styles.css`

## Hinweise

- Keine funktionale Workeränderung. Der Worker wird nur auf `v0.9.15.14` versionssynchronisiert.

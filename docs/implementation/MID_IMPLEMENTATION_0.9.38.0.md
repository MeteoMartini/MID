# MID v0.9.38.0 · Stable-Audit 10.08.2026

Dieser Release setzt die noch offenen Punkte des MID Stable-Audits vom 10.08.2026 um.

## Finaler Buildvertrag
- `verify:types`: `tsc --noEmit` für App und Node-Konfiguration.
- `verify:vite`: echter Vite-Produktionsbuild mit 4096-MB-Node-Limit.
- `build` führt beide Phasen explizit aus; `verify` ergänzt Worker-Syntax und sämtliche Regressionen.
- `mid-stable` wird weiterhin erst nach erfolgreicher Installation/Prüfung maßgeblich.

## Seasonal / Langfrist
- gemeinsamer 4-h-TTL-Cache für das vollständige Seasonal-Bundle
- Stale-if-error bis 36 h
- ECMWF-Fetch ohne permanentes `no-store`
- NOAA NMME/CFSv2 über Worker mit identischem Refresh-Vertrag
- manueller Refresh erzwingt Upstream-Neuabruf, behält bei temporärem Fehler aber den letzten belastbaren Stand

## Druckniveau-Meteogramm
- 15-min-TTL und 3-h-Stale-if-error im Client
- Worker-TTL 15 min plus stale-while-revalidate 45 min
- expliziter manueller Refresh
- Modul bleibt durch ViewportGate, geschlossene Flugmeteorologie und geschlossene Meteogramm-Untersektion progressiv
- `memo` sowie `content-visibility` reduzieren unnötige Offscreen-Arbeit; Export deaktiviert das Containment temporär

## Raster-CPU
- OPERA erhält einen hart begrenzten LRU-Cache fertig projizierter Viewport-Canvases
- Cache-Key: Frame + Zoom + Kartenbounds + CSS-Größe + Rendergröße
- max. 8 Einträge und 4,5 Mio. Rasterpixel
- DWD-PX250 und HymecNG bleiben Leaflet-GridLayer: deren projizierte Tiles werden bereits über Leaflets Tile-Lifecycle wiederverwendet; die verworfenen historischen HymecNG-Module bleiben dormant.

## Dependency-Policy
- React / React DOM / react-is 18.3.1
- Recharts 3.8.1
- TypeScript 5.9.3
- Vite 6.4.3
- @vitejs/plugin-react 4.7.0
- Recharts-Upgrades zunächst isoliert; React 19, TypeScript 7 und Vite 8 nur in einer getrennten Vollmigration.

## CI
Die aktuellen Scheduled-Jobs auf GitHub sind bereits explizit auf `mid-stable` gepinnt. Diese funktionierende Konfiguration wird nicht durch das Releasearchiv ersetzt.

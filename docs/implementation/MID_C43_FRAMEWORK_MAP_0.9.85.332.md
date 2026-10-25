# MID .332 — Vite-Qualifikation; React/MapLibre zurückgestellt

## Ausgangsbasis und Ziel

- Veröffentlichtes Stable `.331`: `main = mid-stable = 447890032ce1b1d9103bc76811061b790b26f328`.
- Im `.332`-Kandidaten bleibt Vite 8.2.4 → 8.3.5; @vitejs/plugin-react 6.1.2 bleibt unverändert.
- React / React DOM / react-is bleiben 19.2.8; React-Typen bleiben auf den .331-Ständen.
- MapLibre bleibt 6.7.0; Capacitor 8.5.3, PostCSS 8.5.31 und Pako 2.2.0 bleiben unverändert.

## Qualifikation der vorgesehenen Breitenkandidaten

Context7 wurde für React, Vite und MapLibre konsultiert. Die exakten Zielpatches sind dort nicht vollständig indiziert. Die offiziellen Context7-Dokumente nennen React 19.3.0 Trusted Types-Integration und unabhängig gerenderte Transitions; Vite 8 benötigt Node `^20.19.0 || >=22.12.0`; MapLibre 6 nutzt WebGL2. npm-Metadaten bestätigten die exakten Zielversionen und Peer-Anforderungen.

Ein kombinierter lokaler Kandidat hob React/React DOM/react-is auf 19.3.1, Typen auf 19.3.0, Vite auf 8.3.5 und MapLibre auf 6.15.0. Das Lockfile wurde aus Registry-Metadaten erzeugt. `npm ci`, Types, Produktionsbuild und 1.021/1.022 Regressionen bestanden; genau ein Regressionstest schlug fehl: `test-feature-chunk-budget-098595.mjs`.

Gegenüber einem frisch geleerten `.331`-Build stiegen die unveränderten Chunk-Budgets überschreitenden Artefakte wie folgt:

| Artefakt | .331 roh / gzip / Brotli | kombinierter Kandidat roh / gzip / Brotli | Änderung roh / gzip |
| --- | ---: | ---: | ---: |
| MapLibreCore JS | 999.817 / 260.796 / 214.222 B | 1.087.250 / 292.897 / 239.531 B | +87.433 / +32.101 B |
| MapLibre Worker | 486.250 / 135.492 / 111.267 B | 518.913 / 147.971 / 121.516 B | +32.663 / +12.479 B |
| ReactVendor | 378.323 / 115.082 / 78.749 B | 421.904 / 127.907 / 88.069 B | +43.581 / +12.825 B |
| initial CSS | 1.759.985 / 249.702 / 178.104 B | 1.759.985 / 249.702 / 178.104 B | 0 / 0 B |

MapLibre GL JS 6.15.0 bindet das vollständige gebündelte ESM-Paket in einem Modul ein. Eine lokale Code-Splitting-Probe verschob es nur in ein separates `MapLibreVendor`-Chunk; dieses blieb bei 1.075.010 B und überschritt dasselbe Rohbudget. Das Paket-DOM-Chunk blieb mit 420.740 B ebenfalls über dem bestehenden ReactVendor-Budget. Die Probe wurde verworfen; Vite-Konfiguration und Budgetregression bleiben auf Stable-Stand. Es wurden weder Schwellen angehoben noch neue Vendor-Splits übernommen.

## `.332`-Freigabestatus

React 19.3.1 und MapLibre 6.15.0 sind wegen der harten Bundle-Budget-Verletzung zurückgestellt. Dieses Source-Kandidatenrelease qualifiziert nur Vite 8.3.5 mit React 19.2.8 und MapLibre 6.7.0. Der separate, vollständige `.332`-Lauf mit diesem exakten Versionssatz, CSS-/Chunk-Prüfung, Audits sowie MID Source-/Installer-/Worker-/Pages-/Stable-Gates ist noch erforderlich. Keine Veröffentlichung ist mit diesem Bericht allein belegt.

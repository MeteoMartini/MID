# MID 0.9.84.71 – Testbericht

## Erfolgreich lokal ausgeführt
- neuer Visualisierungs-Audit-Block-2-Vertrag `test-visualization-readability-2-098471.mjs`
- appweite Designabdeckung 098470
- Visualisierungs-Audit Block 1 098470
- Apple-Adaptive-Designvertrag 098469
- UI-Audit-Standardisierung 098462
- Flugmeteorologie und Flug-Streckenbriefing/Cloud-Steering
- Water-Current-Richtungspfeil
- Reise-Center-Lesbarkeit
- Event Progressive Disclosure
- probabilistische Windstufen-Präsentation
- Radar-/Wetterkarten-Interaktion
- Versionierung und Release-Lineage
- `node --check` für Worker, Worker-Aggregat und beide Service Worker
- CSS-Parsing mit `tinycss2` für `30-modern.css` und `styles.css`

## Lokal nicht ausführbar
Die drei älteren Wasser-/Tide-Quelltests `location-thunder-water-tide-layout`, `water-tide-tooltip-layering` und `water-tide-minute-hazard-layout` brechen in der isolierten Release-Arbeitsumgebung bereits beim Laden von `typescript-strada` ab. Das ZIP enthält bewusst kein `node_modules`. Der GitHub-Installer stellt die Projekttoolchain via `npm ci` bereit und führt dort die vollständige Suite aus.

## Vorheriger Release
Der vollständige GitHub-Installer für MID 0.9.84.70 war erfolgreich, einschließlich Produktionsbuild, kompletter Regression, iOS-Web-Sync, GitHub Pages und finaler Fast-Forward-Promotion nach `mid-stable`.

## Ergebnis
Die lokal ausführbaren, für Block 2 relevanten Verträge bestehen. Keine meteorologische Produktionslogik wurde verändert.

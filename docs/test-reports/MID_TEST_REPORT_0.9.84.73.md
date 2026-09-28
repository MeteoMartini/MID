# MID 0.9.84.73 – Testbericht

## GitHub-Befund aus v0.9.84.72
Der Release-Installer für v0.9.84.72 scheiterte ausschließlich im TypeScript-Typecheck mit `TS6133`: `formatDayLengthChange` und `formatDuration` waren in `src/App.tsx` importiert, aber nach der Istwetter-Verdichtung nicht mehr verwendet. ZIP-Entpacken, `npm ci` und der Dependency-Audit waren zuvor erfolgreich. In v0.9.84.73 wurden ausschließlich diese beiden ungenutzten Imports entfernt; die v0.9.84.72-Funktionen bleiben erhalten.

## Erfolgreich lokal ausgeführt
- neuer Detail-/Popover-Vertrag `test-secondary-detail-popover-readability-098473.mjs` einschließlich Schutz gegen die beiden ungenutzten Astronomie-Imports
- Popover-Regression
- UVI-Kachel / DWD-/WHO-Stufen
- Ensemble Weather Overlay Tooltip
- Modellmetadaten / Quelleninitialisierung
- Bergprofil-Plausibilität
- Apple-Adaptive-Designvertrag 098469
- appweite Designabdeckung 098470
- Visualisierungs-Audit Block 1 und Block 2
- Header-/Istwetter-Dichtevertrag 098472
- UI-Audit-Standardisierung 098462
- Versionierung und Release-Lineage
- Codequalität
- `node --check` für Worker, Worker-Aggregat und beide Service Worker
- CSS-Parserprüfung mit `tinycss2` für `src/styles.css` und `src/v078.css`

## Lokal nicht vollständig reproduziert
Zwei zusätzlich angestoßene Altprüfungen (`test-ensemble-tooltip-axis-device-layout-08309.mjs` und `test-water-tide-minute-hazard-layout-082617.mjs`) benötigen `typescript-strada`. Das Release-ZIP enthält bewusst kein `node_modules`; der GitHub-Installer stellt die projektgebundene Toolchain mit `npm ci` bereit. Die fehlende lokale Abhängigkeit ist kein fachlicher Assert-Fehler.

## Regression aus v0.9.84.72
`test-current-header-density-098472.mjs` war noch auf exakt 0.9.84.72 fest verdrahtet. Der Vertrag wurde versionsresilient gemacht: Er schützt weiterhin alle v0.9.84.72-Funktionen, akzeptiert aber spätere Wartungsstände derselben 0.9.84-Reihe.

## Zusätzliche Prüfungen
- `styles.css` ist byte-identisch zur Verkettung der fünf kanonischen `styles-src`-Module.
- Worker-Fachlogik unterscheidet sich gegenüber v0.9.84.72 ausschließlich in `WORKER_VERSION`.
- Die neuen Regeln liegen am Ende der jeweiligen Kaskade; besonders `v078.css` kann die semantischen Größen daher nicht erneut mit älteren 6,5–8-px-Werten überschreiben.
- Die beiden CI-auslösenden Namen kommen im Astronomie-Import von `App.tsx` nicht mehr vor.

## Ergebnis
Alle lokal ausführbaren, für diesen Auditblock relevanten Verträge bestehen. Der bekannte v0.9.84.72-TypeScript-Blocker ist gezielt behoben; keine meteorologische Produktionslogik wurde verändert.

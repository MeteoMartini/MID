# MID Audit 1.0 · Ensemble-Chart RAF-Resize mit Last-Frame-Wins

**Basis:** GitHub `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, fünf aktive Rulesets. **Zielversion:** .487 als Draft-QA, kein Release.

## Nachgewiesener Quellbefund und gezielte Änderung
`src/EnsembleChartFrame.tsx` las per ResizeObserver nur `contentRect.width` (korrekt), rief aber auf jeder Meldung `cancelAnimationFrame(frame)` und einen neuen `requestAnimationFrame` auf. Bei fortlaufenden Resize-Events konnte der jeweils ausstehende Commit immer wieder verschoben werden. Die neue `src/ensembleChartWidthScheduler.ts` behält genau einen pending Frame, aktualisiert die jüngste zulässige Breite und committed sie einmal pro Animation-Frame. Nicht-finite, negative, Null- und Subpixel-Nullgrößen bleiben ignoriert. `dispose()` cancelt und entkoppelt unmount-sicher.

**Nicht verändert:** bestehende SVG-/Recharts-Elemente, Daten, Ensemble-Spreads, Unsicherheit, NoData, Einheiten, Modellläufe, WMO/DWD-Warnsemantik, Styled Layout, Theme, Exportmode, Recharts-Höhe, Worker, CI-Workflow und Release-/Versionsspiegel. Ein zusätzlicher Scheduler arbeitet nur bei tatsächlich gemessener Chartbreite; keine Poller oder zusätzlichen Requests.

## Reproduzierbare Testfälle
- `tests/unit/ensemble-chart-width-scheduler.test.ts`: 250 RO-Breitereignisse -> genau eine RAF-Planung und letzte Breite; Viewports 320/390/430/834/1024/1440; Fractional/NoData; Resize in flight; RAF-ID 0; Unmount-Cancel und keine späten Stale-Publishes.
- Statische Tests sind **keine** pixelbasierte Chromiums-, WebKit-, iOS- oder VoiceOver-Abnahme. Nach selektivem SHA-intakten Handoff müssen bestehende `test:ensemble-visual-scroll`, `test:responsiveness`, Browser-Videoplayer/Export, Chart-Tooltip und gesamte MID-Core/Heavy/Source/Review/Installer/Pages/Worker/Stable-Matrix auf dem finalen Integrations-HEAD erneut ausgeführt werden.
- Performancebehauptung eng: RAF-Planungsanzahl bei Burst sinkt von N auf 1; tatsächliche LCP, INP, FPS oder p75 sind nicht gemessen. Vergleich auf identischem Gerät, gleicher Breitenserie/Build und gleicher Ansicht vornehmen.

## Zuständigkeit und Integration
Verwandter Karten-Resize-PR #878, SVG-Chart-PR #879 und Leitchat-PR #868 geprüft: **kein geänderter Pfad `src/EnsembleChartFrame.tsx` auf LC #868** bei Prüfung. Keine Datei des Karten- oder SVG-Hooks wird hier übernommen. LC soll ausschließlich die neuen zwei Dateien plus die gezielten EnsembleChartFrame-Import-/Effect-Hunks selektiv übernehmen, vor Intake die aktuellen SHAs/Blobs erneut lesen. Issue #523 bleibt gesamter Audit-Tracker; #740/#839 getrennt.

**Grenzen:** QA-DRAFT · NO READY/MERGE/RELEASE. Kein neues kostenpflichtiges Tool; kein Produktionsschreibzugriff.

# MID v0.9.78.44

## Anlass
GitHub-Release #878 erreichte erfolgreich ZIP-Prüfung, npm-Installation, Dependency-Audit, TypeScript 7 und den Vite-Produktionsbuild. Von 666 automatisch erkannten Regressionen scheiterte ausschließlich `scripts/test-event-lifecycle-startup-095334.mjs` mit `Startvorladung muss kurz und nicht blockierend sein.`

## Ursache
Der Test war noch auf den historischen Quelltexttoken `wait(550)` festgelegt. v0.9.78.43 hatte das Splash-Zeitbudget bewusst auf maximal 900 ms erweitert, damit Forecast, Schnellstation, Mean/Spread-Ensemble-Bootstrap und benötigte UI-Chunks die ohnehin sichtbare Splashphase besser nutzen können. Die Laufzeitlogik blieb weiterhin hart durch `Promise.race` begrenzt; der Testvertrag war veraltet.

## Korrektur
- Der Event-Lifecycle-Test akzeptiert nun jedes harte Splashbudget bis einschließlich 900 ms statt eine einzelne alte Zahl zu verlangen.
- Zusätzlich schützt er explizit, dass der Splash weder `normal`- noch `background`-Ensemblefusion startet.
- `MID_EVENT_LIFECYCLE_STARTUP_CONTRACT.md` wurde an die bestehende v0.9.78.43-Architektur angeglichen: leichter Mean/Spread-Bootstrap und UI-Chunk-Preload sind erlaubt; volle Memberfusion, Radar, Langfrist und weitere schwere Sekundärpfade bleiben nach dem App-Mount.

## Fachliche Wirkung
Keine Änderung am bereits implementierten Startverhalten. v0.9.78.44 beseitigt ausschließlich die widersprüchliche Altregression und präzisiert den verbindlichen Vertrag.

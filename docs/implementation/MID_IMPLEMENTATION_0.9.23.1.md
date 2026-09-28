# MID v0.9.23.1

## CI-/Regression-Fix
- `test-maintenance-recharts3-cache-ci-08260.mjs` CI-deterministisch überarbeitet.
- Temporäre, bereits per `.gitignore` ausgeschlossene TypeScript-/Vite-Buildartefakte lösen nach dem Produktionsbuild keinen falschen Release-Abbruch mehr aus.
- Cache-LRU-/Storage-Verhalten wird weiterhin dynamisch geprüft, jedoch ohne Abhängigkeit von einer globalen oder lokal installierten TypeScript-Runtime-Version.
- Lockfile-, Recharts-, Dependency-, Workflow-SHA-, Audit-, DOM-Performance- und Baseline-Prüfungen bleiben unverändert hart.

Keine funktionale Wetter-/UI-Änderung gegenüber v0.9.23.0.

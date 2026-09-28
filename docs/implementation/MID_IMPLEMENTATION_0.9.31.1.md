# MID v0.9.31.1

## Nächtliche Revision: Dependency-Sicherheitswartung

- Befund der nächtlichen MID-Revision übernommen, ohne funktionale Wetter-/UI-Logik zu verändern.
- `postcss` im Lockfile von 8.5.20 auf 8.5.23 angehoben (Fix für GHSA-fxqj-rqcc-2cmp).
- `nanoid` im 3.x-Kompatibilitätspfad von 3.3.16 auf 3.3.17 angehoben (Fix für GHSA-2v37-7h3g-55p8).
- Neuer Regressionstest `test-nightly-audit-dependencies-09311.mjs` verhindert ein erneutes Zurückfallen unter die sicheren Mindeststände.
- Keine funktionale Worker-Änderung; nur Versionssynchronisierung auf 0.9.31.1.

# MID v0.9.52.4 – CodeQL / Insecure randomness cleanup

## Anlass

GitHub Code Scanning meldete mehrere High-Funde `js/insecure-randomness`, unter anderem historisch in `App.tsx`, `radarProjection.ts` und `seasonalForecast.ts`.

## Prüfung und Änderungen

- Produktionscode repositoryweit auf `Math.random()` geprüft.
- `radarProjection.ts` und `seasonalForecast.ts` enthalten im aktuellen Stand keine unsichere Zufallsquelle; die dort sichtbaren Meldungen entsprechen nicht mehr dem aktuellen Quelltext.
- Der aktuelle Restfund in `App.tsx` wurde beseitigt: `favoriteId()` nutzt `crypto.randomUUID()` und, falls diese API nicht vorhanden ist, `crypto.getRandomValues()`.
- Der letzte Kompatibilitätsfallback ist absichtlich nicht-zufällig und nur kollisionsarm (Zeit + Prozesszähler); er wird nicht als Sicherheits-Token verwendet.
- Neue Required-Regression `scripts/test-codeql-insecure-randomness-09524.mjs` verhindert künftig `Math.random()` im produktiven `src/`- und `worker/`-Code und schützt die sichere Favorite-ID-Erzeugung.

## Funktionsschutz

- Favoritenfunktion, Persistenz und Geräte-Synchronisation bleiben unverändert.
- Radarprojektion und Saisonprognose wurden fachlich nicht verändert.
- Workerlogik ist fachlich unverändert; nur Versionssynchronisation.

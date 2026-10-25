# MID-C42 · isoliertes PostCSS-Update 0.9.85.329

## Basis und Umfang

- Verifizierte Stable-Basis: `main = mid-stable = 7b7d94447d584dc7b7ee4bad7549150ad19c916c`, v0.9.85.328.
- PostCSS wird ausschließlich als exakte Entwicklungsabhängigkeit von 8.5.28 auf 8.5.31 aktualisiert.
- Das Lockfile wurde mit npm reproduzierbar erzeugt. Erforderliche Begleitänderung: `nanoid` 3.3.18 → 3.3.20. `source-map-js` bleibt 1.2.2; keine Overrides und kein `npm audit fix --force`.
- React, React DOM, react-is, Vite, `@vitejs/plugin-react`, Capacitor Core/CLI/iOS, MapLibre und Pako bleiben unverändert.
- Keine App-Logik, Meteorologie, CSS-Aufteilung, Theme-, Widget-, Karten- oder Exportänderung.

## Upstream-Qualifikation

- Context7 löste PostCSS als `/postcss/postcss` auf. Die Dokumentation für die konkrete 8.5.31-Version ist dort nicht indiziert; die aktuelle offizielle PostCSS-Dokumentation beschreibt die Kommentarverarbeitung von `list.split()` (eingeführt in 8.5.29) sowie die SafeStringifier-/SourceMap-Korrekturen bis 8.5.31.
- `npm view postcss@8.5.31 version dist.tarball dist.integrity dependencies --json` bestätigte Version, Registry-Tarball, SRI und Anforderungen `nanoid ^3.3.20`, `picocolors ^1.1.1`, `source-map-js ^1.2.2`.
- Das Lockfile enthält exakt PostCSS 8.5.31 mit passender Registry-SRI, nanoid 3.3.20 und source-map-js 1.2.2.

## Build- und Regressionsergebnisse

- Saubere Installation: `npm ci` erfolgreich.
- `PATH=/tmp/mid-c42-regressions-venv/bin:$PATH npm run verify`: TypeScript, produktiver Vite-Build und **1.022/1.022** Regressionen erfolgreich.
- `.328`-Baseline und `.329` liefern denselben produktiven CSS-Pfad `index-CuuPtrVL.css`: **1.759.985 Rohbytes**, SHA-256 `2d31d276bde4453a367251cd5e8efc999807cdf50ac609d1cdeddb883b1ce4cd` in beiden Builds.
- `npm run test:module-css-consolidation`: erfolgreich, 117 freigegebene Deklarationen, 1.122 abgedeckte Duplikate und geordneter Kaskadenvergleich. Das Budget prüft das unveränderte initiale CSS mit 1.759.985 Byte roh, 253.294 gzip und 178.104 Brotli.
- `npm run test:versioning` und `npm run test:approved-dependency-upgrades`: erfolgreich.
- `npm run audit:all`: erfolgreich mit Release-Schwelle HIGH/CRITICAL; der vollständige npm-Audit weist die bekannten **drei moderaten** uuid/xcode/Capacitor-CLI-Befunde aus. Kein `--force`-Fix angewandt.
- `npm run audit:dependencies`: erfolgreich, 83 Produktionspaketversionen geprüft, `state=checked`, 0 Befunde, keine Providerfehler, `recheckRequired=false`.

## Release-Status

Dies ist ein lokaler .329-Source-Kandidat. Der PostCSS-Source-PR und seine MID Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates stehen noch aus. Der .328-Stand bleibt bis zu deren vollständigem Erfolg die freigegebene Version.

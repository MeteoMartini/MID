# MID Dependency Upgrade Policy

Stand: MID Wartungsaudit 31.08.2026

Der Stable-Channel erhält keine ungeprüften Major-/Toolchain-Sprünge. Der reproduzierbare Vertrag bleibt zunächst:

- React / React DOM / react-is: 18.3.1
- Recharts: 3.10.1 (isoliert gegen Diagramm-/Tooltip-/Export-/Responsive-Verträge qualifiziert)
- TypeScript: 7.0.2 (isoliert qualifiziert in v0.9.76.0)
- TypeScript-Strada-Test-API: Alias `typescript-strada` auf 6.0.3, ausschließlich für bestehende Regressionen mit der von TypeScript 7 entfernten JavaScript-Compiler-API; niemals für den App-/Node-Typecheck
- Vite: 6.4.3
- @vitejs/plugin-react: 4.7.0
- Lucide React: 1.34.0 (React 18.3.1 bleibt unverändert)
- MapLibre GL JS: 6.6.0 (6.5.0-Kompatibilitätslinie plus CPU-DEM-Picking ohne GPU-Readback-Stall, reduzierte GPU-Speicherlast und einmaliger color-relief-DEM-Texturupload pro Tile)
- GitHub Actions: checkout 7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`) und setup-node 7.0.0 (`820762786026740c76f36085b0efc47a31fe5020`), jeweils SHA-gepinnt
- CodeQL: 4.37.7 (`ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd`), SHA-gepinnt
- Workflow-Aktivierung: Der Release-Installer verändert `.github` nicht selbst; checkout/setup-node/CodeQL werden über `npm run sync:github-workflows` ausdrücklich administrativ synchronisiert.

Sicherheits-Patches innerhalb kompatibler Transitivreihen werden im Stable-Channel unmittelbar angehoben, sobald `npm audit` einen Befund meldet und die vollständige Regression grün bleibt. Aktueller Mindestvertrag: `nanoid >=3.3.18` im 3.x-Pfad sowie `protocol-buffers-schema >=3.6.1`.

Recharts 3.10.1 ist nach dem isolierten Kandidatenlauf der neue Stable-Vertrag. Weitere Recharts-Minor-/Patch-Upgrades bleiben weiterhin an vollständigen Build sowie Ensemble-/Tooltip-/Export-/Responsive-Regressionen gebunden.

TypeScript 7 wurde als eigener Kompatibilitätsmeilenstein ohne gleichzeitigen React-/Vite-Sprung qualifiziert. Der Stable-Vertrag darf TypeScript 7.0.2 erst nach artefaktfreiem App-/Node-Typecheck, Browser-Produktionsbuild, vollständiger MID-Regression, Worker-Syntaxprüfung und Capacitor-/iOS-Gleichlauf übernehmen.

Da TypeScript 7 die bisherige Strada-JavaScript-API (`transpileModule`, `createSourceFile` und zugehörige Enums) am Paket-Root nicht mehr bereitstellt, nutzen API-basierte Regressionen den offiziell vorgesehenen Side-by-side-Pfad über den exakt gepinnten Alias `typescript-strada` 6.0.3. Der Produktcompiler, sämtliche Release-Typechecks und alle `tsc`-Aufrufe bleiben ausschließlich TypeScript 7.0.2. Direkte Compiler-API-Imports aus `typescript` sind in den Regressionen unzulässig.

React 19, Vite 8 und @vitejs/plugin-react 6 bleiben weiterhin außerhalb von `mid-stable`. Jeder dieser Sprünge benötigt einen getrennten Kompatibilitätslauf; er darf weder implizit mit TypeScript 7 gekoppelt noch ohne vollständige visuelle, funktionale, Performance-, PWA- und CI-Regression übernommen werden.

MapLibre GL JS 6.6.0 wurde als isolierter Minor-/Patch-Kandidat qualifiziert. Der Dependabot-PR erreichte einen grünen TypeScript-/Vite-Produktionsbuild und grünes CodeQL; die roten Regressionen waren ausschließlich auf den alten 6.5.0-Pin festgeschrieben. Die Karten-, Radar-, Komposit-, GeoJSON-, Worker- und Lazy-Load-Verträge bleiben unverändert und werden weiterhin vollständig geprüft.

Die Installationswarnung `uuid@7.0.3` stammt ausschließlich aus dem Dev-/iOS-Werkzeugpfad `@capacitor/cli 8.5.0 -> xcode 3.0.1 -> uuid ^7.0.3`. `@capacitor/cli 8.5.0` und `xcode 3.0.1` sind zum Prüfzeitpunkt die aktuellen stabilen Upstreamstände. MID erzwingt deshalb **kein** inkompatibles UUID-Override; der Pfad wird regressionsgeschützt und bei einem kompatiblen Upstream-Update erneut bewertet.

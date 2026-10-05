# MID Dependency Upgrade Policy

Stand: MID 18.2.9 Wartungsreview 23.09.2026 / Ziel v0.9.85.95

Der Stable-Channel übernimmt Abhängigkeits- und Toolchain-Sprünge nur als zusammenhängend geprüfte Verträge. Für v0.9.83.0 gilt:

- React / React DOM / react-is: 19.2.8 – ausschließlich als gemeinsame React-19-Familie.
- `@types/react`: 19.2.18 und `@types/react-dom`: 19.2.5 passend zur React-19-Familie.
- Recharts: 3.10.1; Diagramm-, Tooltip-, Export- und Responsive-Verträge bleiben erhalten.
- TypeScript: 7.0.2; App- und Node-Typecheck bleiben artefaktfrei.
- TypeScript-Strada-Test-API: Alias `typescript-strada` auf 6.0.3, ausschließlich für bestehende Regressionen mit der von TypeScript 7 entfernten JavaScript-Compiler-API; niemals für App-/Node-Typecheck.
- esbuild: 0.28.2, ausschließlich als direkte Testabhängigkeit für isolierte TypeScript-Fachmodul-Regressionen; nicht als Vite-Minifier oder Produktionsbundler.
- Vite: 8.2.2.
- `@vitejs/plugin-react`: 6.1.1, nur zusammen mit Vite 8; dieser Vertrag koppelt @vitejs/plugin-react 6 ausdrücklich an Vite 8.
- Vite-8-Buildkern: Oxc für JavaScript-Minifizierung, Lightning CSS für CSS-Minifizierung und Rolldown `output.codeSplitting` für die auditierte React-/Charts-Vendor-Aufteilung. Der veraltete esbuild-Minify- und Rollup-`manualChunks`-Pfad ist nicht mehr Bestandteil des Stable-Vertrags.
- Lucide React: 1.40.0.
- MapLibre GL JS: 6.7.0.
- Capacitor Core / iOS / CLI: 8.5.2.
- GitHub Actions: checkout 7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`), setup-node 7.0.0 (`820762786026740c76f36085b0efc47a31fe5020`), setup-python 7.0.0 (`5fda3b95a4ea91299a34e894583c3862153e4b97`), upload-artifact 7.0.1 (`043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`), download-artifact 8.0.1 (`3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c`) und deploy-pages 5.0.1 (`368f82528645a54fb793d4d04e342629a3f51346`), jeweils SHA-gepinnt.
- CodeQL: 4.38.2 (`2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2`), SHA-gepinnt und für `init`/`analyze` zwingend identisch.
- Workflow-Aktivierung: Der Release-Installer verändert `.github` nicht selbst. Die kanonischen Quellen unter `ci/github` und `workflow-patches` sowie `npm run sync:github-workflows` halten die administrativ zu aktivierenden Pins synchron.

## Kopplungsverträge

React 19 wird nicht paketweise übernommen: `react`, `react-dom`, `react-is` und die beiden React-Typepakete müssen gemeinsam auf der qualifizierten 19.2-Reihe liegen. Recharts 3.10.1 und die Redux-Helfer müssen React 19 weiterhin über ihre Peer-Verträge zulassen.

Vite 8 und `@vitejs/plugin-react` 6 bilden ebenfalls einen gemeinsamen Vertrag. Plugin-react 6 verlangt Vite 8; Vite 8 verwendet Rolldown/Oxc und Lightning CSS. MID nutzt deshalb keine deprecated `build.minify: 'esbuild'`, `build.cssMinify: 'esbuild'` oder `build.rollupOptions.output.manualChunks`-Konfiguration mehr.

TypeScript 7.0.2 bleibt von dieser Folgemigration fachlich unabhängig. Der historische TypeScript-7-Meilenstein wurde zunächst ohne React-/Vite-Major-Sprung qualifiziert; v0.9.83.0 ändert daran weder Compilerstand noch Strada-Alias. Das verhindert, dass ein Fehler des neuen Bundler-/React-Vertrags fälschlich als TypeScript-Migration kaschiert wird.

## Sicherheits- und Wartungsregeln

Sicherheits-Patches innerhalb kompatibler Transitivreihen werden im Stable-Channel angehoben, sobald Dependency-Audit und Regressionen grün bleiben. Mindestvertrag: `nanoid >=3.3.18` im 3.x-Pfad sowie `protocol-buffers-schema >=3.6.1`.

Recharts-Minor-/Patch-Upgrades bleiben an vollständigen Build sowie Ensemble-/Tooltip-/Export-/Responsive-Regressionen gebunden. Weitere React-, Vite- oder plugin-react-Majors benötigen erneut einen eigenen Kompatibilitätsmeilenstein; partielle Major-Migrationen sind unzulässig.

MapLibre GL JS 6.7.0 bleibt der qualifizierte Kartenstand. Die Karten-, Radar-, Komposit-, GeoJSON-, Worker- und Lazy-Load-Verträge dürfen durch Toolchain-Wartung nicht verändert werden.

Die Installationswarnung `uuid@7.0.3` stammt ausschließlich aus dem Dev-/iOS-Werkzeugpfad `@capacitor/cli 8.5.2 -> xcode 3.0.1 -> uuid ^7.0.3`. MID erzwingt kein inkompatibles UUID-Override; der Pfad wird bei einem kompatiblen Upstream-Update erneut bewertet.


## Wartungsreview 23.09.2026

Der veröffentlichte Stable-Vertrag bleibt für diesen fachlichen Härtungsrelease bewusst reproduzierbar gepinnt. Aktuell geprüft wurden folgende Upstream-Kandidaten:

- MapLibre GL JS 6.11.1 statt 6.7.0: sinnvoller nächster isolierter Karten-/Radar-Meilenstein. Die Aktualisierung verändert transitive Kartenpakete und benötigt daher ein neu erzeugtes Lockfile sowie vollständige Worker-, GeoJSON-, Radar-, Komposit- und mobile Langzeittests.
- Capacitor Core / iOS / CLI 8.5.2 statt 8.5.1: sinnvoller isolierter iOS-Lifecycle-/Safe-Area-Patchkandidat. Er wird nur gemeinsam für Core, iOS und CLI übernommen.
- Vite 8.3.0 statt 8.2.2: sinnvoller nachgelagerter Build-Performance-Patchkandidat. Vite und plugin-react bleiben ein gekoppelter Buildvertrag.
- React 19.3.0 ist ein separater Kompatibilitätsmeilenstein und ausdrücklich **kein** Patch dieses Releases. React, React DOM, react-is, Typen und Recharts werden erst gemeinsam nach eigenem UI-/Tooltip-/Ref-/Responsive-Gate aktualisiert.

Für v0.9.85.95 gilt: keine package.json-only-Aktualisierung und kein manuell erfundener Lockfile-Hash. Ohne reproduzierbar neu erzeugtes npm-Lockfile bleibt der bereits grüne Stable-Pin bestehen. Damit hat Reproduzierbarkeit Vorrang vor einem nominell neueren Paketstand.


## Wartungsreview 30.09.2026 · v0.9.85.128

- `brace-expansion` wird innerhalb des von `minimatch` bereits erlaubten 5.x-Pfads ausschließlich im Lockfile von 5.0.9 auf 5.0.12 angehoben, um die aktuellen High-Severity-DoS-Advisories zu schließen. Der Produktions-Abhängigkeitsvertrag wird dadurch nicht erweitert.
- Der bekannte `uuid@7.0.3`-Befund bleibt auf den Dev-/iOS-Werkzeugpfad über `xcode` begrenzt. Ein inkompatibles Override oder `npm audit fix --force` bleibt unzulässig; der Pfad wird mit einem kompatiblen Capacitor-/xcode-Update qualifiziert.
- `actions/download-artifact` wird im bestehenden RUC-Publishpfad auf v8.0.1 und den vollständigen Commit-SHA gepinnt. Die strengere Digest-Prüfung bleibt aktiv; ein Hash-Mismatch soll den Workflow fail-closed stoppen.
- Der alte gruppierte Dependabot-PR für React/MapLibre/Vite/Capacitor wird nicht als Paket übernommen. Die in diesem Vertrag festgelegten isolierten Kompatibilitätsmeilensteine bleiben maßgeblich.

## Wartungsfreigabe 05.10.2026 · v0.9.85.169

Capacitor Core/iOS/CLI 8.5.2, Share 8.0.2 und jsfive 0.4.2 sind gemeinsam mit Lockfile und nativen Referenzen geprüft. Die früher gelistete Capacitor-Patch-Empfehlung ist damit umgesetzt. Framework-/Karten-Major- und größere Minorupdates bleiben eigenständige Prüfvorhaben. Produktionsaudit: 0 bekannte Befunde; drei moderate Dev-/iOS-Werkzeugbefunde bleiben upstream, ohne inkompatible Overrides.

## v0.9.85.170 · CSS-Aggregate-Parser

PostCSS 8.5.28 (bereits transitiv durch Vite vorhanden) wird direkt und exakt als Entwicklungsabhängigkeit für die auditierte CSS-Kaskadenkonsolidierung deklariert. Keine Änderung an Produktionsabhängigkeiten oder Framework-Versionen.

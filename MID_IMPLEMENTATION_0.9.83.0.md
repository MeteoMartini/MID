# MID v0.9.83.0 – Toolchain-Kompatibilitätsmigration

## Ausgangspunkt

Verbindliche Basis ist `mid-stable` **v0.9.82.1** (Commit `300e7bf0f45477341c46ab2a24149a08415bba10`). Die Migration verändert keine Wetter-, Klima-, Warn-, Radar-, Synoptik-, Favoriten-, Wetterzwilling- oder Worker-Fachlogik.

## Abhängigkeiten

Die zuvor getrennten Dependabot-Vorschläge werden nicht paketweise, sondern als gekoppelte Kompatibilitätsmigration umgesetzt:

- React / React DOM / react-is **19.2.8**
- `@types/react` **19.2.18**, `@types/react-dom` **19.2.5**
- Recharts bleibt **3.10.1**
- Lucide React **1.40.0**
- TypeScript bleibt **7.0.2**; `typescript-strada` bleibt **6.0.3**
- Vite **8.2.2** und `@vitejs/plugin-react` **6.1.1** gemeinsam

Die Lockfile-Peer-Verträge von Recharts, React Redux, Redux Toolkit und Lucide lassen React 19 zu. Eine Quelltextprüfung fand keine entfernten Legacy-Einstiege wie `ReactDOM.render`, `ReactDOM.hydrate`, `findDOMNode` oder `react-dom/test-utils` im produktiven `src`-Baum.

## Vite 8

Der bisherige Vite-6-Pfad wird auf den nativen Vite-8-Buildkern migriert:

- JavaScript-Minifizierung: **Oxc** statt esbuild
- CSS-Minifizierung: **Lightning CSS** statt esbuild
- Bundler: **Rolldown**
- React-/Charts-Vendortrennung über `output.codeSplitting.groups`
- MapLibre bleibt außerhalb einer erzwungenen Vendorgruppe und damit an seiner bestehenden Lazy-Grenze
- deprecated `rollupOptions.output.manualChunks` sowie esbuild-Minify-Konfigurationen werden entfernt

## GitHub Actions

- `actions/deploy-pages` auf SHA-gepinntes **5.0.1** synchronisiert.
- CodeQL `init` und `analyze` bleiben gemeinsam auf SHA-gepinntem **4.37.9**.
- Der bestehende Sicherheitsvertrag bleibt erhalten: Der Release-Installer verändert `.github` nicht selbst; aktive Workflow-Pins werden ausschließlich über den expliziten administrativen Sync aktualisiert.

## Worker / iOS

Die Worker-Fachlogik ist unverändert; nur die Releasekennung wurde auf **0.9.83.0** synchronisiert und das kanonische Worker-Aggregat neu erzeugt. Ein manueller Worker-Upload ist deshalb nicht erforderlich.

Die gemeinsame Browser-/Capacitor-Codebasis bleibt erhalten. Ein nativer iOS-Build muss nach erfolgreichem npm-Produktionsbuild wie bisher mit `npm run ios:sync` beziehungsweise dem Installationsworkflow neu kopiert werden; die eingebettete Webkopie wird nicht künstlich umetikettiert.

## Prüfung in der isolierten Arbeitsumgebung

Erfolgreich geprüft wurden die geänderten Dependency-/Lockfile-/Workflow-/Vite-Verträge, Stable-Hardening, Performance-/Build-Konfiguration, Versions-/Baseline-/Lineage-Verträge und die Worker-Syntax. Die vollständige lockfile-genaue npm-Installation konnte in der isolierten Umgebung nicht beendet werden, weil der Registry-Abruf nicht fortschritt. Der offizielle Release-Preflight bleibt deshalb bewusst fail-closed und muss im GitHub-Installer den echten TypeScript-7-/Vite-8-Produktionsbuild sowie die vollständige Regression ausführen.

# MID v0.9.67.3 – Dependency- und Actions-Wartungsrelease

Ausgangsbasis ist der vollständig geprüfte MID-v0.9.67.2-Stand. Dieses Release übernimmt ausschließlich den freigegebenen Wartungsblock; React 19, TypeScript 7, Vite 8 und @vitejs/plugin-react 6 bleiben weiterhin außerhalb dieses Stable-Releases.

## PR #16 – Lucide React

- `lucide-react` von 1.31.x auf **1.34.0** angehoben.
- `package.json`, `package-lock.json`, Dependency-Policy und Freigaberegression gemeinsam synchronisiert.
- React bleibt auf **18.3.1**.

## PR #17 – MapLibre GL JS

- `maplibre-gl` von **5.24.0** auf **6.5.0** angehoben.
- Direkte und transitive Lockfile-Pfade wurden auf die zu 6.5.0 gehörende Abhängigkeitslinie synchronisiert.
- Die MapLibre-Pin-Regression erwartet nun 6.5.0.
- Damit ist auch die in der 6.4.1-Linie enthaltene DOM-Sanitizing-Korrektur Bestandteil des verwendeten MapLibre-Stands.
- Karten-, Overlay-, Extremflächen-, Radar- sowie Touch-/Performance-Verträge bleiben als Regressionen geschützt.

## PR #15 – CodeQL

- `github/codeql-action` von 4.37.6 auf **4.37.7** angehoben.
- `init` und `analyze` sind exakt auf **ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd** SHA-gepinnt.

## PR #1/#2 – GitHub Actions-Synchronisierung

Die alten Dependabot-Vorschläge werden nicht blind übernommen. `scripts/sync-github-workflows.mjs` bleibt die kanonische Quelle und synchronisiert alle historischen Zusatzworkflows auf:

- `actions/checkout` v7.0.1: **3d3c42e5aac5ba805825da76410c181273ba90b1**
- `actions/setup-node` v7.0.0: **820762786026740c76f36085b0efc47a31fe5020**

## Stabilitätsgrenze

Nicht Bestandteil dieses Releases sind React 19, TypeScript 7, Vite 8 oder @vitejs/plugin-react 6. Diese Sprünge bleiben einem separaten Kompatibilitätslauf vorbehalten.
## Build-/Release-Validierung

- Kombinierter v0.9.67.3-Quellstand: 549 von 551 automatisch erkannten Regressionstests lokal erfolgreich. Die beiden lokal nicht ausführbaren Tests benötigen `esbuild`.
- PR #17 (MapLibre GL JS 6.5.0): echtes `npm ci`, TypeScript und Vite-6.4.3-Produktionsbuild erfolgreich; 549/550 Regressionen erfolgreich. Der einzige rote Test war der noch auf MapLibre 5.24.0 fest verdrahtete Pin-Test, der in v0.9.67.3 aktualisiert ist. Damit liefen dort auch die beiden `esbuild`-abhängigen Extremflächen-Regressionen erfolgreich.
- PR #16 (Lucide React 1.34.0): echtes `npm ci`, TypeScript und Vite-6.4.3-Produktionsbuild erfolgreich; 549/550 Regressionen erfolgreich. Der einzige rote Test war der noch auf Lucide 1.31.0 fest verdrahtete Freigabetest, der in v0.9.67.3 aktualisiert ist.
- Der Professional-Release-ZIP enthält bewusst keinen lokal veralteten `dist`-Ordner. `install-mid.yml` übernimmt die Quellen mit `rsync --delete`, führt reproduzierbar `npm ci` und anschließend `npm run verify` aus und erzeugt dabei den frischen Produktionsbuild.

## GitHub-Workflow-Aktivierung

Die Release-Quellen enthalten die aktualisierten SHA-Pins und die kanonischen `ci/github`-Quellen. Der MID-Installer verändert `.github` absichtlich nicht automatisch (Schutz gegen Workflow-Selbstmodifikation). Deshalb müssen checkout/setup-node/CodeQL nach der Quellinstallation über den expliziten administrativen Workflow-Sync bzw. einen separaten geprüften Workflow-Commit aktiviert werden; dieser Sicherheitsvertrag wird für v0.9.67.3 nicht aufgeweicht.

## iOS-Shell

Xcode-/Capacitor-Projektstruktur und Versionsmetadaten stehen auf v0.9.67.3. Die bereits eingebettete Webkopie unter `ios/App/App/public` stammt jedoch noch aus dem zuletzt erfolgreich ausgeführten v0.9.67.2-`cap sync`. Sie wird nicht lediglich umetikettiert. Vor einem nativen v0.9.67.3-Xcode/TestFlight-Build ist daher `npm run ios:sync` in einer vollständigen NPM-/macOS-Umgebung auszuführen. Dies blockiert den Web-/Worker-Release nicht.

## Release-Pakete

- `MID-professional-replacement.zip` wird aus dem geprüften v0.9.67.3-Quellstand erzeugt. `dist/`, `node_modules/` und `.git/` sind bewusst nicht enthalten; der Production-Build wird in der Installationspipeline frisch aus dem verifizierten Lockfile erzeugt.
- `MID-worker.zip` enthält ausschließlich `worker.js`. `worker.js` und `worker/metar-proxy.js` sind bytegleich und tragen `WORKER_VERSION = 0.9.67.3`.
- Die eingebettete iOS-Webkopie bleibt bis zum nächsten echten `npm run ios:sync` nachvollziehbar auf v0.9.67.2; sie wird im Web-/Worker-Wartungsrelease nicht künstlich umetikettiert.

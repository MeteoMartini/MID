# MID Implementation 0.9.78.59

Hotfix für GitHub-Actions-Run #890 (`eb772779841b2a3c81bf0bf7850db82892f109d1`).

- Der vollständige MID-Produktionspfad von 0.9.78.58 war erfolgreich: `npm ci`, Dependency-Audit, TypeScript 7.0.2, Vite 6.4.3, alle 677 Regressionstests, Capacitor-iOS-Übernahme und Release-Commit.
- Der Abbruch entstand ausschließlich im nachgelagerten automatischen Cloudflare-Worker-Deploy.
- Ursache: Der im Repository noch aktive ältere `install-mid.yml`-Stand ruft `tools/cloudflare/prepare_worker_deploy.mjs` mit den zwei historischen Ausgabepfaden `/tmp/mid-wrangler-worker.json` und `/tmp/mid-worker-deploy-meta.json` auf. Der neuere Helper hatte diese Positionsargumente aus Sicherheitsgründen nicht mehr konsumiert und ausschließlich private zufällige Temp-Pfade über `GITHUB_OUTPUT` geliefert.
- Der Helper unterstützt nun beide Generationen fail-closed: der kanonische aktuelle Workflow bleibt bei privaten zufälligen Temp-Pfaden; ausschließlich die zwei exakt bekannten Legacy-Pfade werden als Übergangsbrücke akzeptiert. Beliebige Positionspfade bleiben verboten.
- `GITHUB_OUTPUT` gibt in beiden Modi die tatsächlich erzeugten Pfade aus. Damit funktionieren der aktive Altworkflow und der bereits im Release enthaltene kanonische neue Workflow gleichzeitig.
- Keine Änderung der meteorologischen App- oder Worker-Fachlogik.

Neue Regression:
- `scripts/test-worker-auto-deploy-legacy-path-097859.mjs`

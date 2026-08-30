# MID Implementation v0.9.74.7

## Anlass

GitHub **Install MID release and deploy #771** für Commit `b3ad327b5a20ac6da3376bc6bdaefa335aa8732d` installierte den Professional-Stand v0.9.74.6 korrekt. `npm ci`, Dependency-Audit, TypeScript und Vite waren grün. Von **577** automatisch erkannten Regressionen bestanden **576**; ausschließlich `scripts/test-ruc-dwd-pipeline-09690.mjs` scheiterte.

Die Ursache war erneut kein RUC-Fachfehler. Die vorherige Mitigation hatte zwei RUC-Workflow-Regressionen auf das Release-vor-Admin-Sync-Fenster v0.9.74.5/.6 synchronisiert, während `test-ruc-dwd-pipeline-09690.mjs` irrtümlich weiterhin nur exakt v0.9.74.5 zuließ. Damit war die Übergangslogik über mehrere Tests verteilt und versionsgebunden – ein strukturell fragiler Vertrag.

## Mitigation

v0.9.74.7 ersetzt die drei voneinander abweichenden Versionsfenster durch einen gemeinsamen **zustandsgebundenen Workflow-Sync-Vertrag** in `scripts/ruc-workflow-sync-contract.mjs`:

- `synced`: aktive `.github/workflows/mid-ruc-preprocess.yml` und kanonische `ci/github/workflows/mid-ruc-preprocess.yml` sind bytegleich.
- `pending-admin-sync`: ausschließlich der exakt bekannte geschützte Legacy-Zustand wird vorübergehend akzeptiert: nur `:41`, äußeres `cancel-in-progress: true`, kein `:11` und kein Freshness-Guard. Gleichzeitig muss der kanonische Workflow den vollständigen neuen :11/:41-Catch-up-Vertrag tragen.
- `unsafe-drift`: jede andere Abweichung bleibt fail-closed.
- `invalid-canonical`: ein unvollständiger oder zurückgerollter kanonischer Catch-up-Workflow bleibt fail-closed.

Damit hängt der sichere Release-vor-Admin-Sync-Zustand nicht mehr von einer künstlichen Versionsliste ab. Sobald der explizite Admin-Sync erfolgt, wechselt derselbe Vertrag automatisch auf `synced`; ein teilweiser oder unbekannter Workflowzustand kann die Regression nicht passieren.

Eine neue Regression `scripts/test-ruc-workflow-sync-transition-09747.mjs` prüft synchronen Zustand, exakt erlaubten Legacyzustand, unsichere Drift und unvollständigen kanonischen Catch-up-Workflow.

## Unverändert

DWD-RUC/RUC-EPS-Fachdaten, parameter-native 5-/15-/60-Minuten-Kadenzen, kanonische Forecast-Fusion, Pages-Free-Projektion, 950-MB-Grenze, Post-Deploy-Health-Konvergenz, RUC-Scheduler-Catch-up selbst, Worker-Runtime, Browser/PWA/iOS-Fachkern und Kostenvertrag bleiben unverändert. Der Worker erhält nur synchronisierte Versionsmetadaten; ein manueller Worker-Upload ist nicht erforderlich.

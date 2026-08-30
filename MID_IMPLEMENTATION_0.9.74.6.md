# MID Implementation v0.9.74.6

## Anlass – Release-CI Run #770

GitHub **Install MID release and deploy #770** für Commit `73071d415cea7b0ad275c92fdbe678a04ce39dfc` installierte den Professional-Stand v0.9.74.5 erfolgreich. `npm ci`, Dependency-Audit, TypeScript und Vite waren grün. Von **577** automatisch erkannten Regressionen scheiterte ausschließlich `scripts/test-ruc-pages-free-storage-09700.mjs`.

Die Ursache war kein RUC-Fachfehler: Der Test verlangte noch bytegleiche aktive `.github/workflows/mid-ruc-preprocess.yml` und kanonische `ci/github/workflows/mid-ruc-preprocess.yml`. Genau diese Bytegleichheit ist während des bewusst geschützten Release-vor-Admin-Sync-Fensters von v0.9.74.5 nicht gegeben: der normale Release-Installer darf `.github` nicht selbst verändern, während der kanonische Workflow bereits den neuen :11/:41-Catch-up-Guard enthält.

## Mitigation

- `test-ruc-pages-free-storage-09700.mjs` akzeptiert die Abweichung nur, wenn der aktive Workflow exakt den bekannten geschützten Legacy-Zustand trägt (`:41`, `cancel-in-progress: true`, kein Scheduler-Guard) **und** die Releaseversion exakt v0.9.74.5 oder v0.9.74.6 ist.
- Der kanonische `ci/github`-Workflow wird weiterhin vollständig auf Pages-Free-Profil, 950-MB-Grenze, `mid-stable`, Catch-up-Guard und RUC-Verträge geprüft. Die fachlichen Prüfungen werden nicht abgeschwächt.
- `test-ruc-schedule-catchup-09745.mjs` erhält dieselbe eng begrenzte v0.9.74.5/.6-Übergangsausnahme. Ab v0.9.74.7 würde eine nicht synchronisierte aktive `.github`-Datei wieder hart fehlschlagen.
- Die Ausnahme wurde um genau einen Hotfix verlängert, weil v0.9.74.5 wegen dieser veralteten Regression nie als grüner Release finalisiert werden konnte und der vorgesehene anschließende Admin-Sync deshalb noch nicht stattfinden durfte.

## Unverändert

RUC-Fachlogik, DWD-Download/Decode, parameter-native 5/15/60-min-Taktung, Forecast-Fusion, Pages-Free-Projektion, 950-MB-Sicherheitslimit, Post-Deploy-Health-Convergence, Worker-Runtime, Browser/PWA/iOS-Fachkern und Kostenvertrag bleiben unverändert.

## Deployment

Zuerst v0.9.74.6 über `MID-professional-replacement.zip` normal veröffentlichen. Nach grünem Release **unmittelbar** die explizite Workflow-Synchronisierung auf `main` und `mid-stable` anwenden. Kein manueller Worker-Upload und kein manuelles Starten des Release-Workflows erforderlich.

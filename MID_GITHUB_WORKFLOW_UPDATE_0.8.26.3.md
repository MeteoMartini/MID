## Einmalige GitHub-Workflow-Aktualisierung für MID v0.8.26.3

Das Frontend-ZIP lässt sich nun auch mit dem bisher aktiven älteren Installationsworkflow fehlerfrei installieren.

Damit zusätzlich die neuen CI-Sicherheits- und Wartungsfunktionen aktiv werden, muss `MID-github-workflows-v0.8.26.3.zip` einmalig manuell in den Branch `main` übernommen werden. Das ZIP enthält ausschließlich:

- `.github/workflows/install-mid.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/dependency-audit.yml`
- `.github/dependabot.yml`

Der Installationsworkflow verändert diese Dateien künftig nicht selbst. Das verhindert wiederkehrende Berechtigungs- und Selbständerungsprobleme. Eigene zusätzliche Workflows bleiben unangetastet.

Keine Cloudflare-Variablen, Bindings oder Routen sind zu ändern.

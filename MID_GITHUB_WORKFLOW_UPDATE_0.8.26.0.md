## Einmalige GitHub-Workflow-Aktualisierung für MID v0.8.26.0

Der bisherige Installer bis einschließlich v0.8.25.4 schließt `.github/` beim Übernehmen eines Release-ZIPs ausdrücklich aus. Deshalb können die neuen Sicherheits- und Wartungsworkflows beim ersten Einspielen von v0.8.26.0 noch nicht automatisch installiert werden.

Einmalig im Repository auf dem Branch `main` ersetzen beziehungsweise ergänzen:

- `.github/workflows/install-mid.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/dependency-audit.yml`
- `.github/dependabot.yml`

Die Workflowdateien bleiben bewusst separat: Ein laufender Installationsjob darf sie nicht selbst überschreiben. Bei späteren Änderungen wird daher erneut ein ausdrücklich gekennzeichnetes Workflowpaket bereitgestellt. Es sind keine Cloudflare-Variablen, Bindings oder Routen zu ändern.

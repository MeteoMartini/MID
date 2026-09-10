# MID v0.9.84.21 – einmalige GitHub-Workflow-Aktivierung

Der normale MID-Release-Installer ersetzt `.github/` absichtlich nicht. Dadurch kann ein
Release-Token keine produktiven GitHub-Actions selbst umschreiben. Die Workflow-Optimierung
wird deshalb nach einem erfolgreichen v0.9.84.21-Release einmal administrativ synchronisiert.

## Empfohlener Ablauf (auch im Browser/Codespaces)

1. `MID-professional-replacement.zip` wie gewohnt in das Repository-Hauptverzeichnis auf
   `main` hochladen und den Release-Lauf v0.9.84.21 erfolgreich abschließen lassen.
2. Danach einen Codespace bzw. ein Terminal auf dem aktuellen `main` öffnen und ausführen:

```bash
git switch main
git pull --ff-only origin main
npm run sync:github-workflows
git diff --check
git status --short .github
git add .github
git commit -m "chore(ci): activate MID v0.9.84.21 workflow optimizations"
git push origin main
```

3. Unter **Actions** prüfen, dass der einmalige `MID RUC schedule watchdog`-Self-Test grün
   endet. Er startet keinen unnötigen Vollbau, solange ein RUC-Lauf aktiv oder der Snapshot
   bereits aktuell ist.

## Was der Sync automatisch erledigt

- RUC-Watchdog auf `:23/:53` statt sechs Prüfungen pro Stunde.
- RUC-Dispatch standardmäßig `force=false`.
- FIFO-Warteschlange `queue: max` für die gemeinsame `mid-pages`-Publikation.
- Wiederverwendung bereits erfolgreicher Pages-Artefakte über Deployment-Retries.
- Schlankes Pages-RUC-Abhängigkeitspaket und die kanonischen Workflow-Aktualisierungen.
- Der historische v0.9.19.0-Revisionsinstaller reagiert nicht mehr auf normale `main`-Pushes;
  sein manueller Recovery-Pfad bleibt erhalten.
- Freigegebene GitHub Actions bleiben auf vollständige Commit-SHAs gepinnt.

## Nicht erforderlich

- Keine YAML-Datei von Hand bearbeiten.
- Keine GitHub-Secrets oder Variablen ändern.
- Den unabhängigen Cloudflare-RUC-Watchdog nicht abschalten.
- Keine laufenden RUC-/Release-Jobs abbrechen, nur um den Sync vorzuziehen.
- Kein separater Worker-Upload, sofern der Release-Installer keinen fachlichen Worker-Diff
  meldet.

# MID v0.9.57.2 – Installer-Push-Race-Hardening

- Installer-Checkout ist an den auslösenden `github.sha` gebunden statt während des Laufs unbemerkt auf einen neueren `main`-Stand zu wechseln.
- Vor dem Release-Push wird `origin/main` erneut geladen.
- Reine `.github`-Änderungen dürfen sicher per Rebase übernommen werden.
- Neue Anwendungs-, Dependency- oder ZIP-Änderungen brechen den älteren Lauf ab, statt einen neueren Stand zu überschreiben.
- Der Push wird bei einem erneuten Parallel-Race bis zu dreimal versucht; Force-Push auf `main` bleibt verboten.

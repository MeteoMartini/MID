# MID v0.9.74.10 – RUC/Pages-Concurrency- und Browser-Upload-Hotfix

## Ausgangslage

Nach der Workflow-Synchronisierung blieb ein erwarteter `:11`-RUC-Schedule-Run aus. GitHub-`schedule` bleibt best-effort; die vorhandenen versetzten `:11`/`:41`-Slots und der Freshness-Guard sind deshalb weiterhin erforderlich. Zusätzlich bestand eine echte Cross-Workflow-Cancellation-Gefahr: RUC und Release-Pages nutzten dieselbe Concurrency-Gruppe `mid-pages`, während die Release-Pages-Jobs `cancel-in-progress: true` gesetzt hatten. Ein Release konnte damit einen bereits laufenden RUC-Pages-Job abbrechen.

Der v0.9.74.9-Professional-Transport war außerdem durch sechs bytegleiche 2732×2732-Splash-Kopien und ein bereits generiertes Capacitor-Webbundle größer als das GitHub-Browser-Uploadlimit.

## Umsetzung

- Alle drei Pages-Deployversuche des Release-Installers behalten die gemeinsame Gruppe `mid-pages`, verwenden nun aber `cancel-in-progress: false`. Damit werden RUC- und Release-Pages-Publikationen seriell abgearbeitet statt gegenseitig abgebrochen. Die übergeordnete Release-Supersession `mid-install-${{ github.ref }}` mit `cancel-in-progress: true` bleibt erhalten, sodass ein neuerer Release weiterhin einen älteren Release-Run ersetzt.
- RUC behält unverändert die versetzten `:11`-/`:41`-Slots, den billigen Freshness-/Catch-up-Guard und `cancel-in-progress: false`. Ein von GitHub selbst verworfener Schedule-Event kann weiterhin keinen sichtbaren No-op-Run erzeugen; der zweite Slot bleibt der kostenlose Recovery-Pfad.
- Der native Light-/Dark-Splash verwendet je Appearance nur noch **eine** vollständige 2732×2732-PNG-Quelle im Asset Catalog. Die bisherigen 2x/3x-Dateien waren byteidentische Vollauflösungskopien und wurden entfernt; Xcode darf die universelle 1x-Quelle auf die jeweilige Geräteskala rendern. PNG-Integritätsprüfung bleibt vollständig aktiv.
- Neuer reproduzierbarer Packer `tools/release/create_professional_zip.py`: transportiert keine `.github`-Self-Modification, keine Build-/Dependency-Ausgaben und insbesondere nicht `ios/App/App/public`. Der Installer erzeugt nach grünem Vite-Build mit `cap copy ios` genau dieses iOS-Webbundle neu und verifiziert die Releaseversion vor dem Commit.
- Der Packer erzwingt 24.000.000 Byte als Sicherheitsgrenze unterhalb des 25-MB-Browserlimits.
- Neue Required Regression `scripts/test-release-upload-budget-097410.mjs` schützt Pages-Serialisierung, RUC-Catch-up, Splash-Deduplizierung und den Transportpacker.

## Releasewirkung

Maintenance-Hotfix ohne Änderung an Forecast-Fusion, RUC-Fachdaten, Worker-Runtime, Browser-Fachlogik oder Apple-Capabilities. Kein iOS-Fork. Manueller Worker-Upload ist nicht erforderlich. Die aktive `.github/workflows/install-mid.yml` muss als administrativer Workflow-Sync auf `main` und `mid-stable` denselben `cancel-in-progress: false`-Stand erhalten; die kanonische Kopie liegt im Professional-Release unter `ci/github/workflows/install-mid.yml`.

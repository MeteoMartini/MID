# MID v0.9.85.179 · Widget-Export-Trigger

## Ausgangslage

v0.9.85.178 wurde vollständig über Source-Gate, Installer, Pages und Stable-Promotion veröffentlicht. `main` und `mid-stable` waren anschließend identisch auf `16c007b264599c7162bd174d03179b2a4363d7e2`.

Der neue Workflow `MID Widget PNG Export` war zu diesem Zeitpunkt im Repository vorhanden, erschien jedoch weder unmittelbar nach dem erfolgreichen Installerlauf noch im ersten beobachteten Stundenfenster als Workflow-Lauf.

## Korrektur

Zusätzlich zu den bestehenden Triggern erhält der Workflow:

```yaml
push:
  branches:
    - mid-stable
```

Damit wird jede reguläre Stable-Promotion selbst zum deterministischen Startsignal. Da der Renderjob ohnehin ausdrücklich `mid-stable` auscheckt und die öffentliche `version.json` gegen die Stable-Version verifiziert, bleibt der bestehende Fail-closed-Vertrag erhalten.

## Redundanz

Weiterhin aktiv:
- `workflow_run` nach erfolgreichem MID-Installer,
- stündlicher Cron um Minute 17,
- manueller `workflow_dispatch`.

Der neue Regressionstest `scripts/test-widget-export-stable-trigger-0985179.mjs` schützt den direkten Stable-Trigger sowie die drei bestehenden Startwege.

## Abgrenzung

Keine Änderung an Wetterdaten, meteorologischer Logik, RUC, Karten, Workerfunktion, Widgetprofilen oder Widgetdarstellung.

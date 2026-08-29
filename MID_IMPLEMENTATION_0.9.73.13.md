# MID v0.9.73.13 – Worker/RUC-Bootstrap-Gate nach Release-Run #762

## Befund aus Run #762

Der v0.9.73.12-Upload wurde im Installer vollständig erfolgreich verarbeitet. ZIP-Prüfung, reproduzierbare Installation, Dependency-Audit, TypeScript, Vite-Produktionsbuild, vollständige Regressionen und die Capacitor-iOS-Webübernahme waren grün. Der Release-Commit wurde erzeugt.

Der Lauf scheiterte erst im getrennten automatischen Worker-Deploy. Die neue Worker-Version wurde erfolgreich hochgeladen und bei **0 % Traffic** neben dem bisherigen v0.9.73.8-Worker bereitgestellt. Der Versionsoverride-Healthcheck bestätigte die neue MID-Version, verwarf sie aber wegen:

`RUC-Lauf nicht frisch`

Danach griff der vorgesehene automatische Rollback; v0.9.73.8 blieb produktiv bei 100 %. Pages und `mid-stable` wurden nicht finalisiert.

## Ursache: zirkuläre Bootstrap-Abhängigkeit

Der Worker-Smoke verlangte bei aktivierter RUC-Pipeline zwingend `configured=true`, `ready=true` und `fresh=true`. Gleichzeitig lädt der RUC-Preprocessing-Workflow bewusst den letzten **veröffentlichten `mid-stable`-Stand**. Dieser enthält bis zur erfolgreichen Finalisierung noch die alte RUC-Ingestion, die Run #7 an künstlich erwarteten `:15/:30/:45`-Zustandswerten scheitern ließ.

Damit entstand ein Zirkel:

1. Der neue Release mit der parameter-nativen RUC-Korrektur darf erst nach einem frischen RUC-Snapshot finalisiert werden.
2. Ein frischer RUC-Snapshot kann erst zuverlässig mit dem korrigierten, finalisierten `mid-stable` erzeugt werden.

Das ist kein App-, TypeScript-, Vite-, Regression- oder Worker-Uploadfehler, sondern ein zu streng gekoppeltes Aktivierungs-Gate.

## Sichere Korrektur

`tools/cloudflare/check_worker_health.mjs` behält den normalen Worker-Health-/Versionscheck unverändert hart bei. Für den RUC-Anteil werden jetzt zwei deployment-sichere Zustände unterschieden:

- **ready/fresh**: unverändert vollständig grün.
- **stale-bootstrap-safe**: ausschließlich dann zulässig, wenn RUC konfiguriert ist, das Schema gültig ist, ein realer Lauf mit positiven Punkt-/Zeit-/Ensemble-Metadaten vorliegt und der einzige Fehler exakt `RUC-Lauf nicht frisch` lautet.

Nicht konfigurierte Datenwege, ungültige Schemas, fehlende Metadaten, fehlende Läufe und andere Health-Ursachen bleiben harte Fehler. Der Schutz wird durch Regressionen für ready/fresh, sicheren Stale-Bootstrap und ungültiges Schema abgesichert.

Die fachliche Runtime bleibt zusätzlich fail-closed: ein stale RUC-Snapshot wird weder aus Pages noch aus R2 in den Forecast übernommen. Nach erfolgreicher Release-Aktivierung bleibt der RUC-Preprocessing-Workflow weiterhin streng und verlangt bei seiner Post-Publish-Prüfung `ready=true`, `fresh=true`, `schemaValid=true` sowie den erwarteten Lauf und die Laufobjekte.

## Wirkung / Rollout

v0.9.73.13 soll damit den korrigierten Worker und Quellstand einmalig aus dem Bootstrap-Zirkel auf `mid-stable` bringen. Anschließend kann der nächste RUC-Workflow den parameter-nativen Snapshot erzeugen und wieder den regulären fresh-Zustand herstellen.

Kein manueller Worker-Upload, kein R2 und keine kostenpflichtige Infrastruktur sind erforderlich. Der automatische 0-%-Smoke, die Promotion und der Rollback-Schutz bleiben bestehen.

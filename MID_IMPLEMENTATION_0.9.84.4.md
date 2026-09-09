# MID v0.9.84.4 – sichere Deployment-Wartezeitoptimierung

## Inhalt

- Der RUC-Publish prüft nicht mehr pauschal alle laufenden `install-mid`-Runs.
- Die RUC-Vorbereitung schreibt den verwendeten `mid-stable`-SHA als Artefaktmetadatum fest.
- Unter dem unveränderten `mid-pages`-Lock wird dieser SHA vor dem Zusammensetzen und unmittelbar vor dem Pages-Publish erneut geprüft.
- Die Stable-Promotion des MID-Releases verwendet denselben nicht abbrechbaren kurzen Abschluss-Lock. Dadurch können Stable-Promotion und RUC-Publish nicht zwischen Prüfung und Veröffentlichung überholen.
- Build, Audit, Regressionen, Worker-Smoke, Fast-Forward-Prüfung, Statusbindung, Environment-/OIDC-Schutz und Rollback bleiben unverändert aktiv.

## Bewusste Nichtänderungen

- Keine Abschwächung von Branch-Schutz, SHA-gepinnten Actions, Dependency-Audit oder vollständigen Regressionstests.
- Keine parallelen Pages-Deployments und kein Force-Push.
- Keine Änderung am kostenfreien GitHub-Pages-Pfad oder an der nativen DWD-ICON-D2-RUC-Verarbeitung (0–14 h plus bestehende Vollständigkeitsprüfungen).
- `.github` bleibt im automatischen ZIP-Installer geschützt; die kanonischen Workflowdateien werden weiterhin ausschließlich über den expliziten Administrations-Sync übernommen.

## Nachweis

- 723 automatisch erkannte Regressionstests bestanden.
- RUC-Pages-, RUC-DWD-, Scheduler-, Release-Lineage- und Pages-Codeload-Verträge bestanden.
- YAML-Syntax von kanonischem Workflow und Patchkopie geprüft.
- Releaseversion in Package, Lockfile, Baseline, Web, Worker und iOS-Metadaten auf `0.9.84.4` synchronisiert.

# MID Implementation v0.9.74.5

## Anlass 1 – Release-CI Run #769

GitHub **Install MID release and deploy #769** für Commit `4942fa1b06ba5695633b9d136f46cf011406872c` installierte den Professional-Stand v0.9.74.4 erfolgreich. `npm ci`, Dependency-Audit, TypeScript und Vite waren grün. Von 576 Regressionen scheiterten ausschließlich zwei historische Basemap-Token-Prüfungen:

- `scripts/test-composite-top-reference-motion-track-09550.mjs`: erwartete noch CARTO `light_only_labels`/`dark_only_labels`.
- `scripts/test-synoptic-professional-analysis-0940.mjs`: erwartete noch CARTO `light_nolabels`/`light_only_labels`.

Seit v0.9.74.3 ist CARTO absichtlich vollständig aus den produktiven MID-Karten entfernt. Der gültige Vertrag ist schlüsselfreies OpenStreetMap plus lokale MapLibre-Rastertönung. Deshalb werden **nur die veralteten Regressionserwartungen** auf diesen bereits gültigen Vertrag angehoben. Produktive Kartenlogik, Zeitpfeil und professionelle Synoptik werden nicht zurückgerollt.

## Anlass 2 – ausgelassene RUC-Schedule-Ereignisse

Der RUC-Workflow ist zeitkritisch, GitHub-`schedule` bleibt jedoch ein best-effort Trigger. In der beobachteten Historie folgte auf RUC #11 um 00:47 erst RUC #12 um 03:38, obwohl der bestehende Cron `41 * * * *` stündliche Chancen vorsah. MID darf fachlich nicht davon abhängen, dass jede einzelne GitHub-Schedulerchance tatsächlich erzeugt wird.

## Umsetzung RUC-Catch-up

- Der bestehende `:41`-Slot bleibt erhalten; ein versetzter kostenloser Recovery-Slot `:11` kommt hinzu. Dadurch gibt es zwei Schedulerchancen je Stunde ohne Minuten-0-Lastspitze.
- Äußeres `cancel-in-progress` wird auf `false` gesetzt. Ein verspäteter zweiter Trigger darf keinen fast fertigen RUC-Build mehr abbrechen.
- Neuer stdlib-only Preflight `tools/ruc/check_ruc_schedule_guard.py` läuft **vor** apt/ecCodes/pip und ist dadurch billig.
- Der Guard ermittelt den neuesten gemeinsam von allen erforderlichen ICON-D2-RUC-Parametern und RUC-EPS `TOT_PREC` beworbenen DWD-Lauf und vergleicht ihn mit `ruc/latest.json` des Pages-Free-Profils.
- Nur wenn Schema, `pages-free-v1`, Objektmanifest und **exakter Run** stimmen und der Lauf innerhalb des bestehenden 4-h-Freshness-Vertrags liegt, wird der teure Neubau übersprungen.
- Bei neuerem DWD-Lauf, stale/ungültigem Pages-Lauf oder jeder Netzwerk-/Parsingunsicherheit gilt **fail-open toward processing**: der vollständige Build läuft. Das kann keine neuen RUC-Daten fälschlich überspringen.
- `fetch_and_build_ruc.py` bleibt danach die authoritative Vollständigkeitsprüfung und kann unverändert von einem unvollständigen neuesten DWD-Kandidaten auf einen älteren vollständigen Kandidaten zurückfallen.
- Manueller `workflow_dispatch` erzwingt weiterhin einen vollständigen Verarbeitungslauf.
- Post-Pages-Convergence-Mitigation v0.9.74.4 und 950-MB-Pages-Sicherheitslimit bleiben unverändert.

## Regressionen

- `tools/ruc/test_ruc_schedule_guard.py`: exact current => skip; neuer DWD-Lauf => catch-up; stale same run => rebuild; ungültige Metadaten/Discovery-Unsicherheit => fail-open build.
- `scripts/test-ruc-schedule-catchup-09745.mjs`: zwei versetzte Cron-Slots, `cancel-in-progress: false`, Guard vor apt/pip, Heavy-Step-Gating und Bytegleichheit von aktivem/kanonischem Workflow.
- Die beiden Run-#769-Regressionsprüfungen schützen weiterhin ihre ursprüngliche Karten-/Synoptikfunktion, erwarten aber jetzt OSM + lokale Tone-Varianten statt entferntem CARTO.

## Deployment- und Kostenvertrag

Die RUC-Workflowdatei liegt absichtlich unter `.github/` und wird vom normalen Release-Installer nicht selbstmodifiziert. Deshalb muss die beigefügte explizite Workflow-Synchronisierung einmalig auf `main` **und** `mid-stable` übernommen werden. Die Regressionen erlauben ausschließlich in **v0.9.74.5** den geschützten alten `.github`-RUC-Workflow während dieses kurzen Release-vor-Admin-Sync-Übergangs; der kanonische `ci/github`-Stand muss bereits vollständig den neuen Catch-up-Vertrag enthalten. Ab dem Folgerelease ist diese Übergangsausnahme automatisch beendet. Zuerst wird das Professional-Release grün installiert, anschließend `.github` synchronisiert. Kein manueller Worker-Upload, kein R2 und kein kostenpflichtiger Dienst sind erforderlich.

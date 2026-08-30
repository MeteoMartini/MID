# MID Implementation v0.9.74.4

## Anlass

Der geplante DWD-RUC-Workflow Run #12 erzeugte den vollständigen Lauf `2026-08-30T01:00`, bestand RUC-Pack- und Pages-Free-Vertrag, setzte eine 918.307.428-Byte große MID+RUC-Seite unterhalb des 950-MB-Sicherheitslimits zusammen, lud das Pages-Artefakt erfolgreich hoch und erhielt von GitHub Pages einen erfolgreichen Deployment-Status. Unmittelbar danach scheiterte ausschließlich der Worker-Health-Schritt mit `ready=False` und `reason='RUC-Lauf nicht frisch'`.

Damit lag kein DWD-Decodier-, Daten-, Größen-, Artifact- oder Pages-Deployfehler vor. Der Health-Check lief lediglich schneller als die kurze Konvergenz des neuen `ruc/latest.json` über Pages/Custom-Domain/CDN und sah noch den vorherigen Lauf.

## Umsetzung

- `tools/ruc/check_ruc_health.py` bleibt ein striktes fail-closed Gate, erhält aber ein begrenztes Post-Deployment-Konvergenzfenster.
- Standardmäßig werden höchstens 7 Probes ausgeführt; der Backoff beginnt bei 8 s, wächst mit Faktor 1,5 und ist auf 30 s je Pause begrenzt.
- Jeder Probe trägt `mid_ruc_expected=<neu veröffentlichter Lauf>` und `mid_ruc_probe=<Versuch>` sowie `Cache-Control: no-cache`/`Pragma: no-cache`, sodass eine versehentliche Wiederverwendung derselben Health-Antwort vermieden wird.
- Kein alter Lauf wird als Erfolg akzeptiert: `configured`, `ready`, `fresh`, `schemaValid`, der exakte erwartete `run`, Objektpräsenz und Metadatenzähler müssen weiterhin vollständig stimmen.
- Bleibt der Worker nach dem begrenzten Retry-Budget stale, falsch oder unvollständig, endet der Workflow unverändert hart mit Fehler.
- `tools/ruc/test_ruc_health_check.py` simuliert zwei stale Antworten vor erfolgreicher Konvergenz und zusätzlich einen dauerhaft stale Zustand, der weiterhin fehlschlagen muss.
- Required Regression `scripts/test-ruc-health-convergence-09744.mjs` bindet diesen Python-Vertrag in die automatisch erkannte MID-Regressionssuite ein.

## Nicht geändert

Keine Änderung an DWD RUC/RUC-EPS-Ingestion, Parameterauflösung, Forecast-Fusion, Pages-Free-Projektion, 950-MB-Grenze, Worker-Runtime oder iOS-Nativfähigkeiten. Es wird kein stale RUC fachlich verwendet und kein manueller Worker-Upload benötigt.

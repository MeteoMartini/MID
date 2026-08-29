# MID Implementation v0.9.74.2

## Anlass

Release-Run #766 war insgesamt erfolgreich. Der erste GitHub-Pages-Versuch scheiterte jedoch beim Erhalt des bereits veröffentlichten kostenfreien RUC-Snapshots an einem einzelnen transienten `HTTP 503 Service Unavailable` während eines Chunk-Downloads. Versuch 2 konnte denselben Snapshot anschließend vollständig wiederherstellen und veröffentlichen. Der Fehler lag damit nicht in RUC-Daten, Manifest, SHA-Prüfung oder Pages-Größenbudget, sondern in fehlender innerer Retry-/Backoff-Resilienz des Snapshot-Restores.

## Umsetzung

- `tools/ruc/restore_ruc_pages_snapshot.py` retryt ausschließlich transiente HTTP-/Netzfehler (`429`, `500`, `502`, `503`, `504`, URL-/Timeoutfehler) mit begrenztem exponentiellem Backoff und deterministischem Jitter.
- `Retry-After` wird, falls vorhanden, respektiert und sicher begrenzt.
- Die vom Workflow weiterhin angeforderten 16 parallelen Downloads werden intern auf maximal 8 begrenzt, um Lastspitzen auf Pages/CDN und `midwx.app` zu reduzieren, ohne den Workflow selbst selbstmodifizierend zu ändern.
- HTTP 404 bleibt ausschließlich für den legitimen Erst-/Bootstrap-Fall nicht fatal. Persistente 429/5xx-/Netzfehler bleiben nach Ausschöpfen des Retry-Budgets fail-closed.
- Jeder wiederhergestellte Chunk wird unverändert auf deklarierte Bytezahl und SHA-256 geprüft. Erst nach vollständigem Erfolg ersetzt das temporäre Verzeichnis atomar `dist/ruc`; bei Fehlern wird der temporäre Teilbestand gelöscht.
- Neue Regression simuliert `503 -> Erfolg`, sofortiges 404 ohne Retry und persistentes 503 mit hartem Abbruch.

## Nicht geändert

Keine Änderung an DWD-RUC/RUC-EPS-Fachlogik, Forecast-Fusion, Wolken-L/M/H/Total, RUC-Speicherprofil, 950-MB-Sicherheitsgrenze, Worker-Runtime oder iOS-Fähigkeiten. Keine kostenpflichtige Infrastruktur und kein manueller Worker-Upload erforderlich.

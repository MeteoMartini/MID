# MID-C53 · Security/Quality #490 – transaktionale First-Writer-Diagnostik v0.9.85.361

## Verifizierte Provenienz
`main=mid-stable=c59004ec6a0858f4111d68abc716b5fb5c66b4be` / v0.9.85.360 vor Beginn. Änderungen ausschließlich auf autorisiertem `chatgpt/v0.9.85.361-security-first-diagnostic`; fünf GitHub-Branch-Rulesets und vollständige MID-Source-/Installer-/Worker-/Pages-/Stable-Gates werden nicht geändert.

## Reales Defizit
Die bestehende First-Writer-Funktion erzeugte eine neue 0600-Datei per `open('wx')`, rief dann aber die potenziell fehlschlagende `collect()`-Funktion auf und schrieb erst danach JSON. Bei Rejection, Throw oder zyklischer JSON-Struktur blieb die Datei ohne gültigen Inhalt bestehen. Weitere Retryversuche sahen `EEXIST` und konnten keinen Erstbericht mehr liefern. Die ältere TOCTOU-/Symlink-Härtung war dadurch nicht aufgehoben, die Diagnose aber unzuverlässig.

## Vollständige Lösung
Exklusive 0600-Reservierung mit unmittelbar gültigem JSON-Zwischenstatus und `sync()`. Die Sammlung wird separat ausgeführt. Bei Throw, zyklischen, fehlenden oder nicht-objektförmigen Werten wird ausschließlich ein vordefinierter, datensparsamer Fehlerbericht verwendet (keine Exceptionmessage/Token/URL). Finales JSON wird mit `wx`, 0600 in einem neuen privaten `mkdtemp`-Verzeichnis **im gleichen Parent** bereitgestellt; nach Abschluss und Schließen des ursprünglichen Handles atomarer `rename`. Solange gesammelt wird, sehen weitere Schreiber die reservierte Datei und verlassen die Schreibstrecke ohne Überschreiben. Staging-Artefakte werden im `finally` entfernt.

`scripts/test-security-diagnostics-0985347.mjs` überprüft bestehende 32 parallele Writer inklusive Screenshot-/Report-Paarung, Symlink-Kollisionen, private Timing-Artefakte, Workflowspiegel und exakte MID-Worker-URL. Zusätzlich werden vier ungültige Collector-Ausgänge (Throw mit Geheimnistext, zyklisch, undefined, Array), Report-0600, keine Secrets im Fallback, gültiges In-Flight-JSON, blockierter Nachfolgeschreiber und stagefreie atomare Veröffentlichung geprüft.

## Grenzen und Release
Dieses Paket verändert keine DWD-/WMO-/Ensemble-/RUC-/Warnsemantik, keine Browserassertion und keine Kosten-/CI-Budgets. Eine individuelle CodeQL-Alertinstanz kann nur nach aktuellem Alert-Scanstatus geschlossen werden; diese API ist für den vorhandenen Connector nicht freigegeben. Erst erneuter vollständiger Source-PR-Gate, kontrollierter SHA-Bot-Merge, neues Server-ZIP, unabhängiger Installer Core plus sechs Heavy, Worker/Pages und Stable-Promotion qualifizieren eine Veröffentlichung. Physische iOS-/VoiceOver-Tests bleiben separat.

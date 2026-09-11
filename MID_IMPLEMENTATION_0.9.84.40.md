# MID v0.9.84.40 – Release-Workflow-Fix nach GitHub #993

## Ausgangslage

Der GitHub-Actions-Lauf #993 für v0.9.84.39 hat den vollständigen MID-Installations-, Build- und Regressionsteil erfolgreich abgeschlossen. Der Release wurde erst im anschließenden sicheren Cloudflare-Worker-Deploy gestoppt.

## Ursache

Im Schritt `remote_worker` erzeugt `tools/cloudflare/prepare_worker_deploy.mjs` unter einem zufälligen privaten Temp-Verzeichnis die Wrangler-Konfiguration und `metadata.json` und schreibt deren Pfade in `$GITHUB_OUTPUT`. Derselbe Actions-Schritt versuchte anschließend jedoch über `${{ steps.remote_worker.outputs.meta_path }}` auf sein eigenes Output zuzugreifen. Step-Outputs stehen in GitHub Actions erst nach Abschluss des erzeugenden Schritts zur Verfügung. Der Ausdruck wurde daher zu einem leeren String ausgewertet und die Python-Prüfung brach mit `FileNotFoundError` ab.

## Korrektur

- `remote_worker` führt nur noch die sichere Remote-Spiegelung und Ausgabe der zufälligen Temp-Pfade aus.
- Ein separater Folgeschritt `Gespiegelte Worker-Konfiguration ohne Geheimnisse prüfen` übernimmt `steps.remote_worker.outputs.meta_path` erst nach Abschluss des Erzeugerschritts.
- Der Folgeschritt bricht fail-closed ab, wenn der Pfad leer ist oder die Datei nicht existiert.
- Erst danach werden die nicht geheimen Binding-Namen/-Typen und der RUC-R2-Bindingstatus ausgegeben.
- 0%-Staging, Versionsoverride-Smoke-Test, 100%-Promotion, Produktionsprüfung und automatischer Rollback bleiben unverändert.

## Release-Reihenfolge

Die Professional-ZIP enthält aus Sicherheitsgründen keine aktive `.github`-Konfiguration. Deshalb muss die korrigierte kanonische Fassung vor dem nächsten ZIP-Release einmalig in `.github/workflows/install-mid.yml` synchronisiert werden. Erst danach kann der Professional-Upload den korrigierten Worker-Deploypfad verwenden.

## Fachlicher Umfang

Keine Änderung an Prognoseberechnung oder Wetterdarstellung gegenüber v0.9.84.39. Die fachlichen Korrekturen aus v0.9.84.38/39 bleiben unverändert erhalten.

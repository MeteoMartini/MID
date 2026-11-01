# MID RUC Data 1.3 · gesicherter Integrationskandidat v0.9.85.398

## Provenienz und Freigabezustand
- Exakt von freigegebener .397-Stable SHA `9627f7a6fc1d71a4ca328f7c3f257c0fac7d0362` gestartet. Installer #41296481176 erfolgreich (Core/Heavy/Pages/Worker/Finalize), fünf Rulesets aktiv.
- Die bestehenden 1059 Pflichtregressionen und alle meteorologischen/Releaseverträge bleiben verbindlich.
- Einzeln rückgeprüfte Git-Blobs aus dem gesicherten Draft PR #571 Head `ab327404f6f38aa12629242a4001c39fb2263386` sind portiert, ohne den NoData-Guard aus .397 (#572) zu überschreiben. PR #571 bleibt Originalbeleg.
- `MID-professional-replacement.zip` wurde nicht transportiert. `main` und `mid-stable` wurden nicht direkt verändert.

## P1/P5
Die viertelstündliche Beobachtung erhält auch in Releasefenstern eine ausdrücklich **nicht gemessene** Statusdatei; der Inline-Fallback braucht kein neues Python-Modul im älteren Stable. Echte Verzeichnisstichproben, öffentliches Pages-/Worker-Metadatenreadback, 168h-Zensur und Poll-Lücken werden streng getrennt. Kein exakter DWD-Publikationszeitpunkt, kein gemessener Client-Refresh, kein 60min-P95-SLO.

## P2
Neue DWD-native 0–6h-Originaldatenqualifikation mit 12 Stundenfeldern, 73 5min-Niederschlagsschritten, 25 15min-CAPE/CIN-Terminen, ecCodes/Bitmap/Einheiten/Akkumulation/SHA/Gitter/NoData. Manueller GitHub-Workflow und lokales inaktives Pointerstaging; keine Produktionspublikation, kein Pages-/Worker-/R2-Schreibzugriff und keine App-Fusion. Ein echter DWD-Run ist erst nach vollständiger Promotion des Workflow-Quellstands zulässig. Die bestehende 27h/20-EPS-Pipeline bleibt maßgeblich.

## P3/P4
Das Timing-Audit weist unzugeordnete Laufzeiten aus, ohne sie unbelegt Download/Decode zuzuweisen. P4 blockiert Qualifikationsanläufe bei veralteter Quelle, Release-SHA-Drift, bekanntem parallelen Producer, unverändertem oder manipuliertem DWD-Inventar. Keine behauptete autoritative Cross-Provider-Single-Flight-Sperre; die braucht einen gesonderten, eindeutig einzigen Publisher/Fencing-Nachweis.

## Releaseblocker und geordnete nächsten Schritte
- Der echte MID-Source-PR-Gate/1059-Regressions-/Bot-/serverseitiger ZIP-/Installer-/Worker-/Pages-/Finalize-Pfad darf nie durch ein generisches GitHub-Merge ersetzt werden.
- Alle Versionsspiegel müssen per `npm run sync-version` und kanonische Workflows per `npm run sync:github-workflows` exakt idempotent sein. Bestehende große CHANGELOG-Dateien und `MID_BUILD_CHANGELOG.md` müssen vor Ready/Release vollständig aktualisiert und geprüft werden. Diese Datei ersetzt diese Pflicht nicht.
- Zunächst PR-only Python/Node-QA und festgestellte Regressionsabweichungen klären; vor vollständiger Versions-/CI-Grünlage **Draft halten**.
- Danach erst kontrollierte v.398-Veröffentlichung, anschließend gesonderter manueller DWD-GRIB-Echtdatentest und später einzeln freigegebener Fast-Publisher/Consumer.

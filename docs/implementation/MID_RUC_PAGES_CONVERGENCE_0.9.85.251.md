# MID v0.9.85.251 – Pages-Konvergenz getrennt von RUC-Datenverarbeitung absichern

## Verifizierte Basis
GitHub `main = mid-stable = ee78909da6cf419ce54fd3392c4f0fa094f485a5`, freigegebene Version v0.9.85.250. Der P0-Hotfix v0.9.85.250 behob den zuvor blockierenden Python-Syntaxfehler und führte Frühprüfungen vor dem DWD-Download ein.

## Produktive Betriebsevidenz
- RUC-Vorbereitung und Pages-Worker-Health für **2026-10-14T04:00** erfolgreich: [Run #38517869935](https://github.com/MeteoMartini/MID/actions/runs/38517869935).
- RUC-Vorbereitung und Pages-Worker-Health für **2026-10-14T05:00** erfolgreich: [Run #38520278189](https://github.com/MeteoMartini/MID/actions/runs/38520278189), Pages-Metadata-Konvergenz `probe=3`, Worker `probe=1/7`, 542.040 Punkte und 20 EPS-Mitglieder. Die RUC-Grundversorgung ist damit nach dem Hotfix wieder nachgewiesen.
- **2026-10-14T06:00**: [Run #38524563903](https://github.com/MeteoMartini/MID/actions/runs/38524563903) meldet GitHub `DEPLOYED=success`, aber die öffentliche `latest.json` zeigte auch nach sieben unterschiedlichen no-cache-Probes noch **2026-10-14T05:00**. Der Health-Gate stoppte folgerichtig mit `pages-publication: public RUC metadata did not converge`. **Ein erfolgreicher GitHub-Pages-Upload darf nicht als erfolgreiche öffentliche RUC-Übernahme gelten.** Die genaue Ursache der Verzögerung (Pages-/Custom-Domain-/CDN-Auslieferung) ist nicht endgültig bestimmt.
- [Run #38526601670](https://github.com/MeteoMartini/MID/actions/runs/38526601670) prüft einen neueren Lauf; seine vollständige Publish-/Worker-Abnahme muss gesondert erfolgen.

## Eng begrenzte Änderung
- `tools/ruc/check_ruc_health.py`: Die **öffentliche Pages-Metadatenprüfung** erhält einen eigenen, auf maximal 12 Versuche begrenzten CLI-Parameter `--pages-attempts` (Standard 12). Die bisherigen **sieben Worker-Probes** und ihre strengeren fachlichen Checks sind unverändert. Seiten-Probes verwenden weiter distinct Query-IDs und no-cache. Es wird nie ein altes, falsches oder unvollständiges RUC-Dokument akzeptiert.
- Zwischen den Pages-Probes gelten weiter die bestehenden gekappten Backoffs (8 s, 12 s, 18 s, 27 s, dann höchstens 30 s); damit höchstens rund 275 s schlafende Wartezeit über 12 Versuche, plus maximal 15 s HTTP-Zeit je Versuch. Zusammen mit dem vorhandenen Worker-Gate bleibt das innerhalb des 15-Minuten-Publish-Joblimits.
- Die einzelnen fehlgeschlagenen Pages-Probes werden mit Versuchsnummer, Grund und Wartezeit im CI protokolliert. Nach Ausschöpfung bleibt der Release-Gate **fail-closed**.
- `tools/ruc/test_ruc_health_check.py`: deterministischer Offline-Test mit acht veralteten Pages-Antworten und Erfolg erst beim neunten Versuch; vollständige Ablehnung bei dauerhaft falscher Run-ID nach 1, 7 oder 12 Versuchen sowie bei falschem Speicherprofil. `scripts/test-ruc-health-convergence-09744.mjs` bindet die neuen Schutzparameter in das kanonische Regressioninventar ein.

## Unveränderte Verträge
DWD-/WMO-Semantik, RUC-Felder, RUC-/RUC-EPS-Decoder, Modellaufbereitung, Speicherbudgets, Pages-Snapshot-Format, Worker-/Client-Datenvertragsversionen, CSS-Kaskade, Touch- und Responsivitätsverhalten sowie Stable-Schutz bleiben unverändert. Keine produktive Kompression, keine zusätzliche Modellkarte in diesem Build. Es ist weder eine nachgewiesene dauerhaft beschleunigte Datenbereitstellung noch eine Lösung für einen persistent nicht aktualisierten Pages-Zeiger – nur ein striktes toleranteres Zeitfenster für nachvollziehbar verzögerte Auslieferung.

## Release- und Nachprüfung
Source-PR-Gate einschließlich Offline-Python-/JS-Regressions, Bundle-/Security-Check, Karten-Heavy-Regressionen, iOS-Webhülle → auto merge → serverseitiges ZIP → Installer → Worker/Pages → Stable-Promotion. Bei roten Gates stoppen. Danach **neue** RUC-Veröffentlichung und Worker-Health mit derselben tatsächlichen Run-ID prüfen. Physische iOS-/VoiceOver-Abnahme ohne Geräte-Evidenz nicht behaupten.

Weitere Arbeiten: RUC-Verlustfrei-Codec und Modellangebot [Issue #352](https://github.com/MeteoMartini/MID/issues/352), native RUC-Karten [#350](https://github.com/MeteoMartini/MID/issues/350), kaskadensichere CSS-Auslagerung und reale RUM-/CDP-Messung [#344](https://github.com/MeteoMartini/MID/issues/344).

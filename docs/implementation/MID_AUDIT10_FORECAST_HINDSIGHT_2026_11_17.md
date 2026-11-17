# MID Audit 1.0 · Volltages-Verifikation nur vor Beobachtungsbeginn ausgegebener Prognosen

**17.11.2026 · QA Draft · NO READY / NO MERGE / NO RELEASE.**

## Reproduzierbarer wissenschaftlicher Befund
Der vom Nutzer bereitgestellte PDF-Auditbericht \`20261117_MID-Audit(1).pdf\` (S. 4, „Verifikation fehlt sichtbar“; S. 7, unabhängiger Ortsvergleich) verlangt eindeutige Ausgabelaufzeiten und unabhängige spätere Messreferenzen. In Stable \`main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957\` / v0.9.85.486 wählte \`chosenEvaluations()\` aus \`src/forecastVerification.ts\` nur nach abgeschlossenem Beobachtungstag, Datumsreferenz und angeblichem \`leadHours\`, **ohne die tatsächliche \`issuedAt\` gegen den Beginn des beobachteten Tages abzugleichen**. Dadurch konnten bereits begonnene/abgeschlossene ganze Tage als Volltagesprognose bewertet und für lokale Gewichte herangezogen werden (Hindsight-Risiko). Die bekannte unabhängige Referenzprüfung schützt zwar vor Reanalyse-/Modellzirkeln, aber nicht vor nachträglich aufgenommenen Prognosezeitpunkten.

## Scope und Fachgrenze
Nur vollständige lokale Kalendertages-Zielgrößen (Min/Max, 00–24h Niederschlag, Tages-PoP) werden hier bewertet. Die prognostische Ausgabe muss vor oder exakt zu 00:00 **lokaler Zieltag** erfolgt sein; Ausgabezeiten nach 00:00 desselben Tages sind kein gültiger Vergleich gegen die Volltages-Referenz (ein Zeitraum wäre bereits beobachtet). Same-Day-/Nowcast-Skill braucht separate, exakt passende Zielintervalle; er wird durch diese Änderung weder umdefiniert noch erfunden.

Zusätzlich werden Timestamp mit explizitem ISO-Offset, positive endliche \`leadHours\`, tatsächliche gültige lokale Tagesgrenzen und abgeschlossene Zieltage verlangt. Fehlende/ungültige Provenienz gilt nicht als 0, schlechterer Score oder hypothetischer Treffer. Originalarchiv, beobachtete Messwerte und Zeitpunkt-/WMO-/DWD-Warnverträge bleiben unverändert. Nur Zulässigkeit für Verifikation/Training/Ranking wird verschärft. Kein automatisches Backfilling, kein neuer Fetch, kein UI-Overlay, keine CSS-/Release-/Worker-Änderung.

## Technische Durchführung
- \`src/forecastCaptureEvidence.ts\`: reine O(1)-Prüfung der tatsächlich archivierten Ausgabezeit, eindeutiger Zeitzone und positiven Vorlaufmetadaten.
- \`src/forecastVerification.ts\`: lokale Start-/Endzeiten auf IANA-Basis pro \`targetDate+timezone\` einmal pro Evaluation ermitteln (Map-Memoisierung), vollständige Tage und Capture-Ausgabezeit vor Auswahl von Vergleichsfällen prüfen.
- \`tests/unit/mid-audit-forecast-hindsight-evidence.test.ts\`: vor-/nachlaufende Ausgaben, DST-Kalendertag, ungültige Zeitstempel, negative/null/fremdtypisierte Leads und synthetisches 8-Tage-Archiv mit nur 3 zulässigen Fällen; Originalbytes bleiben identisch.
- Diese Fach-/Integrationsdokumentation.

## Integrationskollisionen und Validierung
Der Leitchat-HEAD \`75e96b471b52e0a7a7e860eb316cc9760b92c245\` hat \`src/forecastVerification.ts\` bereits durch die erfolgreich geprüfte PoP-Validierung aus #886 geändert. Daher **nie den gesamten alten Stable-Blob dieses Drafts übernehmen**: den neuen Import und **nur den \`chosenEvaluations\`-Hunk** in den aktuellen LC-Dateistand integrieren. Der in LC bereits vorhandene gemeinsame PoP-Guard \`isVerifiableTwinRainProbability\` darf nicht verloren gehen. Vor Intake LC/Stable/PR-HEAD sowie aktuelle Blobs nochmals SHA-verifiziert prüfen.

Gezielte Unit-/Legacy-Regressions (Wetterzwilling/Verifikation), vollständige Vitest/V8 Coverage, echte React/Chromium-Paired-Browsermatrix, anschließend Core/Heavy/Source/Review/ZIP/Installer/Worker/Pages/Stable-Gates auf dem **finalen** integrierten SHA erforderlich. Unit-Test ≠ reale DWD-Validierung, Browser ≠ iOS/VoiceOver. Bei Datenhistorie mit vielen Same-Day-Captures kann die nominelle Stichprobenzahl sinken – **dies ist die wissenschaftlich korrekte Entfernung von Hindsight, kein Performancefehler**. Kein empirischer Skillgewinn wird behauptet.

**Fachreferenzen:** ECMWF Forecast User Guide „Statistical Concepts – Probabilistic Data“ https://confluence.ecmwf.int/spaces/FUG/pages/673551875/Section%2B12.B%2BStatistical%2BConcepts%2B-%2BProbabilistic%2BData ; ECMWF Recommendations for Verification of Local Weather Forecasts https://www.ecmwf.int/sites/default/files/elibrary/2003/11401-recommendations-verification-local-weather-forecasts.pdf .

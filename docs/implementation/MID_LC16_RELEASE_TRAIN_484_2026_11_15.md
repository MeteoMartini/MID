# MID LC 1.6 – v0.9.85.484, Release-Train-Kandidatur vom 15.11.2026

Status: **Draft / QA-only / NO MERGE / NO RELEASE** bis verifizierter kombinierter Source-Gate- und Security-/Review-Freigabe.

## Basis
- Stable und main: `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` (v0.9.85.483); fünf aktive Rulesets.
- Übernommene Original-Köpfe: #825 `11a2c028c5a966094b7d15711b7c65bca4ffe58a` (12 Dateien), #824 `f82c01b0a4fb7a23a1ea9c681ebfcf0b62381c3a` (4), #826 `b741bf461c0e439611f3254b3544d43fb3ea5e57` (6), #827 `92fefc860d0caf64fc23fbe377dbc9a6bc334a0d` (11). Alle 33 Source-/QA-Pfade stammen aus exakt diesen Git-Blobs; Pfadmengen disjunkt. Alte #820/#823/#815/#817 nicht nochmals importieren.
- Gemeinsamer Build `v0.9.85.484` (Maintenance: Zeit-/Provenienzkorrekturen, Härtung und Diagnostik), 19 Version-Mirror-Pfade, beide unverändert erhaltene vollständige Historien-Changelogs und neue Release-Notiz; nur ein Release-Train.

## Wissenschaft/Ergonomie
Original-Bewölkungs-/SigWx-Werte werden nicht als künstliche native Viertelstundenfelder ausgegeben. WMO-Codes nicht interpolieren. Fehlende oder verspätete Temperaturantworten bleiben NoData, statt Werte auf falsche Zeit/Ort zu übertragen. Kein neuer amtlicher Warnungsersatz, kein neues Modell-/IR10.8-Produkt und kein teurer Dienst. Range-Slider mit `aria-valuetext` und echtem ISO-UTC. Vor Abnahme Browser 320/390/430/834/1024/1440 CSS-px, Light/Dark, Fokus/Touch, Texte, WebGL, NoData und Scrub/Abort/Timeout; nicht reale iOS-/VoiceOver-Tests.

## Security/Workflows
P1-Ledger #824 ist read-only und darf trotz aufgezeichneter Finding-Zahlen nicht eigenmächtig einen PASS vergeben. #827 deaktiviert `persist-credentials` bei 13 Checkout-Schritten, ohne bisherige Berechtigungen/Trigger/Statuschecks abzusenken. Kanonische und aktive GitHub-Workflowspiegel sowie `workflow-patches/install-mid.yml` bleiben identisch. Die bekannten zwei High-`dangerous-triggers` (#740) und das native Merge-TOCTOU-Thema (#775) sind unabhängige offene Triagegegenstände; vor Source-Ready kein ungeprüfter Reviewbypass.

## Prüffolge – kein automatisches Grün
1. Exakte Integrationstree-/Blob- und Main/Stable-Driftkontrolle, alle 19 Versionsspiegel und Baseline-Tests.
2. Exakte Draft-CI und getrennt die verbindlichen Source-Core-4/4, Heavy-6/6, TypeScript, Scientific/NoData, Browser/Responsive sowie Security-Review-Triage am finalen HEAD.
3. Nur dann kontrollierter SHA-gebundener Source-Bot-Merge, serverseitiges ZIP, `install-mid.yml`, betroffene Worker/Pages, nicht erzwungene Stable-Promotion und unabhängiges SHA-/Versions-Readback.
4. Externe Modelle/AI Router, neue Cloudflare-Namespaces, DWD-IR10.8-Raster bleiben ausdrücklich unberührt.

Weitere Änderungen in den Spezial-PRs sind vor Ready erneut gegen genau diese Quell-SHAs zu vergleichen. Automatisches GitHub-Workflow-Dispatch aus einem Draft ist keine Freigabe.

## Zusatzqualifikation für #740/#775 (noch keine Produktionsfreigabe)

Aus dem unabhängig verifizierten alten QA-PR #775 @ `aae5d6731e34b20c5d439bfa3c7b572e9c89d772` wurden nur der isolierte `mid-native-review-policy.mjs`-Readback-Prüfer und der echte Git-Blob-/ZIP-Inhaltsprüfer `verify-source-release-zip.py` übernommen, **nicht** die ältere .460-Releasebasis oder ihre Regelkonfiguration. Der Readback-Prüfer erzwingt in dieser Fortsetzung genau `['squash']`, keine weiteren Mergeverfahren. Die neue Vitest-Regression prüft 15 negative Ruleset-Varianten und generiert lokal einen echten Git-Commit samt Positiv-/Negativ-ZIPs. Separater technischer Nachweis: `docs/implementation/MID_LC16_NATIVE_REVIEW_PILOT_2026_11_15.md`. Keine GitHub-Ruleset-, Workflow-, Worker-, Package- oder Secrets-Änderungen durch dieses Zusatzpaket. Die native Review-TOCTOU-Abnahme und sichere produktive ZIP-/dist-Transportschaltung bleiben offen; PR #828 muss Draft bleiben, bis die notwendige fachliche Freigabe nachgewiesen ist.

## MID LC 1.6 – #829 Provider-Rate-Limit: sparsame, streng bleibende API-Healthdiagnostik

Die produktive Revision [43749726608](https://github.com/MeteoMartini/MID/actions/runs/43749726608) meldet für Open-Meteo mehrere HTTP 429, obwohl `www.midwx.app` die fünf Websitechecks besteht. Echte Vertragsverletzungen der Wetterschemata sind dadurch **nicht** nachgewiesen. Der Monitor `scripts/check-api-contracts.mjs` bleibt für alle Pflichtverträge fail-closed: Erfolglos validierte HTTP-2xx-Schemata sind Fehler, Anbieterantworten 429 ebenso. Nach einer bestätigten HTTP-429-Antwort einschließlich der bisherigen drei begrenzten Retry-Versuche werden **weitere** Abfragen derselben exakten API-Origin (Hostname und Schema, inklusive Port) innerhalb dieses **einen** Prozesslaufs ausschließlich als **nicht geprüft wegen Quotensperre** protokolliert, statt viele Modellvarianten erneut zu belasten. Pflichttermine bleiben im Fehlerzähler. Andere API-Origins werden unabhängig geprüft; es gibt weder erfundene 0-Werte noch Cache-Schema-PASS noch Quoten-Umgehung. Regressionen: echte CLI mit gefälschtem Fetch, drei statt potenziell 24 redundanten Originabrufen, sieben optionale unbestätigte Modelle, zwei rote Pflichtprüfungen, andere API-Origins unverändert. Kein neues Providerbudget, kein Secrets-/Workflow-Write und keine produktiven Wetterdaten-/Warnänderungen. Die tatsächliche Verfügbarkeit bleibt erst durch neue erfolgreiche Live-Providerantworten belegbar.

## Karten-Performance-/Accessibility-Intake aus PR #830

Parallel-Kandidat [#830](https://github.com/MeteoMartini/MID/pull/830) auf exakt gleicher Stable-Basis `c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Quell-HEAD `98387916d0dd3a2e93ac01d0a424c560fa603dc4`, 2 Draft-Jobs auf dieser SHA erfolgreich. Keine seiner vier Dateien überschneidet sich mit dem vorherigen 59-Pfade-Train. Die drei MapLibre-Produkt-/Test-Git-Blobs sind unverändert übernommen; das zugehörige Dokument ist um einen Integrationsvermerk ergänzt. Neuer Scheduler führt bei mehreren synchronen Layerregistrierungen pro MapLibre-Instanz nur einen vollständigen `moveLayer`-Pass aus; der nächste Eventloop-Turn darf neu sortieren. Die optionalen 650-ms-Flüge verwenden kein `essential:true` mehr, damit `prefers-reduced-motion` wirksam bleibt (MapLibre GL JS 6.x). Der vorhandene zIndex-, Source-/Weather- und NoData-Vertrag bleibt unverändert. **50 Registrierungen → 1 Flush ist eine Unit-/algorithmische Aussage, keine echte WebGL-/iPhone-Performance-Messung.** Vor Release Browser-/GPU- und Accessibility-Matrix inklusive Karte/Umfeld, Layer-Reihenfolge, Legenden, Radar, Modelwechsel, light/dark, 320/390/430/834/1024/1440 und bei reduzierter Bewegung prüfen; physisches iOS/VoiceOver separat. Kein zusätzliches API-/Cloud-Kostenbudget.

## #740 Sicherheits-Härtung privilegierter Workflow-Run-Folgen

SHA-gebundene read-only Vorprüfung und neue Job-Level-Herkunftsfilter für beide workflow_run-Folgen ohne neue Permissions, Secrets, Deploys oder GitHub-Rulesets. Release-Bot akzeptiert am Jobeintritt nur erfolgreiches internes Agent-Sources-PR-Ereignis; Self-Heal nur internes workflow_dispatch auf main, dazu frische Run-ID/Path/Event/SHA/Status-API-Verifizierung vor Retry, sichere mktemp-Dateien. Die aktiven YAMLs bleiben byteidentisch zu ihren kanonischen Spiegeln; neue ausführende jq-Negativtestfälle in tests/unit/mid-privileged-workflow-run-lc16.test.ts. Umfassende Auditgrenzen: docs/implementation/MID_LC16_WORKFLOW_RUN_TRUST_HARDENING_2026_11_15.md. Kein Security-High-, Native-Review-TOCTOU- oder Release-Gate-PASS ohne unabhängigen Nachweis; kein produktiver Release in diesem Schritt.

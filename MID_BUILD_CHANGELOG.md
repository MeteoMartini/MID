## MID v0.9.85.382 – Echtformatprüfung des EPS-Inventars vor großen RUC-Downloads

- Ausgangsbasis v0.9.85.381, `main=mid-stable` @ `f91696cb3468730a4b4473c5ff1cc86b0ab57869`, fünf aktive GitHub-Rulesets und vollständiger Vorgängerinstaller.
- RUC-Lauf 41171508327: DWD 04Z am 31.10.2026 unvollständig (EPS +19h ohne zehn Member), MID fiel auf 03Z zurück. Dies belegt die Lücke, nicht die generelle Ursache jedes Versorgungsproblems.
- `fetch_and_build_ruc.py` staged EPS zuerst und validiert native ecCodes-Header (Modell-Lauf/Parameter/ValidTime/Member 1..20 für 0..27h), bevor deterministische, schnelle und optionale Felder heruntergeladen werden. Vollständiger nachgelagerter EPS-/Det-/Bitmap-/Grid-/NoData-/Codec-Prüfpfad bleibt bestehen.
- `test_fetch_resilience.py` ergänzt Negativtests, die fehlende Member, Duplikate, fremde IDs und die frühzeitige Ablehnung prüfen. Die bisherige frühe Deterministikprüfung bleibt erhalten. Keine künstlichen Werte oder unsicheren Fallbacks.
- Nachweis `docs/implementation/MID_RUC_EPS_EARLY_PREFLIGHT_382.md`. Zeitgewinn, DWD-Verfügbarkeit und produktive Frische sind erst nach echten Runs messbar; bis Source-PR-Gate, Bot, ZIP, Installer, Worker, Pages und Stable-Promotion nur unveröffentlichter Kandidat.
- Andere Phasen von Issue #526 – geschützter produktiver Signaturlauf und echte A/B-Gleichwertigkeit – werden hier nicht frei- oder kurzgeschaltet.

## MID v0.9.85.381 – Phase 1/4: parallelisierungsbewusste CI-Messung

- Vollständig freigegebene Ausgangsbasis v0.9.85.380: `main=mid-stable` @ `e6d70e1104bee5980ac5153fc99f59775756014e`, Installer 41123191600 success, alle Core-/Heavy-, Worker-/Pages-/Stable-Gates und fünf aktive Rulesets bestätigt.
- `tools/ci/release-phase-observation.mjs` ist ein neuer reiner Diagnoseadapter für tatsächliche GitHub-Job-/Stepintervalle. Selektive, konservative Klassen: Queue, Setup, npm, Build, Core, Heavy, SHA-Bot, Paket, Worker, Pages, Stable. Kein fingiertes Zeitintervall für ausgelassene, rückwärts laufende oder unbekannte Zeitstempel. Namenänderungen führen zu „nicht beobachtet“ statt zu unkontrolliertem Raten.
- Überlappende Jobintervalle werden für **Wall-Time vereinigt**, Runnerzeit separat summiert, die reine Spannweite inklusive Lücken als dritte Größe geführt. Retry-Dubletten anhand derselben Identität/Start-/Endzeit nur einmal erfasst; echte frühere Versuche bleiben sichtbar. Core/Heavy enthalten jeweils ihre Setup-/Buildzeit: Phasensummen sind keine End-to-End-Releasezeit.
- `tools/ci/release-timing.mjs` behält sämtliche bisherigen per-Workflow- und per-Run-Messungen und ergänzt eine nicht freigabewirksame phasenweise P50/P95-Auswertung einschließlich gezählter gültiger, fehlender und unbeobachteter Stichproben pro Workflow. JSON-Report enthält die neue `phaseDiagnostics`-Sektion.
- `tools/ci/release-phase-observation.test.mjs` liefert adversarielle Unit-/Semantiktests zu Parallelität, ungültigen/fehlenden Zeitstempeln, Skips, Retry-Dubletten, echtem 0-s-Intervall, unterschiedlichen Jobkategorien, unvollständiger Stichprobe und Autorisierungsfreiheit. Alle Tests werden über die bestehende Pflichtregression `scripts/test-release-timing-0985376.mjs` ausgeführt, die bereits im normalen MID-Regressionensatz registriert ist.
- Keine aktiven Workflow-/CI-/Release-, Token-, Cloudflare- oder Branchenrechte geändert. Versionen/Lock, Baseline, Vertragsregister, Web/PWA, Worker und iOS-Build 382 konsistent. Weiterhin keine A/B-Produktionsgleichwertigkeitsfreigabe für Artefakt-Reuse; Issue #526 bleibt offen. `docs/implementation/MID_CICD_PHASE_OBSERVATION_381.md` enthält die Prüfkriterien.
- Veröffentlichung ausschließlich durch Source-PR-Gate → kontrollierten SHA-Bot → Server-ZIP → `install-mid.yml` → Worker/Pages → Stable, keine Sonder- oder Direktintegration.

## MID v0.9.85.380 – Independent protected Source-Signature verification

- Basis: vollständig freigegebenes `main=mid-stable` v0.9.85.379 @ `c4fd1c79d0b7272b7998c79cd88d445b5681e81d`, Source PR #532, Installer 41118131439 mit allen Core/Heavy, Worker, Pages und Stable erfolgreich.
- `ci/github/workflows/attested-source-qualification.yml` und synchroner `.github`-Mirror erhalten nach dem minimal privilegierten geschützten Signierer einen zweiten **nur lesenden** Verifier-Job. Er besitzt `contents:read`, `actions:read`, `attestations:read`, `pull-requests:read`; ausschließlich der ursprüngliche Signierer erhält `id-token:write`/`attestations:write`.
- Neues `tools/ci/verify-protected-source-pilot.mjs`: SHA-/Run-/Attempt-gebundener GitHub-Artefaktdownload aus demselben geschützten Workflow, einziges kanonisches JSON-Subject, echtes `gh attestation verify` mit Repo/Signer/Commit/Ref und `--deny-self-hosted-runners` ohne akzeptiertes Fremdbundle; Sigstore-Zertifikat, SLSA-Subject, Original-SHA256 und frische Source-PR-/Run-/Job-/Stable-Gegenprobe müssen übereinstimmen. Bei Fehler oder Drift stets fail-closed.
- `tools/ci/verify-protected-source-pilot.test.mjs` adversariell über den weiterhin verpflichtenden Einstieg `scripts/test-build-parity-0985377.mjs` importiert; keine bestehende Prüfung entfernt oder abgeschwächt.
- Vollständige `v0.9.85.380`-Spiegel für Paket/Lock, Baseline/Vertragsregister, HTML/PWA/SW, Webversion, Worker, iOS-Build 381, Nutzer-/Technik-Changelog und Release Notes. Keine meteorologische Produktlogik verändert.
- Signierte Beobachtung ist **kein** attestierter Build und darf niemals `releaseAuthorized` oder `reuseAuthorized` freigeben. Reale manuelle geschützte Producer-/Verifier-Läufe und identische-Source-Tree-A/B-Produktionsäquivalenz noch offen, Issue #526 bleibt offen. Vollständige Beleg- und Negativgrenzen: `docs/implementation/MID_PROTECTED_SIGNATURE_VERIFICATION_380.md`.
- Veröffentlichung ausschließlich über vollständigen MID Source-PR-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable. Bis zu erfolgreich bestandenen Gates Kandidat, keine Releasebehauptung.

## MID v0.9.85.379 – Protected Source-Attestation Pilot (qualifizierte CI-Ausweitung)

- Freigegebene Ausgangsbasis `main=mid-stable` v0.9.85.378 @ `745ee5945fd90a11614400016efb78965da08d71`; Installer 41106636347 success mit kompletter Worker/Pages/Stable-Abnahme.
- Selektive SHA-gesicherte Integration der neun qualifizierten Dateien aus Draft #530 @ `b043b9348171f0b2af2cbbd6b6f5bc4f963a8881`, mit unverändertem Original-Draft und neuem autorisierten `chatgpt/*`-Sourcebranch.
- `tools/ci/attested-reuse-policy.mjs`, `source-run-observation.mjs` und neue `protected-source-attestation.mjs` trennen unverbindliche signierte Claims von unabhängig authentifizierten GitHub-Fakten; Source-PR-Nummer, ursprüngliche Base- und Head-SHA, Run-/Attempt und alle zwölf Pflicht-Gatejobs werden erneut geprüft. Optionales Gate darf nur bei explizitem Ergebnis fehlen.
- Neue rein manuell auf dem geschützten `main` startbare Workflowquelle `attested-source-qualification.yml` einschließlich exakt gespiegelt gepinntem Actions/attest v4.2.2; isolierte Job-Berechtigungen `contents:read`, `id-token:write`, `attestations:write`, keine Release-Credentials, kein PR-Checkout und kein Produktiv-Reuse.
- Eigene Schutztests im obligatorischen vorhandenen Paritätsregressionseinstieg, unabhängiger Doppelbuild, SHA- und Konfigurationsnachweis; vollständiger Source-PR-/Installer-/Worker-/Pages-/Stable-Gate bleibt Pflicht. Kein Signaturbeleg als Ersatz für ein Quell-/Produktivgate.
- Ergebnisgrenze: Das Beobachtungsschema `mid.protected-source-observation.v1` ist **nicht** das vollqualifizierte `mid.attested-source-evidence.v1`. Ohne reale Sigstore-Verifikation und identische Byte-/Environment-/Gate-A/B-Abnahme sind `releaseAuthorized`/`reuseAuthorized` immer `false`. Issue #526 bleibt offen.
- Release-Status: Sourcekandidat bis vollständige verpflichtende CI/Installer/Stable-Kette; vor Erfolg nicht als veröffentlicht ausgeben.

## MID v0.9.85.378 – Diagramm-, Farb- und NoData-Konsolidierung

- Verifizierte Ausgangsbasis `main=mid-stable` v0.9.85.377 @ `44f5d02b0374b275e423e43233addff91d4eeb82`. Exakte Blob-SHAs der acht vorhandenen Fach-/CSS-/Vertragsdateien sind gegenüber dem Ausgangspunkt von Draft PR #524 (.373) unverändert. Keine Übernahme alter Versions-/Release-Spiegel, kein Rebase/Reset von #524.
- Selektive fachliche Integration aus PR #524: `src/App.tsx`, `src/ForecastCockpit.tsx`, `src/EnsemblePanel.tsx`, `src/ensembleCumulativeDisplay.ts`, `src/parameterLineStyle.ts`, `src/styles-src/00-foundation.css`, `src/styles-src/30-modern.css` sowie zentraler Farb-/Linienvertrag.
- 24h und 7d: zentral definierte, farbunabhängig unterscheidbare Linienmuster; bestehende konkurrierende SVG-Präsentationsattribute beseitigt; Legenden-/Tooltipmarker und tatsächliche Diagrammfarben verbunden. Dynamische Temperaturfarbe erhält Vorrang gegenüber generischem Inline-Stroke.
- 14d: keine Null-Fälschung aus Missing/NaN im kumulierten Niederschlag; unabhängige Ensemble-Quartile/Mittel und tatsächlicher Niederschlagswert gesondert; fehlende Wind/Klima/Best-Match-Werte nicht quer über Lücken verbunden.
- Zwei neue obligatorische Regressionen: `scripts/test-appwide-line-semantics-0985374.mjs`, `scripts/test-ensemble-cumulative-gaps-0985374.mjs`; bestehende Farbregression aktualisiert statt abgeschwächt. Gemeinsamer Vertrag `MID_PARAMETER_COLOR_CONTRACT.md` ergänzt.
- Versionspiegel v0.9.85.378: Web, PWA, Worker/Worker-Mirror, iOS Build 379, Lockfile, Baseline, Registry, Benutzer- und technischer Changelog. Kein anderer meteorologischer Daten- oder API-Vertrag, keine amtlichen Warnungen, keine RUC-Kompression/Modelle geändert.
- Parallel-Drafts #530 (Attestierung, read-only) und #524 (Original-Design-Draft) bleiben unangetastet. Source-PR nicht als Release melden, solange nicht SHA-Bot, serverseitiges ZIP, Installer mit Core/Heavy und Worker-/Pages-/Stable-Gates vollständig success sind. Nachweis: `docs/design/MID_PARAMETER_LINE_AUDIT_0.9.85.378.md`.

## MID v0.9.85.377 · 30.10.2026 · Buildparität und Retry-Diagnose

- Zwei getrennt gesicherte Kandidaten #527/#528 auf freigegebener .376-Basis zu einem vollständig neu geprüften Quellbaum integrieren; eine Version, keine doppelte Veröffentlichung.
- Source: optionale Remote-npm-Cache-Abhängigkeit nach belegtem 605–606s-Account-Egress-Stall explizit deaktiviert; Node/Lockfile/npm ci/Build/Audits/alle Gates unverändert.
- Zwei unabhängige, exakt SHA-gebundene npm-Installationen/Builds; vollständige Ausgabeinventare und Fingerprints; keine neuen Deployment- oder Attestierungsrechte, keine automatische Artefaktübernahme.
- Read-only-Timing mit allen Versuchen, ausgeführten Runnersekunden, Abbruch-/Timeoutzählung, Schutz vor gemischten Rerun-Beobachtungen und automatischem Audit nach erfolgreichem Installer.
- Source-Bot queue:max bei unverändertem SHA-Merge-/ZIP-/Installerpfad. Bestehende Installer-Supersession bewusst unverändert; P0 darf keine unnötige Queue abwarten.
- Vollständige Tests/GitHub-Abnahme für den kombinierten Head separat nachweisen. Echtmessreihe, signierte Attestierung und unabhängige A/B-Freigabe in #526 weiterhin offen.

## MID v0.9.85.376 · 30.10.2026 · Vollständiger Installer-Core parallel und sichere Draft-Bündelplanung

- Sourcekandidat von bestätigtem main=mid-stable `.373` @ `05798c4134431a5fb0455ef5f71441b4a7051e38`; unabhängiger Design-Draft #524 bleibt erhalten. .375-Branch beim Abgleich identisch mit Stable. Kein ZIP im Source-PR.
- Vier disjunkte vollständige Installer-Core-Shards auf demselben event-/SHA-/Manifest-/Byte-gebundenen Snapshot; Build/Audit/Worker-Syntax/iOS und sechs Heavy-Gruppen bleiben unverändert Pflicht. Aggregator verlangt alle vier Verifikationsgruppen erfolgreich. Normativer ergänzter Vertrag `MID_CHATGPT_GITHUB_CONTRACT.md`.
- Read-only-Planung ausdrücklich für Draft-Kandidaten, ohne Ready-/Merge-Aktion: autorisierte Branchfamilie, exakte Basis/Head, vollständige Dateiliste einschließlich Rename-Quelle, erneute Metadaten-/Ref-Prüfung. Provenienzpilot bindet jeden Job an ID, Head und Run-Attempt und prüft nach dem Lesen erneut. Keine produktive Testergebnis- oder Buildartefaktwiederverwendung.
- Fokussierte CI-/Diagnose-/Provenienztests lokal 33/33; reproduzierbare npm-Installation, Types/Produktionsbuild und Installer-/Security-/RUC-/Workflow-Sentinels erfolgreich. Vollständige lokale Core-/GitHub-Source-/Installer-/Pages-/Worker-/Stable-Abnahme separat nachweisen. Keine Laufzeitgarantie aus dem bisherigen Core-Pilot abgeleitet; Issue #526 bleibt bis attestierter A/B-Qualifikation offen.

## MID v0.9.85.373 · 30.10.2026 · Source-SHA-gebundene RUC-Wiederverwendung

- **Aktuelle freigegebene Basis**: main=mid-stable=v0.9.85.372 @ `e8e8c60ecc36447dbd21cde239fac06d58314a7d`; #521 vollständig gemergt; Installer [41037391196](https://github.com/MeteoMartini/MID/actions/runs/41037391196) einschließlich Core, Heavy, Worker, Pages und Stable erfolgreich. Fünf Rulesets aktiv; offene Parallel-Drafts #425/#449/#480/#513 und Dependabot #474 nicht überschrieben.
- **Tatsächlich aufgedeckter RUC-Produktionsfehler**: Preprocessing #41040092625 erhielt `reuse_run_id=41036330432` (alter Event-SHA .371 `76fef22a9f10af06faa0566a01a93df150f2cdf9`). `prepared_snapshot.admit` lehnte korrekt ab: `prepared data contract incompatible with current Stable`. .372 veränderte WMS-Layercode in `worker-src/20-composite-models.js`, einer expliziten Eingabedatei des unveränderten RUC-Kompatibilitätshashs. Kein unqualifizierter Snapshot veröffentlicht.
- **Quellenfix**: `tools/release/ruc_resume_preflight.py` prüft bei durch Workflow und Artifact-Proof authentifiziertem Wiederverwendungskandidaten SHA-Identität, Git-Ancestry, vollständige relevante Quelldifferenz und die beiden ausdrücklich erlaubten Versionsnormalisierungen (Worker-Version im `00-core-observations.js`, Root-Versionsfelder im npm-Lockfile). Die Pfadmatrix entspricht dem unveränderten `tools/ruc/prepared_snapshot.py:compatibility`; jede sonstige Worker-/RUC-/ForecastFusion-/Pipeline-/Dependency-Änderung blockiert die Wiederverwendung konservativ. Git-/Netz-/Provenienzunsicherheit bedeutet **keine** Wiederverwendung und reguläre Neuaufbereitung, nicht Datenfreigabe.
- `tools/release/select_ruc_resume.py` ruft die Prüfung **vor einem Replay-Dispatch** auf; ein bestätigter inkompatibler neuer Kandidat sperrt ältere Produzenten und löst durch leeren `reuse_run_id` den bestehenden regulären Rebuild aus. Bestehende Limitierungen (10 Kandidaten,90min,18min Cooldown, SHA, Provenienz, Immutable Artifact, tatsächlicher Freshness-/900-MB-/Codec-/Pages-/Worker-/Stable-Zulasser) unverändert.
- Negative und positive isolierte Git-Historienprüfungen in `test_select_ruc_resume.py`; Source-/Workflow-Regression `test-ruc-resume-watchdog-0985370.mjs` ergänzt. Kein Test abgeschwächt, beide Baselineinventare mit 1050 Core-Fällen unverändert. Repräsentativer lokaler SHA-/Git-Normalisierungs-Negativtest bestanden; vollständige GitHub Source-/Installer-Gates weiterhin erforderlich.
- Version `v0.9.85.373`, Worker-/PWA-/iOS-Build 374, Registry, Baseline sowie externer/interner Changelog synchron; kein automatischer Ausweis einer echten RUC-Publikation ohne separaten datenbezogenen Betriebsnachweis. Keine fachliche Gewichtung, Warnung, Modelldatenberechnung, Decoder-, Radar- oder Publikationsregel geändert.

## MID v0.9.85.372 · 30.10.2026 · echte WMS-Kartenverfügbarkeit und sichere Kombinationen

- Verifizierte Stable-Basis .371 `76fef22a9f10af06faa0566a01a93df150f2cdf9`; offene PRs #513/#474/#480/#449/#425 berücksichtigt.
- Worker-Katalog-Endpunkt `weather-map-catalog`: exakt ein DWD- und ein ECCC-GetCapabilities-Read je Antwort; feste WEATHER_MAP_LAYER_CONFIG-Allowlist; Status `listed`/`absent`, numerische Zeit-, Lauf- und Ebenenanzahlen, geprüfte Anbieterprovenienz; Provider-/Netzfehler bleiben `unchecked`, dabei wird ein unvollständiger Status vollständig verworfen.
- Beide Kartenmodelle `WeatherMapsPanel` und `UnifiedWeatherMap` nutzen dieselbe veröffentlichte Capabilities-Matrix. Eine confirmed-absent- oder ohne bestätigten Zeit-/Run-/Höhenwert unbrauchbare WMS-Kombination wird bei neuen Wahlen herausgenommen, ohne bestehende gespeicherte Auswahl/andere native Raster zu vernichten. Synoptik- und Wolkenkombinationen nur bei geladenen Originalkatalogen anbieten.
- `weatherMapFrameReady` verhindert WMS-GetMap ohne Layer+Zeit+Lauf+Ebenenbindung. Zeitabhängiger NowCastELEC benötigt den echten valid-time-Schritt, aber keine fiktive deterministische INIT. Statische Gewitter-/Warnpolygone bleiben ohne Wetterereignis legitim leer. Worker-Routen, Aggregat und Alias bytegleich; GeoMet-Attribution korrigiert.
- Neuer reproduzierbarer Production-Worker-Contract `test-map-combination-availability-0985372.mjs` mit isolierten Original-GetCapabilities-Mocks: positive/negative Layer, unbekannte Anbieterfehler, valid/invalid Time/Run/Elevation, 2 UI-Matrizen, Native-/Preferences-Schutz. Beide vollständigen Inventare jetzt 1050 Tests. `scripts/audit-weather-map-live.mjs` für späteren expliziten externen GetMap-PNG-Read-only-Nachweis mit hartem Budget; ein PNG allein belegt nicht nichttransparente Daten.
- `v0.9.85.372` Versionsspiegel, iOS-Buildcounter 373, Worker, PWA, Registry, Nutzer-/interner Changelog und Baseline synchron. Ohne erfolgreiche tatsächliche CI-, Worker-/Pages-, Installer- und Stable-Gates nicht als veröffentlicht zu melden. Keine heimlichen Modell-/Warn-/Raster-/Zeitachsenänderungen.

## MID v0.9.85.371 · 30.10.2026 · Open-Meteo BOM ACCESS-G deterministisch außer Betrieb

- Offizielle Provenienz: seit 26.06.2025 18 UTC keine aktuellen BOM ACCESS-G-Läufe. Trotz weiter gelisteter API-ID keine aktuelle deterministische Quelle.
- Den aktiven Kandidaten aus kanonischem Forecast-Katalog und generiertem weather.ts entfernt; Worker-Fusionsmodell und globalIds in kanonischer Quelle, worker.js und metar-proxy.js entfernt.
- Bestehende globale Ersatzmodelle, Best-Match-Anker, 20er-Modellbudget, Unabhängigkeitsgruppen, RUC-/Warn- und Missing-Data-Semantik unverändert.
- BOM Ensemble und BOM ACCESS-S2 saisonal explizit bewahrt; keine historischen Prognosen verändert.
- Zwei veraltete Modellfamilien-Assertions angepasst; neue tatsächliche Worker-Auswahl-Regression test-openmeteo-bom-retirement-0985371.mjs für DE/AU/US, Katalog-/Mirror-Parität und Saison/Ensemble; 1049 Tests in beiden Inventaren.
- Versions-/PWA-/iOS-/Worker-/Lockfile-/Baseline-/Registry-/Nutzer-Changelog synchron auf 0.9.85.371, iOS Build 372. Source-Gates und Release nicht als erfolgreich bezeichnen, bis GitHub die Schritte belegt.

## MID v0.9.85.366 · 29.10.2026 · Karteneinstellungen und Ensemble-Cachevertrag

- Legacy-Composite-Layer-Mirror kann den kanonischen v3-Record nicht mehr überstimmen. Fehlender 2. Write, falsche/fehlende Werte und vollständiger Snapshot müssen die bewusste Auswahl `false` erhalten.
- Radar und UnifiedMap verwenden den letzten dauerhaften Zustand beim Patchen und aktualisieren mehrere Instanzen/Tabs. DWD-Warngebietsdarstellung verwirft nicht die Benutzerpräferenz.
- Sieben konkrete Ensemble-UI-Schlüssel vom vergänglichen Forecast-Cache getrennt, direkte Durable-Speicherung, Backup-/Quota-Events.
- Neuer tatsächlicher Produktionshelper-Test `test-composite-settings-durability-0985366.mjs` in beiden vollständigen Regressioninventaren; Browser-/Build-/Native-/Release-Prüfungen bleiben Pflicht.
- Fachlich offene 250m-Auswahl bei Nichtverfügbarkeit, vollständige Geräteabnahme sowie Schnee-/RUC-Qualifikation nicht als geschlossen deklarieren.
- Buildversion `v0.9.85.366`, iOS Buildcounter 367, synchronisierte Worker-/PWA-/Registry-/Baseline-Spiegel. Nur SHA-Bot mit Installer/Pages/Stable darf veröffentlichen.

## MID v0.9.85.361 · 29.10.2026 · transaktionale Security-Diagnostik

- Exklusiv reservierte Erstfehler-Berichte mit sofort gültigem JSON-Zwischenstatus und atomarem Endbericht.
- Sicherer Fehler-Fallback bei Collector-Rejection, zyklischem/undefiniertem oder nicht-objektförmigem Payload ohne Übernahme vertraulicher Fehlermeldungen.
- Parallele 32-Writer-, In-Flight-, Symlink-, Datei-0600-/Screenshot-/Timing-Regressionsprüfungen; keine Pflichtprüfung deaktiviert.
- Der WebKit-320px-Kaltstart-CSS-Paritätsblocker wird mit echten stabilen Frame-Snapshots und präziser DOM-Diagnose statt gelockerter Parität überprüft; die gesamte Browser-/Pixelmatrix bleibt Pflicht.
- Versionsspiegel für App, Worker, Service Worker, iOS und Registry synchronisiert. Freigabe ausschließlich über den MID-Releasebot.

## MID v0.9.85.355 · 2026-10-28 · Bergwetter-Installer-Recovery

- SHA-verifizierter Stable-.353-Nachfolger mit übernommenem .354-Source-Tree, ohne rotes Release-ZIP.
- Echte CDP-Hit-Geometrie nach Layoutframes, Browserfehlersicherung, Persistenz und erneute Einheitenauswahl.
- ZIP-Git-Merge-Provenienzprüfung mit fünf Git-Laufzeitproben; rootfreie Release-Notizen.
- Push-Settings-Chromium hat bei echtem Startausfall maximal einen weiteren frischen Port-0-/Profilversuch (2 × 12 s) mit klarer Diagnose; vollständige 12-Fälle-UI-Prüfung bleibt zwingend.
- Alte meteorologische, Accessibility-, Responsive-, Browser- und Sicherheitsprüfungen bleiben Pflicht.
- Ausschließlich kompletter geschützter MID-Releaseweg.

## MID v0.9.85.335 · 2026-10-25 · Fusion resume

Begrenzte Auswahlmarkierung im Tagesdiagramm beseitigt den im bestehenden Heavy-Browsergate reproduzierten epoch-Absturz. Nachholen versäumter Fusionsabrufe, begrenzter Fehlerbackoff, Lifecycle-Cleanup und explizite fehlende Übernahmeverifikation. Wetterwerte und Workerkern unverändert.

## MID v0.9.85.316 · 2026-10-23 · Parameterlinien, Rasterextreme und runde Windskalen

- Verifizierte Basis main = mid-stable = 48692e0cd168302f1dd035f5d79200a4812a00a6 / 0.9.85.314. PR449 reserviert .315 für unabhängige DWD-Geometrieinventur; keine Duplikation oder Aktivierung dieses WIP.
- Stückweise lineare Konturen auf jedem gültigen Rasterquad, deterministische Dreiecksteilung, keine räumliche Ausdünnung oder Glättung; fehlende Ecke sperrt den Quad. Wettercodes sind keine skalare Größe. Originalwerte bleiben unverändert.
- Gemeinsame nativeScalarAnnotations für UnifiedWeatherMap, NativeModelMap und native PNG/SVG; bestehende adaptive MSLP-Isobaren und T/H-Konvention bleiben erhalten. Min/Max beziehen sich ausdrücklich auf das veröffentlichte Raster, nicht auf volle native DWD-Gebietsabdeckung.
- niceWindRange wählt 1/2/5-Teilstriche nach Anzeigeumrechnung; Koordinaten und Spitzen bleiben kanonisch in Knoten. Pflichtregression test-map-scalar-annotations-0985316.mjs.

## MID v0.9.85.314 · 2026-10-23 · Konsolidierte Konturen und strenger Domänenauditor

- Nutzerfreigabe: geprüfte Konturen-/Exportkorrekturen #445 und ausschließlich lesender Auditor #447 gemeinsam veröffentlichen; Vollgebiet #446 bleibt ausdrücklich separat offen.
- Basis main=mid-stable 7cabe4ca23d86dbf3aadccdb03aa3fc0dbf20885 (.311); keine alten Versionen, Draft-Workflows oder ungeprüften Dependency-Upgrades übernommen.
- Vollständiges vorhandenes Druckraster statt Sechser-Ausdünnung, gemeinsame verlustfreie Linienzüge in Karten und nativen/Wolken-Wetter-SVG-/PNG-Exporten.
- Auditor prüft volle Quellzeitachse, SHA, Einheiten, Intervalle und Missing-Masken; 17 Fälle im bestehenden Pflicht-Test registriert. Keine produktive Crop- oder Datenquellenänderung.
- Release ausschließlich nach erneuten kombinierten Source-/RUC-/Heavy-/Browser-/Installer-/Worker-/Pages-Gates und Stable-Promotion. #433/#432/#425 sowie nicht qualifizierte Dependency-PRs bleiben separat; keine ECMWF- oder Open-Meteo-RUC-Aktivierung.

## MID v0.9.85.311 · 2026-10-22 · Gepaarte Prognoseverifikation

- Basis main=mid-stable 8e829d2e1d474f4beb10937194773d65e12c69fe (.309). Parallel-PR #443 reserviert .310 und bleibt unberührt.
- Reproduzierter Fehler: asymmetrisch fehlende optionale Parameter erzeugen bei identischen gemeinsamen Fehlern einen scheinbaren MID-Vorteil. Report verglich außerdem Gesamtarchive mit unterschiedlicher Falldeckung.
- Gemeinsame Parametermaske pro archiviertem Stand, Tagesmittel vor Gesamtmittel, identische Fallmenge für Anzeige, adaptive Obergrenze und Aktivierungsentscheidung. Keine neue Kalibrierung und keine rückwirkende Änderung gespeicherter Prognosen.
- Neuer dynamischer Pflicht-Test test-paired-verification-0985311.mjs; Altcode rot, Korrektur grün. Release erst nach vollständigen Source-/Installer-/Pages-/Stable-Gates.

## MID v0.9.85.309 · 2026-10-21 · Extremwetter-Polygon-Ersatzmodus (Source-Kandidat)

- Reproduzierter P1-GeoJSON-Geometriefehler: fünf verschachtelte Originalringe ergaben vier statt drei MultiPolygon-Teile (Insel doppelt), sechs Ringe vier statt drei. Der neue ausschließlich direkte Hole→Island-Rekursionspfad erhält jeden Ring exakt einmal und normalisiert Außen- und Lochorientierung. Bestehende Pflichtregression test-extreme-outlook-geodata-096614 wurde um Ringtiefen 1–6, Multipolygonanzahl, Duplikatfreiheit, Ringanzahl und Winding erweitert. Kein Schluss auf WebGL-Pixel, Live-Ursache oder amtliche Warnungen.

- Basis: erfolgreich nach Pages/Worker promovierter Stable-SHA b57f07081a2b92ae763af9c909aa3f65b9e211ac, v0.9.85.307; paralleler blockierter RUC-PR #440 v0.9.85.308 und Draft #433 unberührt.
- Die maplibre-gl@6.7.0-GeoJSON-Flächen werden wie bisher zuerst verwendet. Ein zeitversetzter Source-/Layer-/Render-Check mit map.isSourceLoaded, queryRenderedFeatures und erfassten Workerfehlern aktiviert bei tatsächlichem Fehlen einen Canvas-Ersatz aus derselben Konturserie.
- Canvas zeichnet dieselben I1–I4-Konturen inklusive Schraffur, Inseln und Löchern; kann aber im Ersatzmodus über gezeichneten OSM-Ortsnamen liegen. Zustand wird optisch und per role=status deklariert. Nicht als amtliche Warnung ausgeben.
- Unterdrückte synchronen Fehler bei der nativen Installation dürfen nicht länger zu alleinstehenden Gefahrenlabels führen. Wiederherstellung über map.idle erneut prüfen, Eventlistener beim Wechsel freigeben.
- Neue Pflichtregression scripts/test-extreme-outlook-render-fallback-0985309.mjs, bestehende Label-/Canvas-/GeoJSON-Tests fachlich angepasst; Version, Worker, Service Worker, iOS und Verträge synchronisiert.
- **Freigabesperre:** Hier ist noch kein realer Browser-Pixel-/Viewport-/WKWebView-Nachweis vorhanden. Ein neuer Source-PR bleibt bis zum tatsächlichen Source-Gate, reproduzierbarer Polygon-Pixelprüfung, betroffener Heavy-Regression und dem regulären Installer/Pages/Worker/Stable-Pfad Draft. Kein öffentlicher Release durch diesen Commit allein.

## MID v0.9.85.307 · 2026-10-21 · P1-Datenintegrität

- Stable-Basis .306 a1f40fb42ea45bd3c695583a49a1310e0fc853fc verifiziert; parallele ECMWF-/RUC-Drafts unangetastet; vorhandene Workflownamen und Freigabepfade unverändert.
- Szenario-Ausreißerfilter und 6%-Sichtbarkeitsschwelle entfernt; RADOLAN nicht mehr bei 250 mm hart begrenzt, ungültige Daten uncovered.
- Lokale Güte- und Lernverifikation: nur measured/private-sensor, >=18h Deckung und Qualität >=0,55 aus ausschließlich Messquellen, jeweils >=12 Temperatur-/Niederschlagsproben; kein beobachtetes Regime rückwirkend als Ausgabe-Regime.
- Drei dynamische Pflichtregressionen zum gesamten Bestand hinzugefügt (1013); Source-, Installer-, Worker-, Pages-Gates noch nachzuweisen. Historische Archive bleiben erhalten; keine empirische 90-Tage- oder iOS-Gerätefreigabe behauptet.

## MID v0.9.85.296 · 2026-10-19 · Langfrist-Ausblick und Wiederherstellung

- PR419: Cache-/Workerpfad unabhängig von optionalem Direktmodul, Schema-Recovery und nutzergetriggerter Reload nach Modulfehler; keine meteorologische Änderung.
- Vier Source-Blocker ohne Gate-/Budgetausnahme repariert; dynamische Loaderprüfung und 24 tatsächliche Browserfälle, Types/Build und 1001/1001 lokal grün. Nachweis docs/implementation/MID_C36_EXTREME_RECOVERY_0.9.85.296.md.

## MID v0.9.85.295 · 2026-10-18 · Prägnante 7-Tage-Wettertexte

- Der 7-Tage-Trend priorisiert signifikanten Niederschlag, Schnee, Gewitter, markante Temperaturen und DWD-nahe Modellhinweise. Allgemeine Trocken- und Wolkenfloskeln wurden zurückgedrängt.
- Wetterphasen, markante Hinweise und Folgenächte werden über eine einheitliche chronologische Auswahl auf höchstens drei kurze Aussagen begrenzt. Doppeltes Gewitterworting bei gleichem Tag wird unterdrückt.
- Keine Veränderung an meteorologischen Prognosewerten, Warnquellen, Akkumulationszeiträumen oder Datenlücken; fehlende Daten bleiben unbekannt.
- Neue dynamische Pflichtregression test-seven-day-significant-timeline-0985295.mjs; Source- und Release-Gates noch ausstehend.
- Baseline v0.9.85.294 auf b0cf607c45746239ed6246ba1e473ee41877a96d.

## MID v0.9.85.294 · 2026-10-18 · Aktuell-Skybar mit exakten Sonnenübergängen

- MID-C36: optionale solare Aufteilung im zeitgebundenen Skybar-Adapter; segmentinterne Epochengrenzen vor dem Viewport-Clipping erhalten.
- Dynamische Regression für 12h-Geometrie, angeschnittene Sonnenübergänge, Missing, Wolkenschwellen, 15/60-min-Slots, DST und unveränderten Niederschlag erweitert.
- Basis main=mid-stable=5ad8be1fbafbcbfbc9d1aeda451b3e642a947617 (.293). #374 bleibt wegen klassischer Detailachse und weiterer Gesamtabnahme offen.

# MID v0.9.85.292 · Barcelona-Warnungsgebiete und CAP-Revision (Source-PR-Kandidat)

- Verifizierte Stable/main-Basis fbe9c758599928f4b5ba776de670505018750dbb, v0.9.85.291. Ursprung: gesicherter .290 Draft #412 @ 3ba91d51ae883df4b38c59b2fad09634994a01fe, unverändert erhalten. .291-API-NoData-Code und Regression beibehalten.
- #411: Eindeutige Warngebietsnamen/AEMET-Gemeinde Barcelona 08019 → Litoral 690804, CAP-Polygon/-Kreis zuerst, Schweregrad im semantischen Dubletten-Schlüssel, bei belegter CAP-ID/Referenz neue Ausgabezeit vor Beschreibungslänge. Eng begrenzter AEMET-Ortshinweis ohne behauptetes offizielles Gemeindegrenzenpolygon.
- Worker-End-to-End-Test scripts/test-barcelona-warning-area-dedupe-0985290.mjs mit **synthetischen** 26 Fällen, VIS-Fallback, CAP-Polygonen/Nachbargebieten/verschiedenen Zeitfenstern und Schweregraden sowie kürzerem amtlichem Update zu längerer Vorversion. Neuer Pflichttest neben unverändertem .291-API-NoData-Test.
- Grenzen: aktuelle echte 26-Warnungen-Liste nicht als Live-API-Objekte verfügbar; MeteoAlarm VIS-BBox ist keine exakte Geometrie, Cancel-/mehrsprachige CAP-Identität noch nicht abschließend abgenommen. Issue #411 bleibt offen. Keine physische iOS-/VoiceOver-Abnahme behauptet.
- Version- und Buildspiegel 0.9.85.292 synchronisiert; Source-, Build-, Security-, Worker-/Pages- und Stable-Gates noch ausstehend. Nur SHA-gebundener MID Source-PR → Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable, kein Direktmerge.

## MID v0.9.85.291 · 2026-10-18 · API-NoData-Verträge

- Reproduzierten Number(null/blank/boolean)-Fehler im API-Prüfer behoben; Min/Max-Unterschied erfordert gültiges Wertepaar.
- Echte CLI-Pflicht-/Optional-Providerfixtures und Serienregression in beiden Baseline-Inventaren. Open-Meteo #405 getrennt dokumentiert; keine unbestätigte Modellfreigabe oder historische Korrektur.

# MID v0.9.85.289 · C39 Kurzfristtext und mobile Kartenfläche (Source-PR-Kandidat)

- Verifizierte Basis: main=mid-stable=e54c237b2d21859638cf3b21b50a842d2f0f222d, v0.9.85.288; vollständiger Installer #39111144520 mit Worker/Pages und Stable-Promotion erfolgreich. Keine parallel offenen Produkt-PRs bei Start; bestehende Dependabot-PRs nicht verändert.
- #408: `ForecastCockpit.shortTermPointSummary` verwendet nun ausschließlich die `profileDisplayPoints`, die auch die 24-h-Kurve (`chartSourcePoints`) zeichnen. Der abweichende versteckte native 15-min-Anfang entfällt. Gemeinsamer Helper `src/shortTermSignificantBrief.ts` bewahrt absolute Epoch-Intervalle, unterscheidet laufenden/voraussichtlichen Niederschlag, bildet ein mögliches Ende nur mit zwei lückenlos gültigen Trockenintervallen und meldet Windböen nur >50 km/h als MID-Hinweis (nicht amtliche DWD-Warnung). Missing/NaN sind niemals 0 oder Trockenbeweis.
- #409: Auf schmalen Next-Karten werden Status- und Modell-Kachel einzeilig auf maximal 44 px begrenzt, abgeschnittene Namen mit CSS-Ellipse behandelt; geschlossene Legende ist ein kompakter 44-px-Schalter. Größere Layer-Beschreibung wird beim geschlossenen Untermenü ausgeblendet. Copyright-Attribution, volle Zeitsteuerung, vollständige Statusdetails und Karten-Interaktionen bleiben erhalten. Kein großflächiger Neubau des MapLibre-/Leaflet-Systems.
- Verbindliche neue Regression `scripts/test-short-term-brief-chart-0985289.mjs` in beiden Baseline-Regressionslisten: Build des echten TS-Helpers, unbekannte/gültige Niederschlagsintervalle, onset/off, 14/26/28/34 kt, 23-/25h-DST, fehlender Datenstatus, Quelltext- und CSS-Integrität. Echte komplette Source-/Browser-/Heavy-/Security-/iOS-/Worker-/Pages-Gates stehen zum Zeitpunkt dieses Kandidaten ausdrücklich aus.
- Versionsspiegel v0.9.85.289 in Package/Lock, Worker, Web/PWA, iOS, Baseline und Registry synchronisiert. Keine unabhängigen Open-Meteo-Modellfreigaben oder Replit-Handoffs. Replit bleibt wegen ungeklärter Admin-/Bypass-Rechte blockiert.
- Release ausschließlich Source-PR-Gate → SHA-gebundener Release Bot → ZIP aus Repository-Serverstand → install-mid.yml → erforderliche Worker/Pages-Gates → Stable. Browser-Screenshots sind keine physische WKWebView-/VoiceOver-Abnahme.

# MID v0.9.85.288 · Sichtweiten-NoData-Integrität (Source-PR-Kandidat)

- Verifizierte freigegebene Basis: main=mid-stable=ffcc37e37c6a143ff73a714494c3e9c52eea987c (v0.9.85.287), Installer #39108469858 und alle vorgeschriebenen Worker-/Pages-Gates erfolgreich; keine parallelen offenen MID-Produkt-PRs beim Entwicklungsstart.
- #405: `src/visibilityPhenomena.ts` konvertierte beim `finite(value)`-Helper `null`, Blanktext und weitere nicht-numerische Werte mittels `Number(value)` zu 0. Dadurch konnten bei unmittelbaren Caller-Eingaben eine 0-m-Sicht bzw. 0-%-Luftfeuchte erfunden und Nebel/Dunst abgeleitet werden. Zentrale `mapHours`-Maskierung war teilweise geschützt; kein unbewiesener App-Live-Screenshotfehler behauptet.
- Neue strikte finite-Grenze: ausschließlich endliche Nummern und nichtleere numerische Strings akzeptieren; echte Null, finite Sicht-gegen-Modell-Konflikte, WMO/DWD-Nebel-/Dunstschwellen und vertrauenswürdiges METAR unverändert erhalten.
- Pflichtregression `scripts/test-visibility-nodata-0985288.mjs` importiert den echten TypeScript-Classifier via esbuild und deckt NoData, echte Null, Modell-Wettercodes, Luftfeuchte/Taupunkt, Berichtskonflikte und Worker/JSON-null-Caching ab; beide Baseline-Inventare ergänzt.
- Quellstand, alle Versionsspiegel, externe/interne Changelogs und Implementierung dokumentiert: `docs/implementation/MID_C39_VISIBILITY_NODATA_0.9.85.288.md`. RUC-Kompression, neue native ICON-Modelle und amtliche Warnungen werden nicht geändert.
- Keine lokale/gerätebezogene Prüfung nach diesem Integrationscommit behaupten; verpflichtende vollständige Source-/Heavy-/Browser-/Worker-/Pages-/Native-Hüllen- und Installer-Gates stehen aus. Ein Changelog allein ist kein Release-Nachweis. Nur MID Source-PR-Bot → serverseitiges ZIP → install-mid.yml → Worker/Pages → Stable.

# MID v0.9.85.287 · Missing-Daily-Migration (Source-PR-Kandidat)

- Start nach erfolgreicher Promotion: main=mid-stable=394ff6f999accb5c4211490d44f52275faefa61c, v0.9.85.286 (18.10.2026). Übernahme des gesicherten Codex-Arbeitsstands ef34de34dd153d42ae6c9dfe267a99a5be440b36 in einen unabhängigen `chatgpt/*`-Branch; ursprünglicher Branch bleibt unverändert.
- Issue #397: explizite Verfügbarkeit von Tagesniederschlagsmenge und -wahrscheinlichkeit; Missing/null/NaN/Fehleinheiten dürfen nicht als trocken/0 interpretiert werden. Worker darf einen fehlenden mm-Wasseräquivalentwert insbesondere nicht aus Regen-mm plus Schnee-cm addieren. Tatsächliche Null bleibt gültig.
- Zeit-/Akkumulationsvertrag: 23/24/25-h-Lokaltage nur bei vollständiger Stundenabdeckung rekonstruieren; unabhängige Komponenten, Codes und Wahrscheinlichkeiten erhalten. Datenstatus wird bis Forecast-/Widget-/Cache-Konsumenten und additiver Swift-v1-Wire-Maske weitergegeben, mit rückwärtskompatiblen numerischen Pflichtfeldern.
- Regressionsinventare ergänzt: `scripts/test-missing-daily-source-0985287.mjs`. Der übernommene WIP dokumentiert 987/987 lokal bestandene Core-Tests und Type-/Probe-Build **vor** Migration auf .286; das ist ausdrücklich kein Testnachweis für diesen neuen Branch.
- Versionsspiegel: package/lock, Worker, Web/PWA, Native-Build und Contract-Registry auf .287 harmonisiert. Vollständige Source-PR-, Browser-/Heavy-, Security-, Worker-/Pages-, Installer- und Stable-Gates müssen **jetzt tatsächlich** erfolgreich laufen. Keine iOS-/VoiceOver-/Push-Realgeräteprüfung behauptet.
- Offene unabhängige Vorhaben bleiben Issue #352 (RUC-Transportkompression), #374 (Skybar bei geringer Bewölkung) und #405 (Open-Meteo Upstream). Kein Release, kein Production-Update aus dieser Dokumentation.

# MID v0.9.85.286 · Push-Präferenzen und Bestätigung (Source-PR-Kandidat)

- Basis .285 e8c3e4e61eff028797120fcecc6f3be58f993911 integriert. Keine neuen Dienste oder Berechtigungen.
- #400 reproduziert und durch geordnete Clientmutationen, konkrete Serverbestätigung und Schutz vor veralteten UI-/Scheduler-Antworten abgesichert.
- Neue echte Client-/Worker-Regression und React-Browsermatrix. Physische Geräteabnahme und globale KV-Atomarität nicht behauptet.
- Ausführliche Grenzen: docs/implementation/MID_C38_PUSH_CONFIRMATION_0.9.85.286.md. Freigabe nur über unveränderte Source-/Installer-/Deployment-Gates.

# MID v0.9.85.285 · Kalendertage und aktuelle Skybar (Source-PR-Kandidat)

- Freigegebene Basis: main=mid-stable=16b6c87906370b62315e0046dec64506304abcc4, v0.9.85.284.
- #401: Nur vollständige 23/24/25 reale Stunden, gültiges Folgestunden-Akkumulationsende und echte Rohwerte dürfen Tagesniederschlag/-anteile aus finalisierten Hour-Objekten neu berechnen. Vorhandene gültige Tageswerte haben bei lückenhafter Stundenfolge Vorrang; vergangener Niederschlag wird nicht durch „ab jetzt“ ersetzt.
- Meteodatenzeit: Epoch/TZ und echte lokale Mitternachtsgrenzen statt einer heuristischen Mindestzahl (18h); Sunshine-Daily-Fallback bei unvollständigen Stunden.
- Aktuell-Skybar: native, volle aktuelle Modellstunden für Basis, getrenntes zukünftiges 15-min-Nowcast für Niederschlag. Keine künstlichen Beobachtungen oder akkumulierten Mengen.
- Pflichtregression: `scripts/test-complete-calendar-day-current-skybar-0985285.mjs` für echtes 0, null/NaN, Tageslücken, 23/24/25h, 17:45 nach Morgenregen. Alle bisherigen Gates weiterhin verbindlich.
- #397 (Provider-Tagessumme vollständig missing), #352 (RUC Transport), #374 (Skybar bei niedriger Bewölkung) werden nicht still als erledigt ausgegeben. Keine echte iOS-/VoiceOver-Abnahme behauptet.
- Nur Source-PR → SHA-Bot → Release-ZIP → Installer → Worker/Pages → Stable; dieser Kandidatenkopf ist kein Veröffentlichungsbeleg.

- Native-Map-Popup: Nach dem Platzieren oberhalb eines teilweise aus dem Viewport ragenden Ankers wird die berechnete Position jetzt zwingend erneut geklemmt. Bisher war die Bounds-Prüfung ausschließlich im else-Zweig; dadurch konnten Kartenwert-Popups im Querformat unten hinausragen. Dieselbe Korrektur gilt für Punkt-Popups; die 844×390-Browserprüfung bleibt unverändert streng.

- Regression follow-up: immutables .169 CSS cascade restored without rewriting golden fingerprint; new maps-only CSS code-splits alongside lazily imported RadarPanel/WeatherMapsPanel (Vite cssCodeSplit=true) to preserve the 1.76 MB initial CSS budget. Source fixture includes the deferred stylesheet. Legacy push test now verifies the new compact Isobaren label while retaining default-on and persistence assertions; mountain baseline checks minimum .283 and version mirror rather than pinning a prior release.

# Map-Popup viewport bounds: Browserbefund 844×390 mit 7,5 px unterem Überlauf. Die Positionierung richtet sich jetzt nach der tatsächlich gerenderten Bounding-Rect-Höhe statt offsetHeight und begrenzt den sichtbaren Viewport konservativ; ResizeObserver reagiert auf Daten-/Labeländerungen. Echter Browser-Überlauftest bleibt verpflichtend.

# MID v0.9.85.284 · Mobile weather map canvas

- Baseline SHA 532f56a95a6d47a5cb2218146aaa038d7a74384c.
- RadarPanel: semantisch native details für Secondary-Layer/Modell und Linienstile, standardmäßig auf schmalen Viewports geschlossen. Beobachtungs-Master, Terminselector und Timeline bleiben jederzeit erhalten.
- WeatherMapsPanel: Basemap im Advanced-Menü, zwei primäre Dropdowns für Produkt/Modell; Statusleiste außerhalb des Wetterkarten-Canvas bei <=850px.
- Style rules: >70 svh map viewport, mobile line mini-trigger, 44px summaries, focus-visible, reduced-motion, landscape, Light/Dark via Tokens.
- No meteorological data transformations, contour-value conversions, API, warning, worker pipeline or RUC changes. Required script: scripts/test-map-canvas-mobile-0985284.mjs. CI/browser/installer gates must prove release.

# MID v0.9.85.283 · Technischer Entwicklungsnachweis (Source-PR-Kandidat)

- Ausgangsbasis `main=mid-stable=b02d1b018882807fbce114cf6816f520f52339d1`, v0.9.85.282, Installer #39038958909 grün. Issue #398; Branch `chatgpt/v0.9.85.283-forecast-mountain-resilience`.
- Exakter Core-Cache-Warmstart mit maximal 45 Minuten ohne Verwechslung von Orten/Höhen/Zeitzonen; gespeicherte Provenienz bleibt sichtbar. Netzaktualisierung, Sequenz- und Abort-Grenzen bleiben aktiv.
- Höhenkern unabhängig von optionalen Regionalmodellen. Nachträgliches Regional-Enrichment samt erhaltener stündlicher Zeitreferenz und erneuter UTCI-/Schneeaggregation. Abgebrochener Mehrpunkt-Request: gleichwertiger vollständiger Einzelpunkt-Retry mit Zeitlimit, 429-/Abort-Grenzen und fail-closed Schema-Prüfung.
- Regression `scripts/test-location-mountain-resilience-0985283.mjs`; alle bisherigen Pflichtprüfungen bleiben aktiv. Produktionsbuild und CI vor Merge und Installer zwingend; keine Behauptung realer iOS-/VoiceOver-Geräteabnahme.

# MID v0.9.85.282 · Technischer Entwicklungsnachweis (Source-Kandidat)

- Source of Truth: Nach erfolgreichem Installer #39029978638 stehen `main = mid-stable = 5153a43979a5b995008e554d1ee8bf111c8dbe5a`, veröffentlichte v0.9.85.281. Neuer Integrationsbranch `chatgpt/v0.9.85.282-calendar-day-skybar`, Source-Commit `3901dbb215ac275e11690a55e08b64320c54ad33`. Ausgabe folgt Issue #395 und Screenshot.
- Fachliche Zeitsemantik: Kalenderorientierte Tagesansichten werden als realer lokaler Zeitraum `[YYYY-MM-DD 00:00, Folgetag 00:00)` in verifizierter IANA-Ortszeitzone auf UTC-Epochen abgebildet. DST: 23/24/25 Stunden; wiederholte 02-Uhr-Stunde bleibt über Epoch-Zeitstempel unterscheidbar. Lokale Stundenwiederholungen werden nicht durch Uhrzeit-only-Sortierung kollabiert. Kein Datensatz darf vom ersten verfügbaren Forecast-Stundenwert an auf die komplette Tagesbreite gedehnt werden.
- `src/daySkybarTimeline.ts`: Kalenderfenster und punktgenaue reale Start-/Endpositionen, Ermittlung von unbekannten Stundenabschnitten; `src/detailSkyBar.ts` und `src/SkyBarSegments.tsx`: optionale echte Stundenenden für Bänder, Solar-Splits und Quadrate. Aufrufende 24-h-Nowcast-Verläufe ohne Kalenderfenster behalten ihren bisherigen rollierenden Vertrag.
- `src/ForecastCockpit.tsx`: sieben Tageskarten und Kurven/Widgets mit kalendergenauer Zeitachse, getrenntem Sonnen-/Nachtrendering und sichtbaren Missing-Slots. `src/SevenDayForecastSummary.tsx`: „Heute“-Tagescharakter aus allen verfügbaren Tagesstunden statt `epoch >= Date.now()`; nach vorne gerichtete Warnungs-/Nowcastfenster bleiben unabhängig. Tagesmengen werden weiterhin aus `Day.precipitation` und `Day.sunshineDuration` bezogen, nicht aus abgeschnittenen Stunden ab „Jetzt“ aggregiert.
- `scripts/test-full-calendar-skybar-0985282.mjs` testet 24h normal / 23h / 25h, Mitternacht, Sommer-/Winterzeit, doppelte lokale Stunde, fehlende erste 14 Tagesstunden, interne und komplette Datenlücken, korrekte Segmentenden, Widgets-/Tagesbeträge sowie unveränderten rollierenden Profileinstieg. Gesamtinventar: **986** Regressionen.
- Alle Produktions-/CI-Gates müssen auf dem genauen neuen Source-SHA vollständig durchlaufen; danach einzig kontrollierter MID-Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Pages/Worker → Stable. Browserchecks ersetzen keine echte iOS/VoiceOver-Abnahme. **Kein Erfolgsnachweis vor den Gates.**

# MID v0.9.85.281 · Technischer Entwicklungsnachweis (Source-PR-Kandidat)

- **Source of Truth**: v0.9.85.280 auf `main=mid-stable=9bb12c712cce0d6a5f73460cbe76c4a498c9a01c` vollständig verifiziert, Installer `39023811560` inklusive ZIP, Core/Heavy, Pages, Worker und Promotion erfolgreich. Fortführung von Issue #392, vorbereiteter Quellstand auf `chatgpt/v0.9.85.281-pseudosat-land-water` (gesichert als `d13cd9aa0cbb4106c99ebd800199549dba6dc813`), ausschließlich nach Dateiüberlappungsprüfung auf aktuell stabile .280 übertragen.
- **Kartenbasis**: `src/pseudoSatelliteBasemap.ts` liefert gemeinsame Display-Palette; `UnifiedVectorBasemap` zeichnet Wasser aus OpenFreeMap-`source-layer:water` und Land im Hintergrund, beschränkt auf helles bestätigtes Pseudo-Modellbild. Native ICON-D2 verwendet dieselbe Basis mit negativen Karten-Layer-Prioritäten, damit Wetterraster mit `zIndex=0` sichtbar bleibt. Kein Eingriff in Modellwerte oder WMO-Palette.
- **Export**: `cloudWeatherSvg`/PNG verwendet die Wasserbasis und Country-Ringe plus alle 16 deutschen Bundesländer aus vorhandenem Natural Earth. Die vorhandene Country-Liste bildet Deutschland nicht als zusammenhängende Landfläche ab; Bundesländer schließen diese Lücke. SVG-/PNG-Raster liegt darüber. Kein erfundener Satellitendatensatz; bekannte land/water-Geometrieauflösungsunterschiede dokumentiert.
- **Regression**: neu `scripts/test-pseudo-satellite-basemap-0985281.mjs` (Farbkonstanz, Layerorder, Missing-/Clear-Transparenz, Export, 5 Land- und 3 Meer-Kontrollpunkte). In zwei bestehenden Pseudo-Sat-Tests wird lediglich die bewusst erweiterte Export-Aufrufsignatur mit `geography.countries` aktualisiert; fachliche Kontur-/WMO-Assertions bleiben erhalten. Vollständige Source-/Heavy- und Release-Gates müssen unabhängig erneut nachgewiesen werden.
- **Versionsspiegel**: v0.9.85.281 in package/lock, App/Worker, beiden Service-Workern, Build-/Release-Dokumentation, Baseline und Contract-Registry, iOS-Buildnummer 282 ohne behauptete physische iOS-/VoiceOver-Abnahme.
- **Freigabesperre**: Quell-PR zum geschützten `main`, SHA-gebundener MID-Release-Bot, serverseitiges ZIP, `install-mid.yml`, Worker-/Pages-Gates, Stable-Promotion. Keine PR-Completion-Standardmerges, manuelle Production-Releases oder Ausnahmen.

# MID v0.9.85.280 – Technischer Entwicklungsnachweis (Source, nicht automatisch veröffentlicht)

- Basis: v0.9.85.279 `afceb2d0b770a7f7c337cc1b9e69359dcfee19d6`, SHA-identische freigegebene Hauptbranches nach Installer #39019809930.
- Nutzerauftrag: #392; Regen-Vorlauf und Dauer neu formatiert; absolute Orts-/Gerätezeit als persistierte Push-Option; per-Modell-Synoptik-Isobaren sichtbar schaltbar, inklusive GFS/IFS.
- Worker-Quelle und die beiden generierten Worker-Aggregate sind bytegenau synchronisiert; Browser-/Worker-Vertrag bleibt abwärtskompatibel. Keine Änderung der meteorologischen Berechnung oder RUC-Kompression.
- Verifikation: neuer `test-mid280-push-time-isobars.mjs`; Source-PR-, Release-Core-, Heavy-, Worker-/Pages- und Stable-Prüfungen müssen nach Commit grün belegt werden.

## MID v0.9.85.279 · 17.10.2026 · Ortssuche-Recovery und pseudogeografische Kartenkonturen

- Source-of-Truth: freigegebener `main=mid-stable=ee2c00bfd0db42cf0f48715bccd0dbff1e221c42` (v0.9.85.278), erfolgreicher Installer #39012604444, keine konkurrierenden offenen Produkt-PRs.
- Nutzerfall #390: Sportplatz Rankenhohn, gelegentlich Timeout nach Open-Meteo-Direct (6,5 s) und Worker-Fallback; einmaliger automatischer erneuter Versuch bei `TimeoutError`, gebunden an den aktuellen Standort/Request-Generation. Manueller Wiederholungsbutton nach fortbestehendem Fehler, ohne unendliche Retry-Kette.
- Pseudo-Sat-Modus und Kartenauswahl waren schon persistiert; deren Speicherschlüssel bleiben unangetastet. Neuer unabhängiger gespeicherter 500-hPa-Isohypsen-Schalter, ergänzt zum MSLP-Isobaren-Schalter, nur für exakt identisches Modell/Run/Validität und bestätigte synoptische 500-hPa-Konturen. Kein GDPS-Mischprodukt.
- Bei aktivem schematischem Wolkenbild im hellen Design andere Kartenbasis nur in Prognoseframes; unbestätigte Wetter- und Satellitenframes behalten Originalgeografie. SVG/PNG passen Druck- und Höhenlinien mit eigenständigen Einheiten und Datenherkunft an.
- `scripts/test-mid279-pseudosat-isoheight-timeout.mjs`: Persistenz, Konturen mit falschem Modell/Run/Term ausgeschlossen, PNG/SVG-Quellgeometrie, fehlende Wetterwerte, Schutz früherer Light-/Dark-Maps, begrenzter Ortstimeout-Retry. Keine neuen Modell-/Warnschwellen, keine neuen kostenpflichtigen Datenquellen.
- Release ausschließlich Source-PR → kontrollierter SHA-gebundener Bot-Merge → ZIP → Installer → Worker/Pages → Stable. Kein reales iOS-/VoiceOver-Gerätezertifikat.

## MID v0.9.85.278 · 2026-10-16 · Exakte solare Skybar-Slotgrenzen (Issue #374)

- Ausgangsbasis: erfolgreich veröffentlichter `mid-stable` v0.9.85.277, SHA `6754d25358c809966a3e1d026c88f500a1699d69`. Keine konkurrierende Produkt-PR vor Arbeitsbeginn; RUC- und Revision-Runs separat in Arbeit und unverändert.
- `detailSkyBarSolarSegments` teilt ausschließlich **durchgehende Himmels-Grundbänder** auf echte Epochengrenzen aus `solarTimelineWindow.nightBands` auf. Punktbezogene Wolkenzustände werden an ihrem `hour.epoch` statt an möglichen anderen Niederschlagsakkumulationsankern aufgetragen. Unbekannte Zeitstempel behalten das bisherige Ergebnis.
- Niederschlagssegmente einschließlich WMO-/DWD-Phase, Intensitätsgrad, Farben, Menge, Lauf und Akkumulationszeit werden ohne geometrische Umdeutung exakt aus `detailSkyBarSegments` übernommen; kein erfundener meteorologischer Frame und keine Interpolation von Wetterwerten. Bestätigte Wolkenlücken werden nur in der astronomisch hellen Teilzeit als solche beschriftet, nicht als Sonnenscheinmessung ausgegeben. Bestehender .268-Schwellenfix bleibt aktiv.
- Eingebunden in 90 Minuten, 24 Stunden, Tageskacheln und 7-Tage-Kurvenübersicht, zusätzlich zum bisherigen SVG-/Widget-/Export-Fundament. Stundenquadrate bleiben diskret und unverändert. DST und Polarnacht/-tag ohne zusätzliche künstliche Zeiten.
- Neuer deterministischer Test `scripts/test-skybar-solar-epoch-split-0985278.mjs` deckt 15-/60-min-Intervallgeometrie, Sonnenauf-/-untergang, Niederschlagsunverändertheit, Missing, Vollnacht, Sommerzeitwechsel und ungültige Epochensemantik ab. Vorhandene reine Aufruftextassertionen ausschließlich an die neue Signatur angepasst; fachliche Prüfungen erhalten.
- Keine neuen kostenpflichtigen Datenquellen, Worker-/RUC-/Modell-/Warnschwellen-, WMO-Code- oder Sicherheitsänderungen. Ohne erfolgreiche Source-Core/Heavy, Browser-/iOS-Hülle, ZIP, Installer, Worker/Pages und Stable-Promotion ist dieser Branch keine veröffentlichte Version. Physisches VoiceOver/iOS nicht abgenommen.

## MID v0.9.85.277 · 2026-10-16 · Beobachtungsübergang und Isobaren

- Freigegebene Source-Basis ff30648863744759aca9b28c524662e3f65ba496, v0.9.85.276, Issue #386. Parallele Abhängigkeits-/RUC-PRs und Schutzregeln unverändert.
- Gemeinsame Radar-/Satellit-/Modellzeitachse: Wolkenmodelllayer nur bei bestätigtem forecast-Frame, Beobachtung/Nowcast ohne vorgezogene Modellwolken; Schematik klar ausgezeichnet, kein Satellitenradiometrie-Schein.
- Optionale DWD ICON-D2-/ICON-EU-/ICON-Global-MSLP-Isobaren hPa aus jeweils eigenem Modellfeld mit exakt gleichem Modell, Forecast-Run und Valid Time; native und gemeinsame Ansicht mit einer persistierten Auswahl; SVG und PNG verwenden überprüfte Konturpfade.
- Neue Required-Regression `scripts/test-pseudo-satellite-isobars-0985277.mjs`; bestehende v.276-WMO-/Null-/Exportregression bleibt bestehen. Release-Freigabe nur mit belegten Source-PR, ZIP, Installer, Worker-/Pages- und Stable-Gates.

## MID v0.9.85.276 · 2026-10-16 · Modell-Wolkenbild (Phase A)

- Stable-Basis 2879b8437123017bfc98bafcf54ec9e9b68a5b50, vorher v0.9.85.275; Issue #386. Parallel bestehende Dependabot-PRs und aktive RUC-Runs nicht verändert.
- DWD CLCT+WW unverändert; optionaler rein visueller RGBA-Kompositionsmodus ohne neue Modelle, Schein-Satellitenradiometrie, Änderung von WMO-Code, Schwellen oder Modelldaten. Fehlende Felder bleiben fehlend; bestätigte Wolkenfreiheit bleibt 0.
- Ein gemeinsamer Renderer für UnifiedWeatherMap/NativeModelMap und PNG/SVG-Export; Auswahl lokal persistent, Originalansicht rückwärtskompatibel. GDPS bleibt bei seiner ursprünglichen WMS-Kombination.
- Verbindliche Regression scripts/test-pseudo-satellite-cloud-render-0985276.mjs; vor Veröffentlichung Source-Core/Heavy, Installer, Worker, Pages und exakt SHA-gebundene Promotion erforderlich.

## MID v0.9.85.275 · 2026-10-16 · Parallele Extremwetter-Direktabrufe zuverlässig abbrechen

- Source of Truth: main=mid-stable=fabed02f7f42d4a430ba9478c33aadc0d0f98c25 v0.9.85.274 vor Entwicklung. Offene PRs zum Arbeitsbeginn nur Dependabot; keine v0.9.85.275-Parallelbranch.
- Problem #345 bestätigt: `let directRequestSignal` in `scripts/build-maintenance-aggregates.mjs` generierte eine modulglobale veränderliche Variable. Bei zwei gleichzeitig aktiven Direct-Fallback-Forecasts konnte der erste spätere `fetchWithDeadline` das Signal der zweiten Operation lesen.
- Die fachliche Worker-Quelle `worker-src/25-dach-extreme-outlook.js` bleibt unverändert. Der generatorseitig erzeugte Browser-Direktadapter bildet für jeden Vorgang einen eigenen lexikalischen Kontext mit dem jeweiligen Signal. Die beiden bisherigen Modul-Caches werden bewusst weitergeteilt, damit erfolgreiche Ergebnis-/Batch-Caches und Budgetschutz erhalten bleiben.
- Die generierte Datei `src/extremeWeatherOutlookDirect.generated.js` ist synchron. Zusätzlicher `signal.aborted`-Postcheck verhindert, dass ein mittlerweile abgebrochener Vorgang aufgrund des fachlich erlaubten Batch-Fallbacks als erfolgreicher frischer Direktwert zurückkehrt.
- Die bestehende Pflichtregression `scripts/test-extreme-outlook-worker-fallback-09664.mjs` schützt nun die ausschließlich cachebezogene Worker-Quelltexttransformation und enthält deterministische Konkurrenzfixtures: zwei gleichzeitig gestartete direkte Produkte, verzögerte zweite Teilabrufe, isolierter Abort und unabhängiger Abschluss. Keine neue externe Abhängigkeit, keine Workflow-/Gate-Schwächung, kein Server-Worker-Signalverhalten verändert.
- Alle Versionsspiegel für App/Worker/Pages/PWA/Capacitor/Verträge auf v0.9.85.275. Regulärer Source-Gate und MID Installer inklusive echter Worker-/Pages-Promotion sind Pflicht; physische WKWebView-/VoiceOver-Abnahme wird nicht behauptet.

## MID v0.9.85.274 · 2026-10-16 · Modellstand: Einzelne ältere Läufe nicht pauschal rot

- Basis 1b842f210c6f817693c8f117c91e4ee867248650, main = mid-stable, v0.9.85.273; keine überlappenden offenen Produkt-PRs oder 0.9.85.274-Branches vor Source-Arbeit.
- Die bisherige aggregierte Regel `any stale -> global red` war für heterogene Multi-Modellfusionen überstreng; gleichzeitig war `fusionLoaded=true` auch bei `usedInCanonical=false` relevant, während aktiver Ensemble-Fallback fehlte.
- Der neue Ampelvertrag verlangt für Rot >=2/3 der berücksichtigten Laufanzahl mit eigenem nachgewiesenen Stale-Status; ein einzelner tatsächlich verwendeter überfälliger Lauf bleibt Rot. Teilweise Stale=Gelb mit ungekürzter stale-Anzahl und Kennzeichnung `Einzelne Modellläufe überfällig`. Unbekannte Metadaten werden nie als grün interpretiert.
- Bewusst keine Änderung einzelner modell- und laufzeitabhängiger fachlicher Frischegrenzen, keine Glättung/Interpolation/WMO-Codeänderungen. Numerische Grenze 2/3 ist eine erklärte UI-Aggregationsentscheidung und kein meteorologischer Qualitätswert.
- Erweiterter existierender TS7-kompatibler Test für Mischstatus, Vollveraltung, ausdrücklich unbenutzte Fusion, echten Ensemble-Fallback und Missing. Keine CSS-Änderung, keine neuen Abhängigkeiten/Workflows, alle Release-Versionen synchron. Vollständige Source-, Heavy-, Installer-, Worker-, Pages- und Stable-Gates erforderlich.

## MID v0.9.85.273 · 2026-10-16 · Modellstand-Aktualität auf einen Blick

- Verifizierte MID-Stable-Basis 1a7eedbe49e35445619131d390d3991e218c164a; Branch chatgpt/v0.9.85.273-model-status-freshness bei 4dbb0ef9e36d75771fbfd075e523be73f14930b8 war exakt einen Commit voraus. Divergierter paralleler 273-Branch wurde nicht übernommen.
- Gemeinsamer CockpitModelRunDetails-Trigger für Kurzfrist, sieben und vierzehn Tage mit statusabhängiger Umrandung + Punkt, lesbarer Erklärung/ARIA, 60-s-Timer, explizitem Unknown und aktualisierungsfrequenzabhängigen Grenzwerten. Fachlich keine Modell-Skill- oder Warnstufeninterpretation.
- Quellnaher 979-Test-Registry-Eintrag einschließlich neuer Model-Freshness-Regression, bereinigter Version-/Worker-/Pages-/iOS-Spiegel und nur additivem CSS-Status. Source-Gate, reale Browser-/iOS-Prüfungen und Installer bleiben maßgeblich.
- Bestehende RUC-Vollkompression, Widget-Skybar, Ensemble-Meteorologie, Modellkarten und Cloudflare-Worker-Datenverträge sind unverändert.

## MID v0.9.85.260 · 2026-10-15 · RUC-Betriebsnachweis und Open-Meteo-Prüfstand

- Basis .259 / 9c0cd7cd0da3dcbd1d6cd72fc9ec1ad90311b021 nach erfolgreichem Installer 38689707057. Drei erfolgreiche nachfolgende RUC-Läufe; publiziertes Pilotobjekt und aktueller Worker-Basishealth belegt, Codec-Read im bisherigen Log nicht sichtbar.
- Source-Gate-Reparatur: gemischte Browserfixture hält ICON-06/18-UTC-Grenze von +120 h ein. Echter Produktionsleser prüft alle 24 UTC-Laufstunden; unzulässige +180 h bleiben abgewiesen. Keine Validator-/Kartenprüfungsabschwächung.
- check_ruc_health.py ergänzt getrennte laufgebundene Codec-Evidenz. Kein Ersatz von raw readiness durch Codecstatus; explizite Boolean-, Transport- und RawRetained-Prüfung. Regressionen decken echten Nachweis, falschen Lauf, fehlende Diagnostik, Abschaltung und Rohfallback ab. Keine Workflow-/Datenformatänderung.
- Frühere Open-Meteo-Prüfungen mit Original-PRs/SHAs konsolidiert: docs/implementation/MID_OPEN_METEO_RUC_AUDIT_0.9.85.260.md. Keine ungeprüften Aliaswechsel, wissenschaftlichen Doppelkorrekturen oder rückwirkenden Kalibrierungsänderungen. MID #345 bleibt separat offen.

## MID v0.9.85.259 · 2026-10-15 · Installer dependency repair

Installer 38686567282 correctly rejected .258: the byteplanes publisher imported NumPy through storage_audit. Load the optional delta diagnostic helpers only when selected; require the complete dual-read fixture to run under python3 -S. No dependency/workflow/gate change, no compression-wire or meteorology change. .258 never reached Stable.

## MID v0.9.85.258 · 2026-10-15 · Bounded dual-read pilot

One optional <=512-KiB deterministic tail chunk, raw retention, exact post-allocation budget, strict manifest/geometry/SHA, bounded shared decoder, legacy and rollback equivalence. No full storage migration or cache deletion.

## MID v0.9.85.257 · 2026-10-14 · RUC transport canary

Shared bounded SHA-verifying decoder in isolated browser and fixed-origin Worker diagnostic; synthetic all-int16 fixtures, raw legacy reads, CacheStorage round trips, rejection of auto-decoded opaque wire. Actual hosting is GitHub Pages behind Cloudflare, not Cloudflare Pages. No production grid.v2 migration or budget change.

# MID v0.9.85.256 · RUC-Kompression sicher für Browser und Worker vorbereiten

- Der neue Prüfschritt kann künftig verlustfrei komprimierte RUC-Wetterdaten in JavaScript wieder exakt in ihre ursprünglichen Werte umwandeln. Dabei werden auch fehlende Werte korrekt erhalten.
- Ein zusätzlicher automatisierter Test prüft alle 65.536 möglichen 16-Bit-Muster und echte Python-Kompressionsdateien. Beschädigte, verkürzte oder unerwartete Daten werden zurückgewiesen.
- Die Messung eines vollständigen RUC-Laufs zeigt für Byteplane-gzip rund 70,8 Prozent theoretisches Einsparpotenzial beim bisher veröffentlichten Datenbestand. Das ist eine Messung, noch keine aktivierte Speicherreduktion.
- Die bisherige RUC-Veröffentlichung, Wetterberechnungen, Karten und das bestehende Datenformat bleiben unverändert, bis Web-/Worker-Dual-Read, echte Leistungsprüfungen und die alten App-Caches sicher getestet sind.

# MID v0.9.85.255 · Kartenprüfung bei hoher Browserlast zuverlässiger

- Die regelmäßige Qualitätsprüfung der Wetterkarten verteilt gleichzeitig geöffnete Kartenfenster schonender. Dadurch wird die Software-Grafikdarstellung weniger stark überlastet.
- Alle 24 Bildschirmgrößen-, Design- und Hell-/Dunkel-Prüffälle bleiben erhalten. Die Anzeige der ICON-EU-Isobaren muss weiterhin tatsächlich funktionieren; eine fehlende Karte bleibt ein Fehler.
- Sollte die Prüfung scheitern, zeigt der Bericht jetzt deutlicher, welche Displayvariante, Modellkarte und Kartenlayer betroffen waren.
- An Wetterberechnungen, Modelllaufzeiten, Farben, Karteninhalten und der Bedienung ändert sich nichts. RUC-Datenformate und Speichergrenzen bleiben unverändert.

# MID v0.9.85.254 · Veröffentlichte Modellkarten wieder vollständig erreichbar

- Ein Fehler im Kartenkatalog wurde behoben: Gültige zusätzliche ICON-D2-Wolken-/Wettertermine bei +13, +14, +16 und +17 Stunden führten bisher dazu, dass die App den gesamten Synoptik-Katalog ablehnte. Die bereits veröffentlichten Karten von ICON-D2, ICON-EU, ICON, GFS und IFS sind dadurch wieder auswählbar.
- Die Prüfung bleibt streng: Zusatzstunden gelten ausschließlich für ICON-D2. Lauf, Gültigkeitszeit, Modellhorizont, Größe, Datenformat und Prüfsummen müssen weiterhin stimmen. Fehlende Karten werden nicht geschätzt oder künstlich ergänzt.
- Automatische Kartenprüfungen verwenden auch beim vollständigen Revisionslauf die bestehenden vollständigen Teilgruppen. Alle 24 Größen-/Theme-/Designfälle bleiben erhalten; die Zeitgrenze pro Teilgruppe wird nicht erhöht.
- Neue Regressionen prüfen den tatsächlich veröffentlichten Katalog und zusätzliche Kartenstunden. Wetterberechnungen, Darstellung, Speicherbudget und das RUC-Datenformat bleiben unverändert.

# MID v0.9.85.253 · Sicherheitsprüfungen mit eindeutigem Datenstatus

- Eine hohe Sicherheitslücke im Build-Werkzeugpfad wurde durch den kompatiblen Patch von `source-map-js` auf 1.2.2 behoben.
- Die Prüfung der Produktionsabhängigkeiten unterscheidet jetzt ein geprüftes Ergebnis von einem unbekannten Zustand bei ausgefallenen Prüfdiensten. Ein unbekannter Zustand wird nicht mehr als „keine hohen Sicherheitsbefunde“ bezeichnet.
- Prüfzeit, geprüfter Paketstand und verwendete Quelle werden nachvollziehbar dokumentiert. Bei Dienstausfällen wird eine notwendige Nachprüfung ausgewiesen.
- Unvollständige oder ungültige Antworten gelten nicht als erfolgreiche Prüfung. Bestätigte hohe und kritische Befunde blockieren weiterhin die Freigabe.
- Wetterdaten, Modellkarten und Darstellung bleiben unverändert. Die bestehende Regel für reine externe Dienstausfälle und die unabhängigen Release-Prüfungen bleiben erhalten.

# MID v0.9.85.252 · Modellkarten bei echten Datenlücken besser erreichbar

- Bei geöffneten Modellkarten wählt die gemeinsame Zeitleiste zum Einstieg einen tatsächlich vorhandenen Modelltermin statt eines reinen Radar-/Beobachtungszeitpunkts. Das reduziert leere Synoptik-Komposite bei ungleichmäßig verfügbaren Modellzeiten.
- Bei „Wolken und signifikantes Wetter“ kann ICON-D2 für einzelne fehlende Termine ein schon vorhandenes, zeitgleiches natives Wolken-/Wetterfeldpaar nutzen. Fehlende oder unpassende Felder werden weiterhin nicht ergänzt oder geschätzt.
- Zusätzliche Regressionen prüfen die Terminwahl und stellen sicher, dass nur gemeinsam verfügbare Modellfelder verwendet werden.
- Modellberechnungen, Warnschwellen, RUC-Datenformat, Speicherschutz und die Bedienung anderer Wetterkarten bleiben unverändert.

# MID v0.9.85.243 · Orte sortieren und verständliche Wetterwerte

- Prognose-Radar unter Vorhersage eindeutig benannt. Die erweiterte Ensembleanalyse im Prognose-Cockpit zeigt dieselbe Auswertung nicht doppelt; eigenständige Ensembleansichten und Änderungsbenachrichtigungen bleiben erhalten.
- Die Mehrort-Übersicht folgt standardmäßig deiner Favoritenreihenfolge in den Einstellungen. Sortiere alternativ nach Ortsname, Warnlage, Temperatur, Niederschlagsmenge, Böen oder Entfernung. Deine Wahl bleibt gespeichert.
- Übersicht und „Wetterfenster vergleichen“ haben klar unterschiedliche Aufgaben: kompakte Wetterkarten gegenüber einer Rangliste mit hervorgehobenen passenden Stunden und konkreten Trockenphasen.
- Ganzzahlige Temperaturen in der Ortsübersicht; gleiche gerundete Minima und Maxima werden nur einmal angezeigt.
- Einheitliche parameterabhängige Anzeigepräzision: keine Hundertstel bei Niederschlagswerten, ganzzahlige Windwerte auch in m/s, Sichtweiten in fachlich passenden Stufen. Kleine positive Niederschläge bleiben als „<0,1 mm“ sichtbar.
- Neuer verbindlicher Präzisionsvertrag unterscheidet SYNOP-Berichtsregeln von MID-Prognosedarstellung. Die unveränderten Originalwerte bleiben Grundlage für Berechnungen und Vergleiche.

## MID v0.9.85.236 · Ortsanzeige und verlustfreie RUC-Deduplizierung

- Die ausgewählte Ortsleiste bleibt beim Scrollen über dem Suchkopf scharf lesbar. Der überlagernde Kopf-Blur wird bei sichtbarer Ortsleiste abgeschaltet; Karten-/Einstellungsgrenzen und Dialoge bleiben erhalten.
- Bytegleiche RUC-Chunks werden nach Hash, Größe und vollständigem Bytevergleich einmal gespeichert. Der Worker unterstützt geprüfte Chunk-Aliase sowie unverändert ältere Snapshots. Missing, trockene Nullen, Zeitachsen und Datengenauigkeit bleiben bitidentisch.
- Gemessener Lauf2026-10-11T05:00:899950367 Objektbytes,20103168 Duplikatbytes. Der tatsächliche Gewinn jedes neuen Laufs fließt vor der Synoptik-Budgetierung ein und erhält damit mehr validierte Modelltermine, sofern verfügbar.1MB Reserve plus exakte Manifestprüfung schützen das unveränderte900MB-Budget.
- Gzip/Byteplane-Kompression bleibt Messkandidat bis vollständige Lauf-/Decoder-/Performance-Evidenz vorliegt. Keine zusätzlichen Felder oder Modelle werden zur Einsparung gestrichen, kein kostenpflichtiger Speicher aktiviert.

# MID v0.9.85.235

Kompakter gemeinsamer Profilkopf, kanonischer Sticky-Ortskontext und reversible Byteplane-Kompressionsmessung. Basis fd6890e; keine Decoder- oder Budgetänderung. Details: docs/implementation/MID_C27_COMPACT_PROFILE_0.9.85.235.md.

## MID v0.9.85.231 · 2026-10-10 · Missing-Vertrag RUC-Phasen

- Kartenparameter sigwx wird bei gleicher persistierter ID zur gemeinsamen Wolken-/Wetterkarte. Gemeinsamer Renderer/Legende/Ortswert/Export; native Legacy-Route nutzt dieselbe Kombination. GDPS nutzt zwei verifizierte GeoMet-Produkte desselben Laufs und Termins, begrenzte Niederschlagsart ausdrücklich gekennzeichnet.
- Optionale ICON-EU/ICON-Global-Anreicherung erhält Synoptikkerne bei Quellenfehlern. CLCT/WW-Raw-Identität, Einheiten, gültiger Termin und identisches Raster zwingend. Sechs reale DWD-Header belegen WW-Parameter0/19/25, keine hypothetischen WW-WMS-Layer. Kategoriale Raster auch im Kartenrenderer nearest statt linear.
- Neue Pflichtregression und zwei Pythonfälle prüfen Paarung, Missing, WMO-Intensitätsgrenzen, Katalogfilter und Atomizität. Bestehender echter Karten-Browsergate prüft die Kombination zusätzlich in allen Viewport-/Theme-/Designfällen.

- Fehlender Graupel bleibt NaN/int16-Missing statt trockener0. Wire-Struktur unverändert.
- Worker erhält Decoder-null und zählt nur endliche Phasenwerte. All-missing nicht verfügbar; echte trockene0 gültig.
- Overlay erzeugt aus null/Leerwerten keinen thermischen Schnee-/Gefrierbeleg. Zwei zusätzliche Pflicht-Pythonfälle und erweitertes reales Worker-/phaseFor-Gate.
- Basis .230 Stable116cc09e9fdd9605cfbc5154e6e84c4065793b78, Gates unverändert. Separate offene RAIN_GSP-Units/accum-Frage dokumentiert.

## MID v0.9.85.230 · 2026-10-10 · Skybar, alphabetische Karten und MU-Energieverträge

- Alphabetische Modelle und gruppenweise Parameter in UnifiedWeatherMap und WeatherMapsPanel; gemeinsamer deutscher Collator mit natürlichen Zahlen, kopierte Listen statt Mutation. Fallbackprioritäten/persistierte IDs unverändert.
- Vier echte CAPE_MU/CIN_MU-DWD-Header2026-10-10T15:00 +0/+1h mit Hash/Raw-Codes/Grid archiviert; reproduzierbarer begrenzter Probe. Separate MU193-Matrix und Energieeinheiten J/kg statt stiller Übernahme beliebiger Einheiten. Drei neue Python-Pflichttests, keine vollständige optionale Werte-/E2E-Abnahme.
- C21-CI-Browserfixture erhält den neuen expliziten minutes15-Prop;28 lokale Fälle grün. Karten-Browsergate prüft alphabetische sichtbare Reihenfolge in beiden Auswahlrichtungen; reine ThetaE-Reihenfolgeassertion folgt bewusst dem neuen Alphabetvertrag bei gleicher Anbieter-Menge.

- Verifizierte Basis main=mid-stable b88efe2f3ba580aad5a0e692037f2c9814f69547 (.229), Installer38059674163 erfolgreich; keine überlappende Source-PR.
- Current bekommt displayMinutes15 und shortTermAnchor wie Heute. buildShortTermForecast und die wiederverwendete shortTermProfileHourlyPoints-Aufbereitung erhalten geringe native Mengen und korrekte vorwärts gerichtete Zeitintervalle. Kein zweites Radar-Blending auf bereits finalisierten Daten.
- Gemeinsame detailSkyBarTimedSegments zeichnet ausdrücklich Anfang/Ende, clippt Geometrie ohne Mengen-/Intensitätsänderung und erhält Lücken. Current und Heute verwenden denselben Niederschlagsrenderer; Current-Stundenquadrate dieselbe Stundenaufbereitung und echte Epoch-Positionen.
- Regression reproduziert zuvor fehlende 0,06 mm, vergleicht Zeitpunkt/Phase/Intensität, Squares, trocken/Missing, Clipping, Lücken und Input-Unveränderlichkeit. Browser prüft echte Current-/Heute-Komponenten in sechs Viewports, beiden Themes/Designs und beiden Skybar-Modi.
- Bestehende wissenschaftliche, Sicherheits- und Freigabeverträge bleiben verbindlich; weitere Gesamtauditpunkte aus .229 bleiben offen.

## MID v0.9.85.229 · 2026-10-10 · UTCI, kompakte 14d-Entwicklung und reale Werte-Referenz

- Verifizierte Basis main=mid-stable ada0f6c54a7ed1faf56d4d202d8a897abf567157 (.228). Keine überlappende offene Source-PR; Releasegates unverändert.
- CurrentUtciHighlight erhält ausschließlich den bestehenden kanonischen UTCI; eigene Wertgruppe, Einheit und Kategorie. Nicht endliche Werte zeigen keine Behaglichkeitskategorie.
- Gemeinsamer HorizonSignalChart verbindet nur aufeinanderfolgende UTC-Kalendertage bei explizitem connectDaily; Missing und fehlende Tage unterbrechen die Linien. Periodenprodukte bleiben diskret. 14d nutzt kompakte Höhe und konsolidierte Phasen.
- derive_core_fields extrahiert unverändert die bisherige Produktionsrechnung; Werte-Referenz und Produktion teilen denselben Normalisierungs-/Ableitungs-/Packing-Pfad.
- DWD-Lauf 2026-10-10T09:00: 66 Dateien, zwölf Kernparameter/Koordinaten und EPS1..20 bei +0/+1h; vollständiges Gitter542040, QC und Niederschlagskonservation bestanden. 35 dekodierte Zellvektoren mit URL/Hashes und Bit-Goldens eingefroren. Keine rohe GRIB-Archivierung oder volle14h-/Rapid-/Lookup-/E2E-Abnahme behauptet.

## MID v0.9.85.228 · 2026-10-10 · Wissenschaftsaudit: kalibrierte Kern-GRIB-Verträge

- Basis main=mid-stable bc7c73a818714420474b688b48b7ef3fdf2893b1 (.227), Releasegates unverändert.
- CORE_CONTRACTS umfasst zwölf Kernfelder und CLAT/CLON; EPS TOT_PREC wird im Prozessdecoder ausdrücklich gebunden. Raw Fixed-Surface-Codes statt unknown-Anzeigenamen.
- Unstrukturierte Felder müssen UUID c6b12daa91ad64045b26c1b6452a2a20, Grid47/Reference1 und542040 Punkte treffen; Revisionen benötigen Neukalibrierung.
- UTC init+lead=valid, instant/accum/max-Bounds und explizite m/h/s-Schritte; additive sourceGribContract-Metadaten ändern keine Binärlayouts.
- Pflicht-Negativfixtures und read-only Header-Achsenprobe einschließlich20 EPS-Mitgliedern; keine vollständige Werte-/QC-/Packing-/E2E-Verifikation daraus behaupten.
- Vollständiger Produktions-Mitgliedersatz1..20 und Host-zeitzonenunabhängige UTC-Laufkennungen. Reale584 Header mit URL/Hash/Bounds/Grid archiviert;47 GRIB-/Integritäts- und3 Temperaturtests,955 App-Regressionen und14 Browserfälle lokal bestanden.

# MID v0.9.85.216 · Widget-Render-Gate

Geladene Fonts/Bilder, zwei Paints und sichtbare Geometrie sind gemeinsame Voraussetzung für URL-/PNG-/Clipboard-Export. Echte Bild-/Fontfehler erzeugen keine Ready-Freigabe. CDP bewahrt den ersten Fehler mit Screenshot und begrenztem Versions-/Stable-/Render-/Netzwerkbezug über Retry/Recovery. Fehlerartefakte bleiben im CI-Artefakt außerhalb des öffentlichen Widget-ZIP. Alte Source-Wiring-Prüfungen folgen dem extrahierten Helper; ihre Font-/Paint-/SVG-Restore-Verträge bleiben erhalten. Keine Wetterwerte, Skybar-Geometrie, Release-Gates oder Produktionsberechtigungen geändert.

# MID v0.9.85.215 · MID-C24: durchgehende Skybar und konkrete Intensivaudit-Abnahme

Gleiche angrenzende Skybar-Darstellungen werden im gemeinsamen SVG-Renderer einmal gezeichnet; Originalintervalle/Titel, Datenlücken und Niederschlags-Paint-Reihenfolge bleiben erhalten. Konkrete offene Auditschritte und Abnahmegrenzen: docs/implementation/MID_C24_SKYBAR_AUDIT_STATUS_0.9.85.215.md. Basis main=mid-stable a4e0031df84d46614b7fc5889f92577236d01680 (.214). Veröffentlichung ausschließlich durch Source-Gate, bestehenden Bot und Installer/Pages/Stable-Promotion.

# MID v0.9.85.214 · Intensivaudit Phase 3b: isolierte Karten-Speicherprobe

Verifizierte Basis main = mid-stable = 19b28d9e28bb05efa6e5e690f5e224566f62c551 (.213), Installer 37882113485 erfolgreich. Paralleländerungen .207–.213 vollständig erhalten. Branch codex/v0.9.85.214-audit-map-memory.

Die bestehende vollständige 24-Fälle-Kartenmatrix bleibt erhalten. Nach ihrem Abschluss läuft im Heavy-Shard 2/3 (oder lokal ohne Shard) ein zusätzlicher, isolierter 390px/Light/Next-Fall. Zwei Warmup-Rundwechsel ICON-EU→ICON-D2 füllen beide geprüften Modellcaches; danach 20 echte Rundwechsel über dieselben sichtbaren Controls. Jeder Wechsel wartet auf den aktuellen Modellstatus ohne Ladezustand sowie genau eine Synoptik-Flächenebene. Dieselbe ursprüngliche MapLibre-Instanz und genau eine Karte bleiben Pflicht. Die zusätzliche Probe ist klar als isolated-memory-cycles gekennzeichnet, damit ihre GC-/Stress-Frametimings nicht als unveränderte Phase-3a-Baseline verglichen werden.

Chrome DevTools Protocol sammelt nach Garbage Collection H0/H5/H10/H15/H20: V8-Isolate used/allocated heap, optional ArrayBuffer/external-string backing storage sowie DOM-Dokumente/Knoten/Listener. Das ist weder gesamter Browser-/GPU-/Worker-Speicher noch ein WKWebView-Profil. Ein synthetischer Trend allein beweist keinen Leak. Ausgabe enthält absolute Proben, Deltas, strictlyIncreasingHeap als rein beschreibenden Befund und p95 der 20 Roundtrip-Laufzeiten. Keine willkürlichen Heap-/FPS-Grenzen, keine Budgetlockerung, keine User-Telemetrie. Defekte/unvollständige Pflichtmessungen oder fehlerhafte Modellwechsel bleiben fatal; fehlende optionale backingStorage-Metrik wird null statt 0.

MID_MAP_TRACE=1 schreibt einen Chromium devtools.timeline/v8/blink.user_timing-Trace ausschließlich während der isolierten Zyklen nach /tmp/mid-map-cycles-390-light-next.json. Der Trace wird auch nach einem Zyklusfehler gestoppt; CDP-Session wird per finally freigegeben. CI-Normalweg erhebt Speicherproben ohne Tracing-Overhead. Schema mid.map.runtime.fixture.v2 nennt die echte package.json-Version statt der bisher fest codierten .210. Raw-JSON bleibt in bestehenden CI-Logs und /tmp; kompakte Speicherwerte ergänzen das Step-Summary. Keine Workflow-/Secret-/Ruleset-Änderungen.

Pflichtregression scripts/test-map-memory-profile-0985214.mjs prüft 2+20 Cycles, fünf GC-Proben in richtiger Reihenfolge, wachsende/fallende Werte, fehlende/kaputte Messungen, Durchreichen von CDP-/Modellfehlern und vollständiges Browser-Wiring. Beide Baseline-Inventare verlustfrei erweitert. Bestehende Core/Heavy/Responsive/iOS/Release-Gates bleiben unverändert.

Parallelstand: RUC-Bitmap-Reparatur .213 freigegeben. Issue #305 bleibt bis zur erfolgreichen neuen echten DWD-RUC/RUC-EPS-/Pages-Freshness-Abnahme offen. Die aktuelle Repo-Synchronität allein beweist keine frischen Wetterdaten. Weitere Auditpakete: Widget-readiness/Erstfehlerdiagnostik, produktfeste GRIB-Level-/shortName-Verträge mit echten Headern, Cross-Model-/Missing-Data-Prüfungen, A11y-Kartenalternative und iOS-Simulator-Lifecycle. SEC-001 aus dem PDF war durch aktive Rulesets bereits widerlegt (.207); Schutz nicht neu/parallel umbauen.

Primärquellen: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage ; https://chromedevtools.github.io/devtools-protocol/tot/Memory/#method-getDOMCounters ; https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-collectGarbage . Freigabe ausschließlich über Source-PR-Gate → MID Agent Source Release → serverseitiges ZIP → Installer → Worker/Pages → SHA-gebundene Stable-Promotion.

# MID v0.9.85.213 – Intensivaudit: DWD-RUC/GRIB2-Bitmap-Reparatur

## Gesicherte GitHub- und Produktivbasis
Verifizierter Ausgangsstand `main = mid-stable = e71171c0d477c0fbef51e17e9c21c399525ec94d`, v0.9.85.212. Vollständig freigegeben über PR #306 und Release-Installer. Neuer Branch: `chatgpt/v0.9.85.213-ruc-bitmap-recovery`. Offener Produktionsblocker #305.

## Ursachennachweis (nicht aus bloßer Vermutung)
Reale GitHub-Action-Protokolle, u.a. Run 37876446456: Pro `T_2M`-Vorhersageschritt genau 542.040 dekodierte Werte, Kelvin, davon 16.968 konstante 9999-K-Einträge (ca. 3,13 %) entlang des ICON-D2-RUC-Gitterrandes. Der bisherige Parser übernimmt ecCodes-`values` vor Prüfung des GRIB2-Section-6-`bitmap` direkt; seine Kelvin-Umrechnung macht daraus 9725,85 °C. Die korrekte Validierung `validate_core_fields` stoppt deshalb fail-closed mit `temperature_2m: decoded values exceed physical/semantic bounds`. Mehrere Stundenläufe nach v0.9.85.212 reproduzieren dieselbe maschinenlesbare Ursache.

## Umsetzung und semantische Grenzen
`tools/ruc/grib_bitmap.py`: Die GRIB2-`bitmapPresent`- und tatsächliche ecCodes-`bitmap`-Maske wird verbindlich angewendet, bevor die Originalwerte interpretiert oder in Einheiten normiert werden. Bitmap-Bit 0 = nicht definiertes Gitterelement (IEEE NaN). Bitmap-Bit 1 = physikalischer Modellwert. **Alle Zellen und ihre Indizes bleiben erhalten; keinerlei Kürzung, Neugitterung oder Maskenraten**. Unbekannte Indicator-Werte, fehlende/anders lange oder mehrwertige Bitmaps führen zu `MeteoIntegrityError`. Bloßer Zahlenwert 9999 ohne authentische Bitmaske darf nicht stillschweigend eliminiert werden. Auf dieselbe Funktion gehen die Kernfelder, optionalen Rapid-/Phasendaten, RUC-EPS-Member und Koordinaten-Grib. Unmaskierte CLAT/CLON bleiben unverändert.

Im bestehenden Wire-Packer werden IEEE NaN als der bereits etablierte Int16-Wert -32768 (oder bei EPS der UInt16-Wert 65535) kodiert. Unmaskierte, real falsche physikalische Werte werden weiterhin abgewiesen. Der bisherige WMO-/DWD-Phasenvertrag, native DWD-Signatur-/Provenienzprüfer, meteorologische Grenzwerte, fehlende Provider-Backups und alle RUC-Wire-Schemas bleiben unverändert.

## Tests und Abnahme
`tools/ruc/test_grib_bitmap.py`: produktive echte Zellanzahl und fehlender Randbereich, Kelvin->°C nur für gültige Zellen, native Grid-Ausrichtung, Wire-NODATA, fehlende/kaputte/mehrwertige Bitmap, kein unerlaubtes Erraten fehlender Daten bei unmaskierten 9999, physikalischer Validator weiterhin fail-closed. Die Tests sind in den verbindlichen Python-Testpfad `tools/ruc/test_fetch_resilience.py` eingebunden. Nach grünem vollständigen Source-Gate/Installer **muss ein echter vollständiger DWD-RUC-/EPS-Job inklusive Pages-Free-Veröffentlichung und Worker-Datenaktualität grün nachgewiesen** werden; vorher Issue #305 nicht schließen und niemals behaupten, die gesamte Produktionspipeline sei wiederhergestellt.

## Audit-Fortsetzung
Offene Schritte: vollständiger RUC-Probelauf samt Maskenquoten/Panel-Freshness; dokumentierte DWD-Parameter-/Level-Matrix; Karten-Timeline-Traces, mehrfache Performance-Proben, mobile Barrierefreiheit, iOS-WKWebView-Simulator. Bestehende Risiken #270 (Audit-Dependencies), #246 (alte einzigartige Branches), #176 (Agent-Broker) und PR #252/#253/#260 unverändert getrennt.

## Referenzen
DWD ICON-Modellbeschreibung https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf ; DWD ICON-D2-RUC Open Data https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/ ; dokumentierter Bitmap-Befund mit 16968 Randzellen https://github.com/KnownStormChaser/master-weather-model-list/blob/main/models/nwp_models/regional/germany/icon-d2-ruc.md .


# MID v0.9.85.212 · Intensivaudit: Karten-Themekontrast und RUC-Provenienz

Source-of-truth-Basis: main = mid-stable 055a6ead7b76b68751079935f1994fc8984bf534 (v0.9.85.211); ausschließlich chatgpt/v0.9.85.212-dark-map-ruc-audit für den Source-PR.

## I. Dark Mode, Accessibility, mobile Darstellung

Screenshotbefund: Die direkte Karten-Terminsteuerung in RadarPanel.tsx besitzt in UnifiedWeatherMap.css die Regel background:var(--card,#fff). --card ist nicht kanonisch definiert und der weiße Fallback produziert unter dunklem Theme ein kontrastarmes, sehr helles Formular mit nahezu unsichtbarer Schrift. Appweite native MID-Farbvariablen --surface, --text und --border statt nicht definiertem --card oder hartem Weiß; korrekter nativer color-scheme und Option-Hintergrund, sichtbarer Tastaturfokus, 44px Ziele, mobil <=430px Aufteilung des zusätzlichen Aktuell-Buttons auf volle Zeile. Keine JS-Zeit-/Radar-/Datenänderung.

Tests: scripts/test-map-direct-time-theme-0985212.mjs schützt CSS/Fokus/Touch-/Theme-Vertrag als Core-Regression. Die bestehende echte Chromium-/MapLibre-Matrix scripts/verify-unified-map-browser-0985167.mjs prüft für alle dort verfügbaren Viewport-/Light-/Dark-/Designkombinationen Hintergrundhelligkeit und WCAG-AA-Textkontrast >=4,5 der aktivierten Bedienelemente sowie bereits vorhandene 44px und Overflow-Prüfungen. Browserwerte stammen aus synthetischer kontrollierter Kartenfixture, nicht aus Telemetrie realer Nutzender.

## II. RUC-Integrität: ISSUE #305, bewusst offen

Lauf https://github.com/MeteoMartini/MID/actions/runs/37853501210 scheitert in prepare weiterhin an unplausibel dekodiertem T_2M; Fail-Closed-Meteorologie-Gate bleibt unverändert. Bis zur nachgewiesenen Ursache darf kein ungeprüfter Fallback in die produktive RUC-Veröffentlichung einfließen. tools/ruc/build_ruc_bundle.py protokolliert nur bei Validierungsfehlern begrenzte per-Lead-Provenienz: GRIB-Dateiname, UTC-Valid-Time, Einheiten, Anzahl und Zahl nicht endlicher Zellen, Minimum/Maximum nativer und normierter Werte, Anzahl außerhalb des bestehenden °C-Sanity-Bereichs. Kein Rohfeld, kein Geheimnis, kein vollständiges GRID-Logging; Validator wird weder abgeschwächt noch abgefangen, sondern Fehler bleiben fatal. tools/ruc/test_temperature_decode_audit.py prüft Kelvin->C, C unverändert, NaN/Sentinel-Aggregat und fortdauernde Fehler bei physikalisch ungültigen Temperaturen. Der nächste echte DWD-Preprocessing-Run muss erst Ursache (Encoding, Bitmap/Missing, Unit) belegen. Anschließend separate validierte Korrektur, erneuter vollständiger RUC-Run und Pages-Snapshot. Issue NICHT abschließen ohne Produktivbeleg.

## III. GitHub offene Arbeit geprüft, nicht überstürzt gelöscht oder gemergt

- #305 offen: blockierter DWD-RUC-Produktivlauf; .212 liefert Diagnostik, keine Ursachenbehauptung, keine Gate-Umgehung.
- #270 offen: nächtliche Revision Audit failure; Beispiel https://github.com/MeteoMartini/MID/actions/runs/37764900622 bestätigt npm-audit-Befunde uuid@7.0.3 sowie source-map-js@1.2.1. Auch im verifizierten .212-Lockfile vorhanden; @capacitor/cli steht bereits bei 8.5.2. Abhängigkeitsgraph, Advisory-Fix und CI-/iOS-Kompatibilität müssen separat nachgewiesen werden. Keine npm-audit-Ausnahmeregel.
- #246 offen: zwei alte Branches mit einzigartigen Commits, niemals ohne SHA-verifizierte Sicherung löschen.
- #176 offen: Agent-Ref-Broker ist bewusst ein dauerhaftes Steuer-/Integrationsobjekt.
- PR #260 (13 Dependencies), #252 (pako v2→v3, API-/Export-Breaking-Change) und #253 (Wrangler Action) sind aktuell mergeable=false, z. T. veraltet. Keine automatische Versionserhöhung, Rebase, manuelle Merge-Umgehung oder Workflow-Änderung. Nach getrennten Kompatibilitäts-/Security-Tests und neuem Stable-Base-Check über normalen Source-PR einarbeiten.

## Auditfortsetzung und Freigabe

Map-/Timeline-Performance-Baseline aus .210 bleibt unverändert (Phase 3a); weiterführende Profile für Speicher und Interaktion (3b) erst aus reproduzierbaren Chromium-Traces, getrennt von diesem UI-/RUC-Blocker. Vollständiges Source-PR-Gate, deterministische Regressionen, Heavy-Map/Responsive, Python/RUC, Security/Build/iOS, Agent-Automerge, Release-ZIP, Installer und Worker/Pages- sowie SHA-geprüfte Stable-Promotion bleiben verbindlich.


# MID v0.9.85.211 – Sonderprüfung WMO-Niederschlagsphase und Kurzfrist-Zeitbezug

SHA-verifizierte Basis: main = mid-stable fb289175c0eb4e414900d6d645f9c5ed814c5d44 / v0.9.85.210. WMO-4677 Codes 66/67 stehen für gefrierenden Regen, 68/69 für Regen und Schnee gemischt. Positive Lufttemperatur allein schließt gefrierenden Regen bei kalter Oberfläche nicht aus. MID prüft die modellierte warme Oberfläche >=1,5 °C sowie T2m >=1,5 °C und Feuchtkugel >=1 °C als konservative Plausibilitätskorrektur nur von unbestätigten Forecast-Codes auf gewöhnlichen Regen. Fehlende oder kalte Bodenwerte bleiben vorsichtshalber kein Widerspruch. Ein bei positiver Luft-/Feuchtkugeltemperatur verbleibendes unbestätigtes Gefriersignal wird als möglich formuliert, ohne den WMO-Code oder vorhandenes Gefährdungssignal zu verfälschen. Diese MID-Fachgrenzen sind keine amtlichen DWD-Warnschwellen. Beobachtete Phänomene werden niemals umklassifiziert. FZRA und FZDZ verwenden ein eigenes Glätte-Oberflächenzeichen statt der mit Schneeregen verwechselbaren Schneekristallmarkierung; Schneeregen bleibt Regen plus Schneekristall.

Die Kurzfristüberschrift referenziert nun dieselben aggregierten vorwärts gerichteten Stundenintervalle wie das sichtbare Wetterprofil, bevorzugt innerhalb der ersten betroffenen Stunde den frühesten tatsächlich nassen nativen 15-min-Slot und verwendet dessen Intervallbeginn. Wahrscheinlichkeit bei 0 mm ist kein sicherer Regenbeginn. Die 90-min-Kacheln zeigen keine redundante Wolken-%-Zeile; der wissenschaftliche Skybarwert und seine Erklärung bleiben erhalten. Regressionen: scripts/test-precipitation-shortterm-coherence-0985211.mjs und aktualisierter C23-Sunset-Browsercheck; bestehende Mountain-Kälte-/Regen-Gates unverändert. Kein neuer Datenprovider, kein Release-Shortcut, keine Workerfunktion oder Kosten. Vollständige Source-/Installer-/Pages-/Stable-Gates erforderlich.

Primärquellen: https://confluence.ecmwf.int/spaces/ECC/pages/45023980/WMO%2B6%2Bcode-flag%2Btable ; DWD https://www.dwd.de/DE/leistungen/pbfb_verlag_vub/pdf_einzelbaende/vub_16_gesamt_pdf.pdf?__blob=publicationFile&v=5 .

# MID v0.9.85.210 · Intensivaudit – Schritt 3a: automatische Karten-/Timeline-Laufzeitbaseline

Verifizierte Basis main = mid-stable 722ca3b96f142e96cb6e99d1b7038f48d6386fec (v0.9.85.209). Das bestehende echte Headless-Chromium-QA-Szenario scripts/verify-unified-map-browser-0985167.mjs erhält optionale, nichtproduktive PerformanceObserver- und requestAnimationFrame-Proben. In allen vorhandenen isolierten Heavy-Karten-Shards werden 390px/Tablet/Desktop sowie weitere bisherige Viewports, Light/Dark und klassisches/modernes Design durchlaufen, sofern bereits vom Shard unterstützt. Gemessen werden Zeit bis zum initialen interaktiven Kartenstatus, p95 der aufgezeichneten Frame-Abstände, Anzahl/Maximum der Long Tasks und die im Browser verfügbare letzte LCP-Zeit. Vor vorhandenen Page-Reloads und am Testende werden einzelne Phasen snapshotsicher ausgewertet. Messwerte stehen als schema-versionierte JSON-Datei /tmp/mid-map-runtime-baseline-<shard>.json und als Tabelle im jeweiligen GitHub-Step-Summary. Neue nichtproduktive Statistik-/Browser-Probe-Module: scripts/lib/mapBaselineStatistics.mjs und scripts/lib/mapBrowserPerformanceProbe.mjs; der Pflichtregressionstest scripts/test-map-runtime-baseline-0985210.mjs prüft positive/negative Perzentilfälle und das reale QA-Wiring.

Abgrenzung: Dies ist eine **synthetische Vite-/MapLibre-Karten-Fixture mit simulierten Daten** unter CI-Last, nicht Real-User-Monitoring und nicht die Feldmetrik p75-LCP/INP/CLS. Daher werden keine unkalibrierten Laufzeitgrenzwerte oder feste FPS-Regressionsgates eingeführt; bestehende harte Bundlesicherheitsbudgets aus MID_PERFORMANCE_BASELINE.json und sämtliche Produkt-/Source-/Installer-Gates bleiben unverändert. Der nächste Audit-Schritt vermisst nach mehreren stabilen CI-Durchläufen die Varianz, erstellt gegebenenfalls Chrome-Trace/Heap-Baselines für 20 Karten-Zyklen und prüft Preview-Lighthouse und mobile/Native-WKWebView separat. Keine kostenpflichtigen Angebote, keine Datenquellen-/Workerlogik- oder UI-Änderungen.

Freigabe ausschließlich über Source-PR-Gate → Bot-Merge → serverseitiges Release-ZIP → Installer → Worker-/Pages-Prüfung → Stable-Promotion.

# MID v0.9.85.209 · Intensivaudit – GRIB2-Metadatenhärtung (Schritt 2b)

Verifizierte Basis main = mid-stable 419da8d3d780a142a9b25e50ae6e210be06acddb (v0.9.85.208). GRIB-Herkunft in tools/ruc/grib_metadata.py, fetch_and_build_ruc.py und build_ruc_bundle.py gehärtet: GRIB-Edition 2 und WMO-Ursprungszentrum 78 (DWD/Offenbach) aus der tatsächlichen Nachricht prüfen, Herkunft und Initialisierung der dynamischen deterministischen, Rapid-, optionalen und Ensemble-Felder sowie deren Gültigkeitszeiten kontrollieren. Innerhalb jedes logischen Produktparameters bleiben GRIB discipline/parameterCategory/parameterNumber/typeOfLevel/level/gridType/numberOfPoints invariant; doppelte Rapid-Zeiten oder EPS-Member-Zeitpaare werden abgewiesen. Koordinaten-GRIBs prüfen Edition und Zentrum, bleiben aber aufgrund ihrer Zeitunabhängigkeit von der strikten Run-Initialisierung ausgenommen.

Neue ecCodes-Positiv-/Negativtests in tools/ruc/test_grib_metadata.py sind im bereits verbindlichen Source-PR-Python-Testpfad aufgenommen. Die meteorologischen Plausibilitäts-, Taupunkt- und Niederschlagsakkumulationsprüfungen von v0.9.85.208 bleiben vollständig erhalten. Kein Parameter darf allein aufgrund des Dateinamens als fachlich richtig gelten. Weiter offen bleiben produktfeste shortName-/Level-Abbildungen nach vollständiger Verifikation echter DWD-v1-Produktheader: die jetzige Signaturprüfung erkennt innerhalb eines Produkts gemischte Felder, aber keine vollständig gleichförmig falsch etikettierte Produktfolge. Kein Sicherheits-/Workflow-/Secret-Umbau und keine neuen Kosten.

Quellen: WMO Manual on Codes 306 (gültig 01.06.2026) https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-information-system-wis/about-manual-codes-volume-i2/latest-version ; DWD GRIB2 https://www.dwd.de/DE/leistungen/opendata/help/modelle/grib2_erlaeuterungen.pdf?__blob=publicationFile&v=1 ; DWD ICON-D2-RUC v1 https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ . Freigabe ausschließlich über Source-PR-Gate, Agent-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.208 · Intensivaudit – DWD/RUC-Integrität (Schritt 2)

Verifizierte Basis main = mid-stable: 2f3cd42a56fbf6625a901d68329d388889350754 / v0.9.85.207. Neuer fail-closed-Guard in tools/ruc/meteo_integrity.py; GRIB-Datenlauf-Initiierung und doppelte deterministische Gültigkeitszeiten werden im frühzeitigen Core-Coverage-Check geprüft. Vor der verlustbehafteten Serialisierung werden physikalische Grenzen der RUC-Kerndaten und der Taupunkt/Temperatur-Vertrag geprüft. Vor allen kumulativ→Intervall-Umrechnungen werden echte negative Sprünge unter -0,05 mm erkannt, statt wie bisher ohne Befund auf 0 mm gekappt zu werden (Deterministik, Rapid/Phase, EPS). Der numerische Toleranzwert ist ausdrücklich ein MID-Validierungs-Gate und keine amtliche DWD-Warnschwelle. Test: neue Offline-Positiv-/Negativfälle einschließlich extremer gültiger Temperaturen und fehlender Daten in tools/ruc/test_meteo_integrity.py, automatisch zusammen mit dem bereits Source-Gate-pflichtigen tools/ruc/test_fetch_resilience.py. Keine neue Quelle, kein Secret, keine UI-Änderung und keine abgeschwächten Release-Gates.

Offene weitere Schritte des Audits: strikter GRIB-Parameter-/Level-Metadatenvertrag auf Basis real nachgewiesener DWD-Felder, granulare Missing-Data-Quoten, Cross-Model-Prüfung, Performance-Baselines und iOS-Simulator-Smokes. Release ausschließlich nach vollem Source-Gate, Server-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.207 · Intensivaudit – Build-Identität

Intensivaudit-Schritt 1: Der Auditbefund, main/mid-stable seien ungeschützt, war falsch. GitHub bestätigt aktive MID Production Branch Guard, MID Stable Protection mit Pflichtcheck und gesonderte Agent-/Replit-Regeln. Verifizierte Basis: main = mid-stable = 541ba0b77dc932288bf68ab78b0efd7925045a47 (v0.9.85.206). Nach dem Vite-Build erzeugt scripts/write-build-identity.mjs eine dist/mid-build-identity.json mit exakter Quellversion, möglicher Quell-SHA, Build-UTC, Anzahl Dateien und SHA-256 der gebauten Assets. Fehlerhafte Versionen oder fehlende JavaScript-Assets stoppen den Build. Neue Positiv-/Negativregression scripts/test-build-identity-0985207.mjs. Build-Quell-SHA, Release-Packaging-SHA und Stable-Promotion-SHA sind verschiedene vertragskonforme Identitäten und dürfen nicht blind gleichgesetzt werden. Wetter-, Daten-, Release- und Sicherheitsfunktionen bleiben unverändert.

# MID v0.9.85.206

Die 90-Minuten-Kacheln zeigen zusätzlich den Bewölkungswert ihres jeweiligen Zeitschritts. Die Skybar erklärt ihre Schwellen und die breite Nacht-Hinterlegung. Vorhandene Werte unter den Bandschwellen bleiben als solche erkennbar und werden nicht als fehlende Daten bezeichnet.

Fehlende Bewölkungswerte werden in gemeinsamen Wetterzeichen, Periodenmitteln, Wolkenschichten und Kurzfrist-Fallbacks nicht mehr als 0 % ausgewertet. In den 3-Stunden-Details folgen trockene Wetterbeschreibung und Wetterzeichen nun demselben Bewölkungsmittelwert. Das 24-h-Profil besitzt einen korrigierten Erklärungstext und kompakter angeordnete Hinweise auf breiten Bildschirmen. Echte Nullwerte, Bandfarben und meteorologische Schwellen bleiben erhalten.

Verifizierte Basis: main = mid-stable = 5abd95581f254b2612d94612dcab73b6c8ba75ce (.205). Details: docs/implementation/MID_C23_CLOUD_AUDIT_0.9.85.206.md. Synoptikhorizonte und sämtliche Veröffentlichungsgates bleiben erhalten.

# MID v0.9.85.200 · C21

Europäische native Synoptik, 60-kt-Windpfeile, Theta-E-Stufen/RH700-Konturen, budgetabhängige zusätzliche Termine und gepufferte Bildwechsel einschließlich OPERA und 250-m-Radar. Parallele Widget-Korrektur aus .199 erhalten. Details: docs/implementation/MID_C21_SYNOPTIC_BUFFERING_0.9.85.200.md. Bestehende Release-/Datenbudgets unverändert.

# MID v0.9.85.199 · kompakter Kurvenwidget-Kopf

Basis 36110a193328b0e4a5978e742e3768a8fcd9664f (.198). Widget-Präsentation blendet nur die zwei redundanten Unterüberschriften aus; App-Prognose bleibt erhalten. Bestehende Pflichtregression erweitert, keinerlei Wetterlogik-/API-/Sicherheitsänderung. Dokumentation: docs/implementation/MID_C21_CURVE_WIDGET_COMPACT_0.9.85.199.md.

# MID v0.9.85.198 · MID-C21 Karten und RUC-Veröffentlichung

Basis b27bd472e228c59a9cc36e7305307b775623288a (.197). Details: docs/implementation/MID_C21_MAP_RUC_0.9.85.198.md. Bestehende Source-/Installer-Gates bleiben verbindlich.

## MID v0.9.85.197 · 2026-10-08 · MID-C21 Wetterkarte, Synoptik und iPad-Rückkehr

- Basis main = mid-stable = 55bde6e4ed20127a32403c54546379fb6e86943c (.196). SHA-gebundener Replit-Handoff 6e4d3fc39ace83ae17c3b5a71e6ed9c06a902030, Tree ca4fbd13f4b6337262ee854b992ec6b1cad5f847, grün in Run 37694186641. Replit lieferte lokale Vorschläge ohne belastbaren ursprünglichen Git-Commit; ChatGPT rekonstruierte und verifizierte die neun UI-Dateien auf Stable. Zusätzliche UI-QA-Korrektur erhöht nur das innere Browserlimit 480 auf 900 Sekunden bei unveränderten 24 Fällen.
- Current verwendet einen scoped kanonischen CSS-Layer und echte DOM-Reihenfolge Skybar → gemeinsame Temperaturkurve → Zeitachse. UTCI, Werte, Messwertpriorität und Einheiten unverändert. Sichtweite weiterhin über Mehr. Alte .169-Cascade-Golden-Deklarationen bleiben separat geschützt.
- OSM country/admin2 und region/admin4 disjunkt; maritime Polygone ausgeschlossen. Entfernte Boundary-Fallback- und Natural-Earth-Canvas-Doppelgeografie; fünf persistente Touch-Optionen. Untere Vektorkarte zeichnet nur Land/Wasserflächen.
- Immutable RUC-Pages-Pfad wie DWD-Niederschlagssummen: ecCodes prüft alle sieben GRIB-Komponenten (IFS acht inklusive q/T700), Lauf/Termin/Level/Einheit/regular-grid. Downloads parallel, ecCodes durch Lock geschützt. ICON-D2 0,02°, ICON-EU 0,0625°, veröffentlichte GFS/IFS 0,25°-Raster. Neun vollständige Termine je Modell, keine Mischung von Läufen; fehlende Quellen explizit nicht verfügbar.
- Native Contourpy-Konturen aus vollständigen maskierten Rastern, moderate 0,65-Rasterzellen-Glättung, GH500 4 dam schwarz, MSL 4 hPa weiß, RH700 ab 60% blau gestrichelt; echte U/V300-Pfeile. Bitmap-Missing null/transparent. Bilineares Mercator-Theta-E-Rendering mit höherer Pixelauflösung behauptet keine höhere Modellauflösung.
- Bolton-1980-LCL korrigiert im gemeinsamen Theta-E-Erzeuger. Vier unabhängige MetPy-1.7.1-Referenzen: maximal 0,3 K Toleranz für unterschiedliche Bolton-/Ambaum-Sättigungsdampfdruckformeln. Alte inkonsistente Formel wich bei warm-feuchter Luft um mehrere K ab. Keine Änderung am operativen Punkt-Forecast.
- Frontend prüft Indexdigest, Bytes/SHA, sichere Dateinamen, vollständige aktuelle Termine, Einheiten, native Achsen, Masken, Konturlevel und Windvektoren. Höhenlinien allein ohne Theta-E-Probe. Gleiche bereits SHA-geprüfte immutable Zyklen können wiederverwendet werden; neue Zyklen werden zuerst gesucht. Budget unverändert 900 MB.
- iPad: transienter gemeinsamer Drawer-Hook startet geschlossen, schließt bei pagehide/pageshow/visibilitychange und überschreibt keine dauerhafte Inhaltswahl. Alte More-Speicherung behält gültige Inhaltssektion; ungültige fällt auf Current zurück. Deep Links priorisiert.
- Prüfung: 28 echte Current-Browserfälle, vier wiederholte iPad-Chromium-Touchansichten, vollständige 24-Fall-Kartenmatrix und neue wissenschaftliche ecCodes-/Kontur-/MetPy-/Manifest-Regressionen. Physisches iPad/Safari nicht geprüft. Alle bestehenden Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben verbindlich.

## MID v0.9.85.196 · 2026-10-07 · MID-C21 Handoff-Zeitbudget

- Verifizierte Basis: main = mid-stable = cd3f88d3852591a6375fb46701f11708d118b6f1 (.195).
- Handoff Run 37683018228 für Head 3a30e125417d990a3764df73781ca1141426360a brach nach 15 Minuten ab. Bis 900/938 Prüfungen waren null Fehler gemeldet; Build, Dependencies und geschützte Pfade bestanden.
- Ausschließlich das Zeitbudget des vollständigen npm run verify im kanonischen und aktiven read-only Handoff-Gate steigt von 15 auf 25 Minuten; der Jobrahmen bleibt 30 Minuten.
- Keine Prüfungen ausgelassen, keine Schwellen angehoben, keine Tokens/Rechte/Actions-Pins/Releasegrenzen geändert. Die bestehende Collaboration-Regression schützt nun zusätzlich den vollständigen Verify-Aufruf und das Zeitbudget.
- Die UI-Integration bleibt bis zum grünen Handoff getrennt. Danach erneute Prüfung gegen die freigegebene Stable-Basis und normaler Source-/Installer-/Worker-/Pages-/Stable-Pfad.

## MID v0.9.85.188 · 2026-10-07 · Widget-Export auf vier automatische Läufe pro Tag begrenzt

- Basis: main = mid-stable = v0.9.85.187 @ `2a8370734e98f2c9c1d6da30ad30d9ee5a87aa34`.
- Bisher: stündlicher Cron plus automatischer Release-Abschluss-Trigger plus `mid-stable`-Push-Trigger; dadurch konnten zusätzliche bzw. doppelte Renderläufe entstehen.
- Neu: genau ein automatischer Cron `17 0,6,12,18 * * *`, also 00:17/06:17/12:17/18:17 UTC.
- Automatische `workflow_run`- und `mid-stable`-Push-Trigger entfernt.
- `workflow_dispatch` bleibt für bewusste manuelle Diagnose-/Notfallläufe erhalten.
- Aktiver und kanonischer Workflow bleiben bytegleich; Regressionen schützen die Viermal-pro-Tag-Taktung und das Verbot der entfernten Zusatztrigger.
- Widgetprofile, Renderlogik, Datenlogik, Integritätsprüfung und rollierendes Downloadpaket unverändert.
- Source-Gate-Befund: Unified-Map bestand in drei Versuchen jeweils 20/24 reale Browserfälle, bevor das feste 360-s-Unterprozesslimit griff. Testabdeckung/Assertions unverändert; Zeitbudget auf 480 s Unterprozess, 10 min Heavy-Schritt und 15 min Heavy-Job erweitert, damit alle 24 Fälle tatsächlich geprüft werden.

## MID v0.9.85.186 · 2026-10-06 · Karten-Layer

- Native Linien ohne Flächenraster; tatsächliche WMS-Stile, responsive Layer-Auswahl und unabhängige Beobachtungsschalter.
- Nativer Bild-Lifecycle: direkte dekodierte Bilder statt erneutem Data-URL-fetch; verspätete Bilder nach Layer-Abwahl werden verworfen.
- Paralleländerungen .181–.185 erhalten; DNS-Token-Regression wartungsversionstauglich bei unveränderten Gate-/Least-Privilege-Prüfungen.

## MID v0.9.85.185 · 2026-10-06 · DNS- und Worker-Berechtigungen strikt getrennt

- Basis: main v0.9.85.184 @ `d35659371f48099676409f93add33c4599bf07ec`; mid-stable weiterhin v0.9.85.182 @ `34d41442de1bb8e984dedca0e786dabb5b9f5ee1`.
- Installer Run `37489510896`, Versuch 2: Worker v0.9.85.184 bestand Versionsoverride-Smoke und produktiven Smoke; der DNS-Schritt erhielt erneut HTTP 403 und rollte den Worker danach korrekt zurück.
- Ursache im Workflow: Der DNS-Proxy-Schritt verwendete noch `secrets.CLOUDFLARE_API_TOKEN` statt des separat vorgesehenen DNS-Credentials.
- Korrektur: ausschließlich der DNS-Proxy-Schritt liest `secrets.CLOUDFLARE_DNS_API_TOKEN`; Worker-Upload, Worker-Promotion und Same-Origin-Route bleiben auf `secrets.CLOUDFLARE_API_TOKEN`.
- Die drei Installer-Spiegel bleiben bytegleich und eine Regression schützt die Credential-Trennung.
- Kein Credential-Fallback, keine Erweiterung des Worker-Tokens und keine meteorologische Fachänderung.

## MID v0.9.85.184 · 2026-10-06 · www.midwx.app für Same-Origin-Workerpfad sicher proxied

- Basis: main v0.9.85.183 @ `61fc2634651b865e571496da6eaf3dd0378c760b`; mid-stable weiterhin v0.9.85.182 @ `34d41442de1bb8e984dedca0e786dabb5b9f5ee1`.
- Befund aus Installer Run `37480541081`: Worker v0.9.85.183 bestand 0-%-Smoke, 100-%-Smoke und RUC ready/fresh; die Workers Route `www.midwx.app/api/mid-worker*` wurde bestätigt, der anschließende Same-Origin-Health-Check erhielt jedoch HTTP 404.
- Ursache: Die Route war vorhanden, aber der bestehende `www.midwx.app`-DNS-Record lief noch nicht durch den Cloudflare-Proxy; deshalb erreichte der Browserpfad weiterhin GitHub Pages statt der Workers Route.
- Neuer fail-closed Schritt `ensure_www_proxy.mjs`: exakt ein bestehender CNAME `www.midwx.app`, keine parallelen A/AAAA-Records, nur `proxied=true` per PATCH. Name, Typ und Zielwert werden vor/nachher verglichen.
- Kein neuer DNS-Record, kein Record-Ersatz, keine TLS-/Zone-Settings-Änderung, keine Änderung anderer DNS-Einträge.
- Reihenfolge: bestehender www-CNAME proxied -> exakte Worker-Route -> Same-Origin-Health/RUC -> Pages -> Stable.
- Benötigte zusätzliche Cloudflare-Berechtigung: Zone:DNS Edit ausschließlich für die Zone `midwx.app`.
- Meteorologische Fachlogik unverändert.

## MID v0.9.85.183 · 2026-10-06 · Corporate-safe Same-Origin Data Plane

- Basis: main = mid-stable = v0.9.85.182 @ `34d41442de1bb8e984dedca0e786dabb5b9f5ee1`.
- Produktives `www.midwx.app` verwendet für Worker-Daten ausschließlich `/api/mid-worker`; Browser-Fallbacks auf externe Worker-Adressen sind dort gesperrt.
- DWD-/EUMETSAT-WMS, RainViewer-Tiles sowie OpenFreeMap-Vektortiles/Glyphen werden über eng validierte MID-Worker-Endpunkte ausgeliefert; kein frei adressierbarer Proxy.
- Cloudflare-Route `www.midwx.app/api/mid-worker*` wird idempotent auf den bestehenden MID-Worker geprüft/angelegt; Konflikte blockieren fail-closed, DNS/TLS/andere Routes bleiben unberührt.
- Same-Origin-Health und bei aktivem RUC zusätzlich RUC-Health sind vor Pages/Stable verpflichtend.
- Neue In-App-Verbindungsdiagnose für Datendienst, Warnungen, RUC-Health, RUC-Lauf und Radar/Satellit.
- Keine Änderung an meteorologischen Schwellen, Warnstufen oder RUC-/Radar-/Satelliten-Fachlogik.

## MID v0.9.85.182 · 2026-10-06 · Widget-Rendering gegen transiente Daten-Timeouts gehärtet

- Basis: main = mid-stable = v0.9.85.181 @ `a855f418c3fa00af40da8ccedcd2b1a7c05b02b9`.
- Reproduzierter Fehler: Widget-Workflow Run `37464695591` erzeugte acht PNGs erfolgreich und scheiterte danach bei `kuerecik-kompakt-5d-light.png` an `Wetterabruf hat das Zeitlimit überschritten`.
- Pro Widgetvariante maximal drei Render-Versuche, Capture-Zeitfenster 180 s, kurzer Backoff und Entfernung partieller Zieldateien vor jedem Retry.
- Der Job-Zeitrahmen steigt kontrolliert von 30 auf 45 Minuten; nach dem dritten Variantenfehler bleibt die gesamte Veröffentlichung fail-closed.
- Regressionstest schützt Retryzahl, Zeitfenster, Cleanup und kanonisch/aktive Workflow-Synchronität.
- Keine Änderung an Meteorologie, Widgetprofilen, Orten, UI, Karten, RUC oder SharePoint-Uploadlogik.

## MID v0.9.85.181 · 2026-10-06 · Widget-Renderer auf GitHub-Linux lauffähig

- Basis: main = mid-stable = v0.9.85.180 @ `3fe968e5127a34d2e820e0d2e367d9cfb388ca35`; keine offenen PRs beim Start.
- Reproduzierter Betriebsfehler: Widget-Workflow Run `37456137572` startete korrekt auf der Stable-Promotion und verifizierte v0.9.85.180 öffentlich gegen mid-stable, scheiterte aber beim ersten PNG an `Edge-Debuggingport wurde nicht bereitgestellt`.
- Ursache: `capture-widget.mjs` erwartete effektiv Windows-Edge; der Ubuntu-GitHub-Runner verwendet Chrome/Chromium.
- Renderer unterstützt jetzt explizites `MID_WIDGET_BROWSER`/`--browser` sowie Edge/Chrome/Chromium auf Windows, macOS und Linux.
- Linux nutzt zusätzlich `--no-sandbox` und `--disable-dev-shm-usage`; Browserstart/-exit wird überwacht und Fehler werden sofort statt erst nach Timeout gemeldet.
- Widget-Workflow führt vor dem Rendern einen fail-closed Chrome/Chromium-Preflight durch und übergibt den gefundenen absoluten Browserpfad.
- Neue Required Regression `test-widget-export-browser-runtime-0985181.mjs` schützt den plattformübergreifenden CDP-Vertrag.
- Keine Änderung an meteorologischer Fachlogik, Widget-Inhalten, Ortsmatrix, Warnungen, RUC, Karten oder Worker-Funktion.

## MID v0.9.85.179 · 2026-10-06 · Widget-Trigger gehärtet

- Basis: main = mid-stable = v0.9.85.178 @ `16c007b264599c7162bd174d03179b2a4363d7e2`.
- Befund nach .178: App-Release vollständig grün, der neu eingeführte Widget-Workflow war jedoch weder nach dem Installer noch beim ersten Stundenfenster als Lauf sichtbar.
- Ergänzt: deterministischer `push`-Trigger auf `mid-stable`.
- Beibehalten: `workflow_run` nach erfolgreichem Installer, stündlicher Cron und manueller Start.
- Neuer Regressionstest `test-widget-export-stable-trigger-0985179.mjs` schützt den Triggervertrag.
- Keine Änderung an Meteorologie, UI, RUC, Workerlogik oder Widgetprofilen.

## MID v0.9.85.178 · 2026-10-06 · Serverautomatisierung der festen Widget-PNGs

- Basis: main = mid-stable = v0.9.85.177 @ `d771d9cfaec65f6c13538a143f2c52b620c997c0`; keine offenen PRs beim Start.
- Neuer kanonischer Workflow `widget-export.yml`: Trigger nach erfolgreichem Installer-Release, stündlich Minute 17 und manuell.
- Render-Job strikt read-only; Checkout ausschließlich `mid-stable`.
- Fail-closed vor Rendering: package.json, MID_BASELINE und public/version.json müssen übereinstimmen; zusätzlich muss `www.midwx.app/version.json` dieselbe Version melden.
- `render-widget-matrix.mjs` bezieht die Matrix ausschließlich aus `src/widgetUrlExports.ts`, erzwingt exakt zwölf Varianten und validiert PNG-Signatur, IHDR-Abmessungen und SHA-256.
- Ergebnis enthält zwölf PNGs, `manifest.json` und `SHA256SUMS.txt`; zusätzlich wird ein reproduzierbares `mid-widget-export-latest.zip` samt eigener SHA-256 erzeugt.
- Actions-Laufartefakte werden 14 Tage aufbewahrt.
- Rollierende Veröffentlichung erfolgt als Prerelease `widget-latest`; Schreibzugriff ausschließlich über den etablierten MID Release Bot mit kurzlebigem `contents: write`-Token.
- Fester Download: `https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip`.
- Neuer `Download-MID-Widgets.ps1`: reine Windows-/PowerShell-Bordmittel, Benutzerverzeichnis als Standardziel, ZIP- und Einzeldateiprüfsummen werden vor Überschreiben validiert.
- Keine Änderung an meteorologischer Prognose-, Warn-, RUC-, Karten-, Worker- oder Widgetdarstellungslogik.

## MID v0.9.85.177 · Atmosphärische Höhengrenzen

Geografisch feste Zellwahl in Höhenabrufen einschließlich Legacy-Pfad; freie Diagnostik ohne Oberflächen-Downscaling und mit Modellgeländehöhe. Unterste Wolkenbasis getrennt von lokaler Wolkenschicht-/Sichtprüfung und lokalem LCL. Fehlende DWD-Eingaben/Profilkoordinaten bleiben unbekannt.

## MID v0.9.85.176

- Bergwetter: getrennte Tagesmaxima für Wind und Böen; fehlende Werte bleiben unbekannt.
- Dezente Wind- und Neuschneefarben in Tages-, Stunden- und Periodenansichten.
- Gleichmäßige Tablet-Spalten für Sonnenstunden; vollständige Wettertexte.
- Gemeinsame Prüfung klar warmer Gefrierregen-Prognosen mit Feuchte; kalte Böden, Beobachtungen und Grenzlagen bleiben geschützt.
- Neuschnee-Methodik transparent: Modell-Schneewasser und feste Anbieterumrechnung, getrennt von der Schneedecke.

## MID v0.9.85.175 · 2026-10-06 · Widget-Exportprofile Malatya, Kürecik und Ämari

- Basis: main v0.9.85.174, Commit c5bcdc09ae97072ec3c6b7c9fca75d8debd248a5; keine offenen PRs und keine Widget-Differenz zu mid-stable v0.9.85.173.
- Feste Exportorte: Malatya, Kürecik und neu Ämari (59,26°N, 24,20°E); Wiesbaden entfällt aus dem kanonischen Batch.
- Kanonische Profile: 7d Kurve = Wind + Niederschlag + Sonne + ECMWF; 5d Kompakt = Wind + ECMWF. Hazards sind in diesen SharePoint-Exports deaktiviert.
- Beide Profile werden in Light und Dark erzeugt: 3 Orte × 2 Profile × 2 Themes = 12 PNGs.
- Sichtbarkeiten werden explizit über die Widget-URL übertragen und können nicht durch lokale Widget-Einstellungen verfälscht werden.
- Alte direkte 5-/7-Tage-Kompakt-/Kurven-URLs bleiben lesbar; außerhalb der neuen kanonischen Profile gilt ihr bisheriges vollständiges Sichtbarkeitsverhalten weiter.
- Der bestehende CDP-Exporter wartet weiterhin auf `midWidgetReady=ready` und erfasst ausschließlich die aktuelle `.weatherwidget`-Fläche von www.midwx.app.
- Keine meteorologische Prognose-, Warn-, RUC-, Karten- oder Worker-Fachlogik geändert.

## MID v0.9.85.174

Nebel-/Dunsttexte bleiben mit den Wetterpiktogrammen konsistent. Bergwetter verwendet vorhandene Modell-Schneefallgrenzen vor der vereinfachten Höhenableitung. Temperatur und Taupunkt erreichen die bestehende Kurzfrist-Phasenprüfung.

## v0.9.85.173 · RUC-Workflow-Koordination

Pages-/Worker-Konvergenz getrennt; Health-only Upstream-Probe; später Snapshot-Guard innerhalb bestehender Pages-Sperre; eindeutige Ergebnis-Summaries. Keine Änderungen an Sperrgruppen, Zeitplänen, fachlichen Daten oder Retry-Budgets.

## MID v0.9.85.172 · 2026-10-05 · Konsolidierung und RUC-Downloadrobustheit

- Stable .170 und vollständig geprüfte .171-Source-Gate-Aufteilung mit RUC-PR #262 zusammengeführt.
- Vier begrenzte Netzwerkversuche; atomare Streambereinigung; frühe GRIB-Gültigkeitsprüfung; Offline-Tests vor RUC-Ingestion.
- Keine meteorologische Fachänderung und kein fachlicher Worker-Deploy erforderlich.
- Release bleibt bis zur erfolgreichen Vorgänger-Promotion gesperrt.

## MID v0.9.85.171 · 2026-10-05 · Heavy-Regressionen im Source-Gate isoliert parallelisiert

- Vollständiges automatisch entdecktes Testinventar bleibt erhalten und wird exakt einmal auf Core + drei Heavy-Shards verteilt.
- Native-Map-, Unified-Map- und Berg-Visual-QA laufen in eigenen GitHub-Runnern auf demselben PR-Merge-SHA mit eigenem Produktionsbuild.
- Der bestehende Required-Check ist ein fail-closed Abschlussjob; nur Core + vollständige Heavy-Matrix gemeinsam können die Freigabe erteilen.
- Installer und Deployment-Gates bleiben in diesem Build unverändert.
- Keine meteorologische Fachlogik, UI-Funktion oder Sicherheitsregel verändert.

## MID v0.9.85.170 · 2026-10-05 · Widget/Bergwetter und CSS-Konsolidierung

- Basis main = mid-stable = 9b917ed7054903df6da983ed79fe20561af45ab9 (.169).
- 74 Bergwetter-, 7 Widget- und 36 gemeinsame Darstellungsdeklarationen aus App.tsx ausgelagert; 117 Definitionen byteidentisch zur .169-Basis.
- Lokale Suspense-Adapter und typisierte Props; Memo-, Standort-, Abbruch-, Persistenz- und Widget-URL-Verträge bleiben bestehen.
- 65 geordnete CSS-Quellen mit rekursiv aufgelöstem Import werden zu einer globalen Ausgabe. 1122 frühere identische Deklarationen konsolidiert; Selektoren, Werte, Importance, Bedingungen und Kaskadenreihenfolge erhalten.
- Statische Feature- und CSS-Ladereihenfolgetests lesen die kanonischen Modul-/Manifestquellen; fachliche Assertions bleiben erhalten. Neue Integritäts-, Lazy- und Browserprüfungen ergänzen die Suite.
- PostCSS 8.5.28 als bereits vorhandene Vite-Parser-Version direkt und exakt für den Aggregate-Builder deklariert; keine Laufzeit- oder Framework-Upgrades.
- App-/Wetterkern als unverändert eager geladenes index-Bundle; WidgetGenerator und MountainWeather bleiben separate Lazy-Chunks. Haupt-JS-Budget zählt nun sämtliche index-Chunks, Grenzen unverändert.

## MID v0.9.85.169 · 2026-10-05 · Schonende Wartung und bessere Touch-Bedienung

- Basis main = mid-stable = 9fc04b670047ebe00f61ef4e6e376e4a69972b55 (v0.9.85.168); Releasepfad-Beschleunigung, gemeinsame Karte und geschützte Altmodule erhalten.
- Nur unmittelbar aufeinanderfolgende identische Selektoren innerhalb desselben CSS-Kontexts zusammengeführt; Deklarationsreihenfolge bleibt identisch.
- AppleWidgetSettings und DashboardModuleSettingsPanel mit lokalen Suspense-Grenzen lazy geladen; Typimporte bleiben ohne Laufzeitkante.
- Capacitor Core/iOS/CLI 8.5.2, Share 8.0.2 und jsfive 0.4.2; keine Major-/Framework-Updates oder Security-Overrides.
- Statische Apple-Widget-Importprüfung an beauftragte Lazy-Architektur angepasst; Rendering-/Feed-/Native-Verträge unverändert.

## MID v0.9.85.168 · 2026-10-05 · Releasepfad ohne Gate-Abstriche beschleunigt

- Vollständige Regression-Suite bleibt erhalten; konservativ read-only erkannte Tests laufen mit begrenzter Parallelität, alle risikobehafteten Tests seriell.
- Gate/Auto-Release/Installer verwenden flache Snapshots; nur ein echter main-Race lädt im Installer die vollständige Historie nach.
- Pages-Artefakt wird parallel zum Worker-Gate vorbereitet; Veröffentlichung selbst bleibt strikt nach grünem Worker-Gate.
- Stable-Promotion verwendet SHA-genaue GitHub Compare/Refs-API, `force=false` und finale Ref-Verifikation statt eines vollständigen Git-Checkouts.
- Keine meteorologische Fachlogik, UI-Funktion oder Sicherheitsfreigabe wurde reduziert.

## MID v0.9.85.167 · 2026-10-05 · MID-C17 gemeinsame Wetterkarte

- Basis main = mid-stable = a40e2fbc12ea4c24b206e4904c3f03a3293fadc6 (.166); keine Replit-, Workflow- oder Governance-Änderung.
- Ein lazy/memoisiertes MapWorkspace mit unabhängigen Rasterlayern; shared MapLibre lässt optionale leere Stilfelder weg und bündelt Canvas-Repaints ohne Render-Starvation.
- Native Felder behalten SHA256-, Größen-, Lauf-, Raster- und Einheitenschutz. Summen werden auf Anfrage validiert; WMS nur aus freigegebenem Katalog mit bestätigtem Termin, Lauf und Druckfläche.
- Historische Trennungs-/Importassertionen werden durch Ein-Karten-Verträge ersetzt; numerische, Export- und Zeitwahrheitsprüfungen bleiben erhalten. Neue Pflichtregression mit zwölf echten Browser-Viewport-/Themefällen.

## MID v0.9.85.155 · 2026-10-03 · Reale ICON-EPS-Mitglieder für Tag 3–7

- Live nachgewiesen: HTTP 200 ist kein Nachweis auswertbarer Daten. Globales Mean-Modell liefert rain_spread, gust/spread und snowfall_spread vollständig null. Seamless-Mean liefert ebenfalls keinen rain_spread.
- Kanonischer Worker-/Browserpfad fordert 40 tatsächliche ICON-EPS-Seamless-Mitglieder an; Mittel und Populationsstreuung werden nur aus mindestens 32 endlichen Mitgliedern berechnet. Keine Übernahme von null als Nullwert.
- Tagesperioden bleiben erhalten, wenn mindestens eine Wettergefahr mindestens 65 % des Rasters vollständig abdeckt. Jede Gefahr erfordert separat denselben vollständigen 24-h-/Rastervertrag. Fehlende Böen werden ausdrücklich als Datenlücke dargestellt; Karte und Entwarnung sind dann ausgeblendet.
- Historische .151/.154-Regressionen an bewusst korrigierten Request-/Fixturevertrag angepasst; alle Schwellen-, Cache-, Abbruch-, Provenienz- und Fehlerassertionen erhalten. .154-Versionprüfung gilt ab ihrer Einführung auch für Wartungsreleases.
- Neue Regression mit realer API-Antwort als Fixture sowie Mitgliedsminimum und fehlenden Zeitfenstern. Keine CI-/Releasekonfiguration geändert.

## MID v0.9.85.154 · 2026-10-03 · Extremwetter-Langfristpfad gegen API-Tageslimit gehärtet

- Live-Reproduktion des Screenshots: produktiver `dach-extreme-outlook?range=extended`-Pfad lieferte HTTP 502 mit `Daily API request limit exceeded`; die verwendete ICON-EPS-Mean-Anfrage selbst wurde separat mit HTTP 200 verifiziert.
- Worker bleibt der bevorzugte Datenweg. Bei Worker-/Open-Meteo-Ausfall nutzt Tag 3–7 nun dieselbe kanonische `dachExtendedExtremeOutlookData`-Logik als Browser-Direktpfad.
- Separater persistenter Langfristcache: 3 h frisch, bis 24 h als Stale-Fallback. Ein erkanntes zentrales Tageslimit wird bis zum nächsten UTC-Tag gemerkt, um Wiederholungsfehler zu vermeiden.
- Worker-Fachcache und Cloudflare-Upstreamcache für die ICON-EPS-Langfristfelder auf 6 h angehoben; die DWD-ICON-EPS-Schwellen-, Zeitfenster- und Gefahrenlogik bleibt unverändert.
- Neue Regression `scripts/test-extreme-outlook-extended-resilience-0985154.mjs` prüft Quell-/Aggregatgleichheit, Cachevertrag, Fallback-Reihenfolge sowie die vollständige direkte Tag-3–7-Berechnung mit 169 Stunden Mean/Spread.

## MID v0.9.85.153 · 2026-10-03 · Warnungsseite und Extremwetter-Langfristpfad

- Verifizierte Basis: `main == mid-stable == 1cceaf812fa1491c687d8552a69762a1d263bdb3` (v0.9.85.152).
- Warnzentrum: redundanten, großflächigen Warnhorizont-Absatz entfernt; vorhandene Warn-/Hinweisstruktur unverändert.
- Extremwetter: Range-Router korrigiert (`u.searchParams` statt nicht definiertem `url`); produktive Worker-Aggregate aus den kanonischen Worker-Fragmenten neu erzeugt.
- Erweiterter Bereich maskiert interne Laufzeitfehler und liefert bei echtem Ausfall nur eine nutzergeeignete Meldung. Abbruchsemantik bleibt erhalten.
- Neue Regression: `scripts/test-warning-extreme-regression-0985153.mjs`; Schwellen, meteorologische Logik und Warnklassifikation unverändert.

## MID v0.9.85.152 · 2026-10-03 · MID-C13 Skybar-Intervallkonsistenz

- Basis main = mid-stable = d6d7e0e5d5f6fb20a0e3dbaaf2351ed93c1857bc. Kontinuierliche 24h-Skybar erhält dieselben Viertelstunden wie 90 min; stündliche Diagramme/Quadrate bleiben.
- Null-/Leerzustände sind keine Nullwerte. Ausführbare Regression prüft Farben/Dicken und echte Nullwerte; historische Stundentokenassertion an explizit geänderten Streifenvertrag angepasst.
- Replit-Bestandsabfrage Timeout; kein ungeprüfter Import. Keine Änderungen an Schwellen, Kalibrierung, CI oder Worker-Fachlogik.

## MID v0.9.85.151 · 2026-10-03 · Gestaffelte Warnhorizonte und regionaler Langfristausblick

- Basis main = mid-stable = 0d9205720c177243a2dec3f4f8169216cc620162 (.150); keine Überschneidung mit offener Agent-PR.
- Gemeinsame Vorlaufbezeichnung für Warnzentrum, Tagesansichten und Ensemble; bestehender Stundenauflösungs-Schutz bleibt erhalten.
- Separater Worker-Langfristcache und grobes Raster; Regen/Schnee ausschließlich vollständige 24-h-Summen. EPS-Prozentwerte unkalibrierte Näherungen. Keine langfristige Konvektions-/Eisregendiagnostik.
- Neue Laufzeitregression prüft 48–168 h, Schwellenfenster, Herkunft und Fehlerzustand bei fehlenden Feldern. Historische 24-h-Erwartungen bewusst auf neuen beauftragten Vertrag angepasst.

# v0.9.85.150 · iOS Bottom-Bar-Verankerung

Aus veröffentlichter .149, e6386ca6ed8fbab563261e7b78a96ea15e015c17. Narrow-iOS-Dokumentanker hält die bestehende Body-Portal-Navigation am sichtbaren unteren Rand; stale VisualViewport.offsetTop wird geometrisch begrenzt. Safe-Area und Desktop-/Tablet-Regeln unverändert. Browsermatrix ergänzt echten Bottom-Gap sowie Scroll-/Resize-/Keyboard-Rückkehr. Keine meteorologische Logik oder empirische Kalibrierung verändert. Details: docs/implementation/MID_BOTTOM_BAR_ANCHOR_0.9.85.150.md.

# v0.9.85.149 · Runde Kartenskalen und temporäre Ortswerte

Verifizierte .148-Basis c578a947e02a6d06638870d5d762c16ecb9be8bf. Runde Grenzen in der ausgewählten Einheit, gemeinsam für Raster/Legende/Export. Temporäre geografische Portal-Abfrage schließt nach sechs Sekunden oder bewusster Außen-/Karteninteraktion; keine dauerhaften Ortswert-Popups. Favoritenzustand und Exportfortschritt vereinheitlicht. Details: docs/implementation/MID_MODEL_MAP_PROBE_0.9.85.149.md.

## v0.9.85.148 · MID-C12 Modellkarten-Einheiten und Wertebereich

- Verifizierte Ausgangsbasis .147: main = mid-stable = e28fdd42a3e68decf4b2671d3cd71751a3e711af. Paralleländerungen .146/.147 erhalten; Abhängigkeiten, Budgets, CI- und Datenpublikationsregeln unverändert.
- Unveröffentlichte .148-Parallelarbeit e3d9f7ac2567b66bfbd0f769ffc5fa5d415eb5fb abgeglichen: begonnene Einheitenweitergabe vollständig zusammengeführt, Navigation-Portal erhalten und mit neutralem Namespace-Wrapper für bisherige mobile/Desktop-Stile sowie Forecast-Höhenmessung abgesichert. Ursprünglicher Branch bleibt unangetastet.
- Eine kanonische Windumrechnung für Karten, Favoriten, Popups, Legenden und PNG/SVG; Rohfelder bleiben unverändert km/h. Nicht unterstützte Roh-Einheiten werden abgewiesen.
- Ein gemeinsamer kontinuierlicher sRGB-Farbkern für Raster/Legenden/Exports. Relative Wertebereichsskala erfasst alle gültigen Feldextrema ohne Quantilabschneidung; feste Skala für Vergleiche und Animation. Konstante Felder ohne künstlichen Kontrast.
- Kategoriale Wettercodes unverändert diskret; trockene Niederschlagszellen transparent, fehlende RADOLAN-Zellen grau. Originale WMS-Bilder behalten ihre Anbieterpalette; standardisierte Windfiedern erhalten umgerechnete Erklärung.
- Bestehende Pflichtregression um vier Windeinheiten, Skalen-/Exportgleichheit, kontinuierliche Anker und responsive echte Kartenansichten erweitert. Der bestehende Summen-Testloader bündelt die neue Modulabhängigkeit statt einer isolierten data:-Transpilation; sämtliche fachlichen Assertions bleiben erhalten.
- Ungültige Replit-Dormant-Testausnahme nicht übernommen, kein unfreigegebener Handoff promoted. Legende eigenständig im Trusted-Branch fertiggestellt; originale Architekturprüfung bleibt unverändert. Neue Sichtbarkeitsprüfung erfasst auch übergeordnete Paint-/Overflow-Grenzen, nicht nur Elementgeometrie.

## v0.9.85.145 · MID-C12 Unterscheidbare Prognoseansichten

Basis .144, main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91. Nutzerkorrektur: Spurenmengen ohne Abschneiden, keine Quantil-Kürzel vor sichtbaren Werten, 7d mit gemeinsamem Tmin/Tmax, 14d mit eigener Ensemble-Hierarchie. Meteorologische Werte und Median-/Quantilverträge bleiben erhalten. UI-Handoff ccb4800f3d015313dcf3224270dc934f4f640140 auf exakter Stable-Basis und read-only Gate 37030686168 verifiziert: Build/Types, 899 Regressionen, unveränderte Budgets und Web-/iOS-Hülle grün. Vollständige 96 Kartenfälle mit sichtbaren Tmin/Tmax-Feldern und unbeschnittenen Spurenwerten sind zusätzlich in der Source-Freigabe verpflichtend; Zusätzliche vollständige Source-Prüfung fand abgeschnittenes Temperaturfeld bei 1024 px und diagnostizierte eine nur 25 px breite Tageskarte durch geerbte klassische Rasterplatzierung; moderne Tablet-Zeilen setzen Spalte/Zeile explizit zurück, Temperaturspalte im Integrationsstand auf 114 px berichtigt und Beschriftungen im bestehenden Zahlen-Badge oberhalb der Werte angeordnet, mit natürlicher Badge-Größe und unverändert strengen Sichtbarkeits-/Budgetprüfungen. Details im Implementierungsbeleg.

## MID v0.9.85.144 · 2026-10-02 · Wochenunsicherheit, Trend und Karten

- Tatsächliche stündliche P25/P50/P75-Mitgliederquantile in bestehendem Ensemblebundle; eigenständige Familien-/Frischegewichtung, keine Pseudomitglieder oder Extrapolation, Cachegeneration v18.
- Wetterabschnittsauswahl erhält Niederschlagsbeginn trotz reserviertem Nacht-/Hazardsatz; ausführbare Mittwoch-/Donnerstag-Fixture.
- GRIB-RELHUM-Supersättigung getrennt von CLCT-Grenzen; echter GRIB-Regressionsnachweis und 48 Live-Kartenfelder erfolgreich.
- WMS-Terminwahl berücksichtigt das vollständige Akkumulationsfenster des gewählten Modelllaufs.
- Replit-UI-Handoff für kompakte numerische P25–P75-Grenzen; Integration SHA-verifiziert vor Release.
- 899 CI-Regressionen; zusätzliche responsive Wochenband-/Balkenprüfung, aktuelle DWD-Katalog-/PNG-Verifikation.

## MID v0.9.85.143 · 2026-10-02 · MID-C11 kompakte Unsicherheit

- Basis .142 4282232533fc70545d9b64676a9de1b4839f1b2e. Kein überlappender Produkt-PR.
- Kurze Tmax/Tmin/Regen/Böen-Bänder, echte gewichtete P50-Marker, keine Mittelwindzeile. Fehlende P50 nicht ersetzt.
- Echte stündliche P25–P75-Polygone nur im vorhandenen Warnungsensemble-Horizont. Kein künstlicher Halo und keine Tagesquantil-Interpolation. Historische Halo-Tokenprüfung absichtlich migriert.
- Umsetzung und Quellen: docs/implementation/MID_COMPACT_UNCERTAINTY_0.9.85.143.md.

## MID v0.9.85.142 · 2026-10-02 · MID-C11 Verlustfreies Kartenbudget

- Basis: vollständig veröffentlichte .141, main = mid-stable = ff2e310d107a745468d788fcec678693d507a68d.
- Live-Snapshot belegt bereits ca. 864,4 MB; unkomprimierte neue Raster würden das bestehende 900-MB-Budget überschreiten. Native Feldobjekte deshalb gzip-JSON in immutable .bin-Objekten, ca. 5,8 MB statt 39,5 MB; keine Auflösungs-/Wertreduktion.
- SHA256/Bytezahl vor Inflation, deklarierte entpackte Größe mit laufender Obergrenze; Legacy-JSON bleibt lesbar. Stream-Decoder bevorzugt, vorhandenes pako 2.2.0 explizit gepinnt als Lazy-Fallback für ältere Safari/WebViews.
- Pflichtregressionen um native/fallback gzip-, Größen-, Truncation- und Hash-Prüfungen erweitert. Browser prüft komprimierte Niederschlags- und Legacy-Temperaturfelder sowie PNG/SVG.
- Lokale Typ-, Decoder-/Python- und Browserprüfungen bestanden. Vollständige Suite bis mindestens 500/898 ohne Fehler protokolliert; lokale Ausführungsumgebung beim Abschluss ausgefallen. Verbindliches Source-PR-Gate muss den vollständigen Stand vor Veröffentlichung erneut prüfen.

## MID v0.9.85.141 · 2026-10-02 · MID-C11 Adaptive Prognosen und native Karten

- Basis main/mid-stable 87875585c773edf5fcb508cbe3466c7f98c08481, keine überlappende Produkt-PR.
- Parameterunabhängige Tages-Quantilbänder, kanonische Windumrechnung, echte Null kompakt ohne Spurenwerte zu nullen; Kurzfristgrenzen explizit.
- RADOLAN RW :50-Stunden ohne Rollingsummen-Doppelzählung; fehlende Zellen bleiben -1/grau, fehlende Stunden sperren Fenster.
- Acht native ICON-D2-Felder × sechs verifizierte Termine, nur gewähltes SHA256-geprüftes Raster im Browser. Gleiche Karten-/Favoriten-/Downloadergonomie; Bestandsschutz anderer WMS-Modelle.
- Neue Inhalte über bestehendes immutable Pages-Objektmanifest und unverändertes kostenloses Budget, keine neue API-/Schlüssel-/Bezahlabhängigkeit.
- 898 Pflichtregressionen, zusätzliche Python-Decoder-/Publikationstests und Browser-QA. Zwei historische Testauslese-/Formatverträge bewusst auf neue Typstruktur bzw. kompakte Zahlendarstellung migriert, meteorologische Assertions erhalten.
- Einzelheiten und Grenzen: docs/implementation/MID_ADAPTIVE_NATIVE_MAPS_0.9.85.141.md.

## MID v0.9.85.140 · 2026-10-01 · MID-C11 Radar kompakt

- Ursache der leeren Pille: globale `.top`-Headerregeln auf `.radar-nowcast-grid.top`; Gridlines explizit auf Höhe 0 und transparenten Hintergrund zurückgesetzt, Browsertest prüft diese Geometrie.
- Bright-Sky-Livekennung `RADARCOMP::RV` zusätzlich zur historischen `RADOLAN::RV` akzeptiert; Liveabruf Berlin liefert 24/24 verfügbare Prognoseschritte.
- Chart mit eigener ID gegen alte Layoutregeln isoliert; Summenpille entfernt, Phasentext verkürzt.
- Vollständige native RV-Reihen im schnellen und ausführlichen Pfad unmittelbar nutzen; keine WMS-Abhängigkeit für deren Mengen.
- Native Kontrollbeobachtung darf RV-Zeitschritte und Referenzzeit nicht ersetzen. Kein Auffüllen fehlender Werte mit Null.
- Browserfixture um tatsächliches CurrentNowcards-Umfeld erweitert. Historischer Wortlauttest auf ausdrücklich gewünschten kompakten Phasenvertrag aktualisiert.

# MID v0.9.85.139

## Radar-Nowcast und sichtbare Vorhersagespannen

- Radar-Balken und der unsichtbare Auswahlanker sind Grafikmarkierungen statt Buttons. Globale Touch-Mindesthöhen können Mengenunterschiede nicht mehr verdecken. Die gesamte Zeitachse bleibt per Berührung und Tastatur bedienbar.
- Ein kompakter nativer DWD-RV-Abruf über Bright Sky liefert Fünfminutenwerte ohne Ausdünnung. Einheiten, Referenzlauf, Aktualität und fehlende Werte werden geprüft; der direkte DWD-Pfad bleibt als Reserve erhalten. Fehlende Daten werden nicht interpoliert oder als trocken bilanziert.
- Summen, Hinweise, Achsen und Jetzt-Markierung erhalten ein abschließendes, eng begrenztes Layout. Auswahlanker werden auf einen unsichtbaren Pixel begrenzt.
- 7- und 14-Tage-Übersichten zeigen verfügbare P10–P90-Modellspannen für Tageshöchsttemperatur und Niederschlag. Das Temperaturband markiert zusätzlich P25–P75 und den angezeigten Wert auf einer gemeinsamen Skala. Fehlende Ensemblewerte erzeugen keine erfundenen Spannen.
- Eine aufklappbare Erklärung trennt Modellübereinstimmung von Trefferwahrscheinlichkeit und erläutert den zunehmenden Stellenwert von Tendenzen.

## Prüfung

- Basis: `main == mid-stable == 72c19e18f48cc9997d3ad65c69e3b00d8d723bf4` (v0.9.85.138).
- Neue Pflichtregression prüft native Einheiten, 24 Prognoseintervalle, Summen, Referenzläufe, fehlende/veraltete Werte und echte Mengenunterschiede.
- Im CI werden zusätzlich echte Browserprüfungen mit vollständiger CSS-Kaskade auf sechs Displaygrößen in Hell und Dunkel ausgeführt.
- UTCI-, Quellen-, Niederschlagsintervall- und gemeinsame Modellkartenänderungen aus .138 bleiben erhalten.

Native Quelle: https://github.com/jdemaeyer/brightsky/issues/144 und https://github.com/jdemaeyer/brightsky/blob/master/brightsky/query.py. Pixelwerte sind 0,01 mm/5 min; Prognosen werden nur aus dem neuesten frischen RV-Referenzlauf übernommen. Die verwendete öffentliche API benötigt keinen kostenpflichtigen Schlüssel. DWD-Daten und Bright-Sky-Bereitstellung werden in der Herkunft getrennt angegeben.

# MID v0.9.85.138

## Radarintensität, konsistente Niederschlagsstufen und UTCI appweit

- Die 5-Minuten-Balken des Radar-Nowcasts folgen jetzt der tatsächlichen DWD-RV-Intensität des jeweiligen Zeitschritts. Unterschiedlich starker Niederschlag wird deshalb wieder durch unterschiedlich hohe Balken sichtbar; Datenlücken bleiben ausdrücklich schraffiert und werden nicht als trocken interpretiert.
- Die Radar-y-Achse zeigt Maximum, halbe Skala und Null gleichmäßig am selben Raster wie die Balken. Die Einheit bleibt fachlich eindeutig mm/5 min.
- Niederschlagsangaben verwenden appweit dieselbe zentrale WMO-/DWD-basierte Intensitätsklassifikation. Angezeigte Rate und Textstufe stammen aus demselben Intervall; 1,9 mm/h Dauerregen wird beispielsweise als „mäßig“ eingeordnet.
- UTCI (Universal Thermal Climate Index) ist nun der kanonische Index für die gefühlte Außentemperatur in Aktuell, Kurzfrist, 24-h-Profil/Cockpit, Event- und Wassersportansichten sowie Bergwetter. Temperatur, Feuchte, Wind und Strahlungseinfluss werden gemeinsam berücksichtigt; die sichtbaren Belastungsstufen folgen den Standard-UTCI-Klassen.
- Wo keine direkte mittlere Strahlungstemperatur verfügbar ist, schätzt MID sie transparent aus Tageszeit, Bewölkung, UVI und Höhe. Unbrauchbare Eingangsdaten erzeugen keinen erfundenen UTCI-Wert.

## Technischer Nachweis

- Verifizierte Basis: `main == mid-stable == b013e6664966111fa2c466ba8cabb3520421b435` (v0.9.85.137).
- Radar-Grafik: visuelle Zeitschrittmenge = native Rate × 5/60; Summen-/Coverage-Vertrag bleibt davon getrennt.
- Aktuell-Niederschlag: zentraler Deskriptor hat für die sichtbare Rate Vorrang vor einem separaten Beobachtungslabel; Phasen- und WMO-/DWD-Code bleiben Eingaben der zentralen Klassifikation.
- UTCI: kanonische stündliche Neuberechnung erfolgt nach appweiten Forecast-Korrekturen. Provider-`apparent_temperature` ist nicht mehr die sichtbare fachliche Endgröße der betroffenen Module.
- Fokusregression: `scripts/test-radar-utci-consistency-0985138.mjs`; vollständige Suite und Build laufen im Source-PR-Gate.

# MID v0.9.85.137

## DWD-Radar im Fünfminutentakt und gemeinsame Modellkarten

- DWD GetFeatureInfo wertet RV_ANALYSIS, RV_FORECAST und RV_PREDICTION als native mm/5 min aus und normalisiert korrekt nach mm/h. Die bisher nicht erkannten numerischen Bandwerte verursachten Lücken zwischen den ausgedünnten Kartenbildern. Der bestehende kostenlose DWD-Pfad bleibt erhalten.
- Native Fünfminutenintervalle erhalten explizite Start-/Endzeiten. Die Forecast-Fusion zählt bei 15 Minuten genau drei native Intervalle. Lücken werden weder verbreitert noch als trocken interpretiert oder über RS-Mengenanker aufgefüllt.
- Die sichtbare Summe verwendet die tatsächlich verfügbaren zentralen, final kalibrierten Mengen eines ausdrücklich angegebenen 120-Minuten-Fensters. Nur 24 gültige Schritte ergeben eine vollständige Zweistundensumme und Ensemble-Spanne; ansonsten stehen Teilsumme, auswertbare Minuten und Datenlückenhinweis im Vordergrund. Frühere Summen bei Lücken sind nicht als vollständige Zweistundensummen belastbar.
- Unter Karte bleiben zwei Einstiege: Radar/Satellit/Blitz und Modellkarten. Niederschlagssummen sind ein ICON-D2-Kartenprodukt innerhalb der gemeinsamen, nach Wetterparameter gruppierten Auswahl. Alte Summen-Einstiege und gespeicherte Auswahl werden migriert; Favoriten, Zeitfenster und PNG-/SVG-Downloads bleiben erhalten.
- Kostenlose Natural-Earth-Grenzen (Public Domain) liegen über sämtlichen Modellfeldern. Ländergrenzen immer, Bundesländer ab Zoom 4,8 und kollisionsgeprüfte Ortsnamen ab Zoom 5,7. Bundeslandgrenzen sind auch im PNG-/SVG-Export sichtbar. Auf Smartphones sind die Auswahlfelder mindestens 44 px hoch.
- Neue funktionale Regression prüft Datenfeld/Einheit, 37 Fünfminutenabfragen, Intervallgrenzen, vollständige/partielle Mengen, RS-Lückenschutz, Intervallfusion, Navigationmigration und Zoomstufen. Betroffene historische Oberflächentests werden wegen der ausdrücklich gewünschten Zusammenführung und korrigierten Summenbasis angepasst; alle übrigen Assertions bleiben erhalten.

# MID v0.9.85.136

## ICON-D2-Abgrenzung und konsolidierte Regressionen

- Extremwetter-Ausblick: Außenbereich der gekrümmten ICON-D2-Modellabdeckung dunkel eingefärbt; Grenzpolygon entspricht exakt der bestehenden Analyse. Dunkler Bereich in der Kartenlegende erklärt, unabhängig von Hazard-Auswahl, Zeitraum und temporären Datenlücken.
- Alle 894 Regressionen bleiben unverändert wirksam. Automatische Dateierkennung und beide Baseline-Pflichtlisten werden jetzt als vollständige identische Inventare geprüft; fehlende, veraltete und doppelte Registrierungen brechen die Suite ab.
- Ein gemeinsamer Runner meldet Fortschritt, Gesamtdauer und langsamste Prüfungen; Fehler enthalten weiter die vollständige Ausgabe. MID_REGRESSION_VERBOSE=1 zeigt auch erfolgreiche Einzelausgaben. Ausführung bleibt isoliert und seriell, damit gemeinsam verwendete Artefakte keine Rennen verursachen.
- Neue Regression schützt die identische Modellgeometrie sowie positive und negative Fälle der Testregistrierung. Keine bestehenden Assertions entfernt, keine zusätzlichen Kosten oder Datenquellen.

## v0.9.85.133 · 2026-10-01 · Konsistenzfix Radar/Niederschlag/Pollen/Startnavigation

- Verifizierte Ausgangsbasis: `main == mid-stable == 3816a4332f90be6b73fd04b33bfa46e7918ac66b` (v0.9.85.132). Die Nutzer-Screenshots zeigen ausdrücklich noch diesen Stable-Stand.
- DWD-RV: Die vollständige 5-Minuten-Zeitachse wird gegen die tatsächlich verfügbaren RV-Zeitpunkte vervollständigt. Technisch nicht auswertbare GetFeatureInfo-Zeitschritte bleiben explizite Datenlücken (`dataAvailable=false` / `hitClass=missing`) und zählen weder im Renderer noch in der Forecast-Fusion als trockene Evidenz.
- Niederschlagsdauer: `Aktuell` verwendet dieselbe kanonische 24-h-Niederschlagszeitreihe wie die übrigen Prognosedarstellungen und wertet alle relevanten Phasen aus. Wahrscheinlichkeit allein verlängert keine sichtbare Niederschlagsphase.
- Niederschlagsart/-intensität: 15-Minuten-Mengen werden auf die tatsächliche Intervalllänge normiert. Zusätzlich wird eine frische, vertrauenswürdige lokale SYNOP-/METAR-Niederschlagsart kontrolliert in die kanonischen WMO-Prognosecodes übersetzt und mit expliziter Provenienz durch Stunden-, 15-Minuten- und Kurzfristpfad geführt. Nachgelagerte Modell-`rain/showers`-Heuristiken dürfen diese beobachtete Art im unmittelbaren Zeitfenster nicht zurücküberschreiben.
- Lokalitätsgrenze der beobachteten Niederschlagsart: maximal 40 min alt und maximal 20 km entfernt; die genaue Beobachtungszeit, Entfernung und Quelle werden auch durch die hyperlokale Stationsaggregation erhalten. Diese Grenze ist als MID-Assimilationsregel im Prognosekonsistenzvertrag dokumentiert.
- Pollenflug: Kalender-`Heute` wird vom lokalen Datum abgeleitet, DWD-`EFFECTIVE` als Produktstand ausgewiesen, Worker-Cache verkürzt. Die PWA lädt das Produkt zusätzlich alle 10 min und nach Rückkehr in den Vordergrund neu; ein temporärer Refreshfehler entfernt einen bereits geladenen verwertbaren Produktstand nicht.
- Regression `scripts/test-precipitation-radar-pollen-navigation-0985133.mjs` deckt DWD-RV-Datenlücken, 24-h-Phasen, 15-min-Intensität, beobachteten Schauercharakter, Pollen-Datum/-Refresh und Navigations-Race ab. Der bestehende Hyperlokal-Testharness wurde auf den neuen Beobachtungsvertrag angepasst.
- Worker betroffen: DWD-Radar-Nowcast und DWD-Pollenroute müssen im Release-Gate geprüft/promoviert werden.
- Gesundheitswetter-Platzierung bewusst nicht in diesem funktionalen Patch geändert. Read-only-Replit-IA-Review empfiehlt anschließend `Mehr → Gesundheitswetter` als erweiterbaren Unterbereich; in `Aktuell` höchstens kompakter Tagesstatus/Deep-Link. Umsetzung erst als separater SHA-verifizierter Replit-Handoff auf dem dann freigegebenen Stable-Stand.

## v0.9.85.132 · 2026-10-01 · Niederschlags-Endzeiten appweit vereinheitlicht

- Verifizierte Basis: `main == mid-stable == eb1f8e5bd4dce82a1af18c762a054d5184e51806` (v0.9.85.131), Release- und Stable-Quality jeweils grün.
- Fehlerursache: `precipitationBeyondTwoHours` wertete rohe stündliche Akkumulationswerte aus und addierte auf den letzten nassen Zeitstempel nochmals pauschal eine Stunde. Da die Providerwerte bereits das Ende des vorangegangenen Intervalls markieren, konnte die Aussage bei jedem Stundenwechsel um eine Stunde nach hinten wandern.
- Neue kanonische Funktion: `canonicalPrecipitationTimeline` in `src/precipitationIntervals.ts`.
- Bevorzugte Kurzfristbasis: finalisierte 15-Minuten-Reihe inklusive RUC-/Radar-/Modellfusion; bei unvollständiger Abdeckung vollständiger Fallback auf normalisierte Stundenwerte.
- Sichtbare Dauer wird nur aus messbarem Niederschlag gebildet; Wahrscheinlichkeit allein erzeugt keine künstliche Phase.
- Bestehende `precipitationPresentationHours`/`precipitationPresentationMinutes15` bleiben die gemeinsame Intervallnormalisierung für Aktuell, Prognose, 24-h-Profil und Widgets.
- Regression: `scripts/test-precipitation-timing-consistency-0985132.mjs` schützt insbesondere den früheren +1-h-Endzeitversatz.

## v0.9.85.131 · 2026-10-01 · C11-Kartensteuerung und schneller, korrekter Radar-Nowcast

- Verifizierte Basis: `main == mid-stable == 0daf09160c8f9de514d3fbb3d78c03df275604d1` (v0.9.85.130).
- Verifizierter C11-Replit-Handoff: `37e726c7be865402f4ee348c8b732233e98430fb`, 3 Commits vor Stable und 0 zurück.
- Radar-Preload startet auf normalen Verbindungen nach 20 ms statt 85 ms; Data-Saver/2G bleibt vorsichtiger gestaffelt.
- Der Fast-Path verwendet die bereits geladene DWD-Rasterprobe und vermeidet zusätzliche GetFeatureInfo-Runden pro grobem Schnellzeitschritt.
- Fast-Resultate werden 45 s kurz zwischengespeichert; bei kurzem Upstream-Hänger darf maximal 120 s auf den letzten Fast-Stand zurückgegriffen werden.
- Die vollständige 5-Minuten-Punktserie startet nach dem Fast-Signal nach 40 ms (statt 240 ms) und lädt exakte Punktwerte in 12er- statt 6er-Paketen.
- Fehlerkorrektur: Ausgelassene Fast-Zeitschritte werden nicht länger als künstliche 5-Minuten-Trockenphasen visualisiert. Die periodische Folge „drei Balken, eine Lücke“ war ein Samplingartefakt.
- Echte Trockenphasen des vollständigen DWD-Punktpfads bleiben unverändert erhalten.
- Echo-Gate unverändert: Radar-Nowcast bleibt unter „Aktuell“ verborgen, wenn kein relevantes Standort- oder Umfeldecho vorliegt.
- Regression: `scripts/test-radar-startup-fastpath-0985131.mjs`.

## v0.9.85.130 · 2026-09-30 · Gesundheitswetter sichtbar und Hauptnavigation wiederhergestellt

- Screenshot-Befund reproduziert: `.settings-split-navigation` blendete die gemeinsame Optionssektion vollständig aus; dadurch waren die bereits implementierten Bereiche „Gesundheitswetter“ und „Inhaltsmodule“ unsichtbar.
- CSS-Vertrag korrigiert: Im Navigation-Tab bleiben ausschließlich die navigationseigenen Optionslisten plus Modulreihenfolge sichtbar; Darstellungs-/Wetteroptionen bleiben ausgeblendet.
- Gesundheitswetter steht vor den übrigen optionalen Inhaltsmodulen; Pollenflug bleibt über `mid:pollenDisplaySettings` persistent schaltbar.
- Primärnavigation erhält einen eigenen gerätelokalen Schlüssel für Aktuell / Heute / Vorhersage / Karten / Mehr. Untermodul- und Forecast-Horizon-Zustand bleiben zusätzlich erhalten.
- „Mehr“ kann beim App-Neustart wieder geöffnet werden; bewusstes Schließen stellt den darunter aktiven Hauptbereich als letzten Bereich wieder her.
- Der alte Startpfad entfernt `#mid-section-…` nicht mehr; explizite Deep-Links behalten damit Vorrang.
- Keine Änderung an meteorologischer Logik, Datenquellen, Warnungen oder Worker-Fachlogik.
- CSS-/Budget-Nachgang: Gesundheitswetter und optionale Inhaltsmodule liegen nun als eigene Navigationselemente außerhalb des bewusst ausgeblendeten Darstellungscontainers. Die bestehenden CSS-Splitregeln bleiben unverändert; es entsteht kein zusätzliches CSS-Budget.
- Persistenz-Härtung: Primärbereich dient als Fallback bei fehlendem/ungültigem Modulwert, wird vor Suspend/Schließen erneut gesichert und bleibt gerätelokal.\n- Source-Gate-Nachgang: zwei veraltete Hash-Neutralisierungs-Assertions auf den neuen Deep-Link-Vorrang umgestellt; Pollen-v0.9.85.129-Regressionsvertrag vorwärtskompatibel gemacht.\n- Regression: `scripts/test-health-settings-primary-navigation-0985130.mjs`.

## v0.9.85.129 · 2026-09-30 · Gesundheitswetter/Pollen kompakt

- Reales iPhone-Screenshot-Follow-up: mehrspaltiger Pollen-Kopf entfernt; Region/Quelle/Aktualität als kompakte Metazeile; Defaultzustand auf heutige Relevanz reduziert.
- 3-Tage-Progressive-Disclosure: erste Detailstufe maximal vier relevante Pollenarten, nach höchster 3-Tage-Stufe priorisiert; vollständige 8-Arten-Matrix erst nach explizitem „Alle anzeigen“.
- DWD-Fachkorrektur: siebenstufige Belastungssemantik 0 / 0–1 / 1 / 1–2 / 2 / 2–3 / 3 wird robust aus den gelieferten Text-/Codewerten abgeleitet. „keine bis gering“ ist nicht mehr gleich 0.
- Responsive: keine 420-px-Mindestbreite der Pollentabelle; vier Spalten passen in mobile Karten, Detailblock erhält Bottom-Bar-Scrollabstand.
- DWD-WFS, Regionen, Vorhersagewerte und Worker-Datenlogik bleiben unverändert.
- Replit-Follow-up: zweiter Detailschalter auf ≥44 px angehoben; erste Detailstufe bleibt auch bei acht relevanten Arten auf maximal vier Zeilen begrenzt.
- Source-Gate-Nachgang: CSS-Budget ohne Grenzerhöhung korrigiert; nur nicht notwendige Scrollbar-/Overscroll- und Metazeilen-Deklarationen entfernt.\n- Regression: `scripts/test-pollen-compact-dwd-levels-0985129.mjs`.

## v0.9.85.128 · 2026-09-30 · Screenshot-/Security-Nachgang und Gesundheitswetter

- CodeQL #92–#98: unkontrollierte Textausgabe und dynamische Browser-Testausdrücke entfernt; CDP-Argumente werden strukturiert übergeben und der lokale Chromium-Port wird nicht mehr aus einer Datei in eine Netzwerkadresse übernommen.
- Dependency-Audit: `brace-expansion` lock-only 5.0.9 → 5.0.12; kein `npm audit fix --force` für den getrennten `uuid`-/Capacitor-Tooling-Pfad.
- GitHub Actions: `download-artifact` v4.3.0 → v8.0.1, SHA-gepinnt, kanonischer und aktiver RUC-Workflow identisch.
- Gesundheitswetter: eigener Einstellungsblock; Pollen bleibt gerätelokal optional. Aktive DWD-Pollen werden nach vorhandener Belastungsstufe priorisiert; keine Änderung der DWD-Datenlogik.
- Replit wurde auf Stable v0.9.85.127 synchronisiert und für die Designprüfung eingesetzt; Integration und Release bleiben bei ChatGPT/GitHub.
- Source-Gate-Nachgang: vorbestehenden RUC-Workflow-Drift zugunsten der neueren Release-Race-Sicherung kanonisiert; veraltete Versions-/Action-Assertions aktualisiert; CSS-Budget ohne Grenzerhöhung durch Entfernung ungenutzter Pollen-Legacyregeln korrigiert.
- Required Regression: `scripts/test-security-pollen-maintenance-0985128.mjs`.

## MID v0.9.85.127 · 2026-09-30 · Repository-Hygiene, Versionssynchronisierung und Governance

- Verifizierte Basis: `mid-stable/main 81d2bfb9d872ba97f4e2a3fec82e92a6f8aefab0`.
- PR #208 war funktional bereits integriert, obwohl alle Versionsspiegel auf v0.9.85.126 verblieben; v0.9.85.127 synchronisiert den tatsächlichen Stand.
- Historische, nicht mehr baselinegebundene Root-Dokumente werden nach `docs/` verschoben; eine Regression verhindert neues Root-Wachstum ab diesem Build.
- Branch-Cleanup, Vertragsregistry, KNMI-Workflow-Audit sowie Vitest-/Coverage-Bootstrap werden im selben Wartungsstand regressionsgeschützt.
- Keine Änderung an Wetterdaten, Warnschwellen oder meteorologischer Fachlogik.

## MID v0.9.85.107 · 2026-09-27 · Kompakte Vorhersage- und Bergwetteransichten

- Basis und Source of Truth: mid-stable 17e5fa60e9bee26ec2485a08b33b4ebdc2bfe77e (v0.9.85.106).
- Verifizierter Replit-Handoff: replit/mid-18-2-15-compact-forecast-mountain@59f74d0715e3012ef166030aed21a8718d35ddf8; Handoff-Gate #107 grün mit 873 Regressionen sowie Web-/iOS-Hülle.
- ChatGPT hat den Handoff selektiv in chatgpt/mid-18-2-15-v0985107 integriert und die Diff-Audit-Funde korrigiert: aktive cockpit-fourteen-sun-uvi-Klasse, semantische Schneemengenflächen, kompakte Warn-/Lawinen-/Methodikflächen und bedingungsabhängiger Matrix-Scroll.
- Die Schneemengen-Flächenstaffelung ist reine UI-Skalierung und ausdrücklich keine WMO-/DWD-Warn- oder Intensitätsschwelle.
- MID_CHATGPT_GITHUB_CONTRACT.md wurde auf Source-PR-Gate → kontrollierten Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion umgestellt; ZIP-im-PR ist regressionsgeschützt ausgeschlossen.

## MID v0.9.85.105 · 2026-09-26 · Bergwetter kompakter und schneller

- Finaler Replit-Handoff 9d166f7a083aac991f11856608fa0b93178e6aec aus replit/mid-18-2-14-v0-9-85-105-handoff-20260926 selektiv auf den Stable-Quellstand übernommen.
- Kernprognose und 7-Tage-Werte rendern vor GeoSphere-, Schneefallgrenzen-Ensemble- und Diagnose-Enrichments; Fehler und Verzögerungen der Zusatzdaten bleiben isoliert.
- 872/872 Regressionen, Typecheck und Produktionsbuild grün; 6 Viewports × Light/Dark sowie verzögerte und fehlerhafte Enrichment-Szenarien geprüft.
- Replit-Metadaten, Anhänge und vorgebaute dist-Artefakte wurden nicht in den vertrauenswürdigen Source-Branch übernommen.

## MID v0.9.85.105 · 2026-09-26 · Bergwetter kompakter und progressiv geladen

- Finaler Replit-Handoff `9d166f7a083aac991f11856608fa0b93178e6aec` aus `replit/mid-18-2-14-v0-9-85-105-handoff-20260926` selektiv auf den aktuellen Stable-Quellstand übertragen; Replit-Metadaten, Anhänge und vorgebaute dist-Artefakte wurden nicht übernommen.
- Berg-/Wintersportwetter zeigt Kernprognose und 7-Tage-Werte vor GeoSphere-, Ensemble- und Diagnose-Enrichments; verzögerte oder fehlerhafte Zusatzdaten blockieren die Kernansicht nicht.
- Die Hauptansicht ist weiter verdichtet; redundante Analyse-/Methodikblöcke liegen in kompakten Disclosures. Sonnenstunden und Tages-Max-UVI bleiben in 7-/14-Tage-Zeilen kompakt sichtbar.
- Replit-Abnahme: 872/872 Regressionen, Typecheck und Produktionsbuild grün; reale 6-Viewport-×-Light/Dark-Matrix sowie verzögerte/fehlerhafte Enrichment-Szenarien geprüft.
- Veröffentlichung ausschließlich über Source-PR-Gate → Auto-Merge → Release-ZIP → Installer/Pages → Stable-Promotion.

## MID v0.9.85.104 · 2026-09-26 · Berg-/Wintersportwetter responsiv nachgeschärft

- Finaler Replit-Handoff fe80b066739f40b1ede633a1124b3f18d9d366b4 wurde als Remote-Snapshot 155cd7aa11915cdc60229bd1b380d35a9939cd33 verifiziert und selektiv auf den aktuellen Stable-Quellstand übertragen.
- Neue Format- und Schneeabdeckungsregressionen schützen 0 cm, Spurenmengen unter 1 cm und fehlende Daten.
- Die Bergwetter-Visualmatrix prüft iPhone schmal/breit, Android-Breite, iPad hoch/quer und Desktop in Light/Dark sowie Expand/Collapse.
- Meteorologische Datenlogik, Einheitenwahl und Worker-Fachlogik bleiben unverändert.

## MID v0.9.85.103 · 2026-09-25 · Berg-/Wintersportwetter neu strukturiert

- Höhenprognose auf 168 Stunden erweitert; Tagesaggregate stammen aus derselben Höhenzeitreihe wie die geöffneten Details.
- Punktwerte und Intervallsummen bleiben fachlich getrennt; Missing-Snow-Fenster liefern NaN statt künstlichem Nullwert.
- Neue Regression scripts/test-mountain-seven-day-domain-1813.mjs schützt 7-Tage-, Höhen-, Niederschlags- und Schnee-Verträge.
- Replit-Designabnahme 09c3358cfe39f348f866b8f547d91183daebfca7 wurde in den geschützten Sourceweg übertragen.

## MID v0.9.85.103 · 2026-09-25 · MID 18.2.13 · Berg-/Wintersportwetter

- Höhenbezogene Bergprognose auf 168 Stunden erweitert; Tal/Mitte/Berg bleiben getrennte Punktprognosen.
- Zentrale 7-Tage-Aggregation leitet Temperatur, Wind/Böen, Niederschlag, Schnee, Sonnenschein sowie Nullgrad-/Schneefallgrenze aus derselben gewählten Höhenzeitreihe ab.
- Fehlende Schneefallintervalle erzeugen keinen künstlichen Nullwert mehr.
- Neue mobile-first Oberfläche mit Höhenwahl, horizontaler Istwert-Leiste, sieben geschlossenen Tageszeilen und maximal einem geöffneten 3-Stunden-Detail.
- Bestehende MID-Wetterpiktogramme, Windpfeile und DWD-Warnschwellen werden wiederverwendet; Winter-/Sommerpriorisierung ist getrennt.
- Replit-Abnahme: fokussierte Bergwetter-Regressionen, Typecheck, Produktionsbuild und Light/Dark-Viewportmatrix grün; finaler lokaler Design-Handoff 09c3358cfe39f348f866b8f547d91183daebfca7. Übernahme erfolgt in den geschützten GitHub-Sourceweg, nicht per Replit-Publish.

## MID v0.9.85.102 · 2026-09-25 · Bottom-Bar-Tippverhalten und Forecast-Horizont stabilisiert

- Der explizite Forecast-Horizont wird deklarativ aus activeNavSection an ForecastCockpit übergeben und beim Mount vor localStorage priorisiert.
- ForecastCockpit synchronisiert navigationHorizon auch nach dem Mount ohne Timeout- oder Delay-Hacks.
- Neue Regression scripts/test-bottom-bar-forecast-horizon-race-0985102.mjs schützt Mount/Remount und Bottom-Bar-Responsive-Verträge.

## MID v0.9.85.102 · 2026-09-25 · Bottom-Bar-/Forecast-Horizon-Stabilisierung

- Bottom-Bar „Heute“ übergibt den gewünschten Kurzfrist-Horizont deklarativ an das Forecast-Cockpit.
- Explizite Navigation gewinnt beim Mount/Remount vor `mid:forecastCockpit:activeHorizon`; der gespeicherte Wert bleibt nur Wiedereinstiegs-Fallback.
- Bereits gemountete Forecast-Cockpits synchronisieren den Navigationshorizont ohne Timeout-/Delay-Hacks.
- Neue Regression `scripts/test-bottom-bar-forecast-horizon-race-0985102.mjs` schützt Vorhersage→Aktuell→Heute, Heute→Karten→Vorhersage sowie Safe-Area-/Touchzielverträge.
- Wetterdaten, Modellfusion, Warnlogik, Worker und fachliche Prognosewerte werden nicht verändert.

## MID v0.9.85.101 · 2026-09-25 · MID 18.2.13 · Sky-Kohärenz, Nacht-Skybars und Kartenfokus

- Numerische DWD-SYNOP-ww-Codes 0–3 werden nicht als Open-Meteo weather_code 0–3 übernommen; ww=3 kann nicht mehr allein Bedeckt setzen.
- Frische fieldFresh(cloudCover)-Beobachtung steuert aktuellen Code/Label und das Hauptpiktogramm gemeinsam; Modell-Wolkenschichten werden dann nicht in den beobachteten Sky-Visual gemischt.
- 7d day-card und 14d fourteen-row projizieren solarTimelineWindow mit MID-Nachtfarbe und weichen 14/86-Prozent-Fades hinter Band/Squares.
- PwaInstallButton erhält einen transienten, nicht persistenten Kartenfokus-Unterdrückungsvertrag; der manuelle App-Button bleibt aktiv.
- Neue Regression scripts/test-mid-18-2-13-sky-coherence-night-skybars-install.mjs.

## MID v0.9.85.101 · 2026-09-25 · MID 18.2.13 · Aktuelles Wetter, Nacht-Skybars und Kartenfokus

- Aktuelles Wetter nutzt für Zustandslabel und Hauptpiktogramm denselben kanonischen Bewölkungsstand: frische beobachtete Gesamtbewölkung gewinnt gemeinsam; ohne frische Beobachtung greifen Text und Symbol gemeinsam auf den Modellhintergrund zurück.
- Numerische DWD-SYNOP-Wettermeldungen ww=0–3 werden nicht mehr als Open-Meteo-Wettercodes 0–3 interpretiert; insbesondere kann ww=3 nicht fälschlich „Bedeckt“ erzwingen.
- Die Bewölkungs-Info weist verwendete Quelle, Beobachtungsstand/Alter und Modellfallback nachvollziehbar aus.
- 7-Tage-Tageskarten und 14-Tage-Zeilen erhalten astronomisch berechnete Nachtflächen aus der zentralen solarTimelineWindow-Geometrie; Band- und Quadratdarstellung teilen dieselbe Nachtgeometrie.
- Der transiente PWA-Installationshinweis wird im Karten-/Komposit-Fokus temporär unterdrückt, ohne den manuellen „App“-Knopf oder den Installationsstatus zu verändern.
- Neue Regression `scripts/test-mid-18-2-13-sky-coherence-night-skybars-install.mjs`; vollständiger Source-Gate prüft Build, Regressionen und Web-/iOS-Hülle vor Veröffentlichung.

## MID v0.9.85.100 · 2026-09-25 · MID 18.2.12 · Mobile Einstellungsnavigation

- Geprüfter Replit-Handoff `e05bca0aa305a938c886b77e5062ca1c635d4994` vom Branch `replit/settings-mobile-tabs-098599`; read-only Handoff-Gate vollständig grün.
- Die mobile Einstellungsnavigation bleibt einzeilig horizontal scrollbar und führt den aktiven Bereich automatisch vollständig ins sichtbare Scrollfeld.
- Dezente linke/rechte Fortsetzungshinweise zeigen nur dann weitere Tabs an, wenn tatsächlich zusätzlicher Inhalt vorhanden ist; permanente Scrollbars entfallen.
- 44-px-Touchziele und Safe-Area-Abstände bleiben auf 360×800 und 390×844 erhalten; Light/Dark visuell geprüft.
- Neue Regression `scripts/test-settings-mobile-horizontal-tabs.mjs`; bestehender MID-18.2.7-Responsive-Test sowie Handoff-Build/Web-/iOS-Hüllenprüfung grün.
- Keine Änderung an Wetterdaten, Modellfusion, Warnlogik, Schwellen, Parameterfarben, Worker- oder iOS-Fachlogik.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Responsive Forecast-Horizontnavigation

- Geprüfter Replit-Handoff dcdfc8c18b1fcc84c19547a8f4d85c163ce07960 über den read-only Handoff-Gate übernommen.
- navigateToDashboardSection verwendet bei modernen Forecast-Modulen die unmittelbar vor dem Modul liegende Horizontnavigation als Scrollziel.
- Mobile Forecast-Horizontnavigation erhält Safe-Area-Scroll-Margin und Abstand zum nachfolgenden Forecast-Modul.
- Neue Regression scripts/test-modern-forecast-horizon-viewport.mjs; Handoff-Build und Web-/iOS-Hüllenprüfung grün.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Forecast-Horizontnavigation responsive stabilisiert

- Replit-Handoff aus geprüftem SHA `dcdfc8c18b1fcc84c19547a8f4d85c163ce07960` übernommen; Handoff-Gate vollständig grün.
- Bottom-Tab-Forecastnavigation scrollt bei Prognosemodulen auf die unmittelbar zugehörige Horizontleiste statt den darunterliegenden Modulcontainer, sodass die Leiste nicht oberhalb des Viewports verschwindet.
- Mobiler/Querformat-Abstand und Scroll-Margin berücksichtigen Safe Areas; keine Sticky-/Fixed-Navigation eingeführt.
- Neue Regression `scripts/test-modern-forecast-horizon-viewport.mjs`; vorhandener MID-18.2.7-Responsive-Test und Produktionsbuild grün.
- Reale Sichtprüfung 360×800 Light bestätigt; weitere Zielgrößen sind zusätzlich regressionsgeschützt, die Replit-Browserautomation war dort nicht zuverlässig genug für eine behauptete Sichtabnahme.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar mit Nachtkennzeichnung

- ForecastCockpit.ShortTermRibbon leitet now90StartEpoch/now90EndEpoch aus den realen 15‑Minuten-Intervallen ab und nutzt solarTimelineWindow gemeinsam mit Aktuell/24 h.
- now90NightBands werden auf die 120×16-Skybar-Geometrie projiziert und vor SkyBarSegmentsSvg/SkyBarHourCellsSvg gerendert; MID-Nachtfarbe und 14/86-%-Fade entsprechen Aktuell.
- Neue Regression scripts/test-mid-18-2-10-now90-night-098598.mjs schützt Solarquelle, Layer-Reihenfolge, Fade, Farbe und Baseline-Vertrag.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar-Nachtkennzeichnung

- 90‑Minuten-Skybar „Heute / Ab jetzt“ nutzt dieselbe zentrale Solar-Geometrie wie „Aktuell“ und das 24‑h‑Profil.
- Nachtbereiche werden aus den realen 15‑Minuten-Intervallen auf die Skybar-Geometrie projiziert und hinter Wettersegmenten bzw. Stundenquadraten gerendert.
- MID-Nachtfarbe und weiche 14/86-%-Fade-Geometrie entsprechen „Aktuell“; Niederschlag, Bewölkung und Sonne behalten ihre bestehende Fachlogik.
- Regression: `scripts/test-mid-18-2-10-now90-night-098598.mjs`.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit: Cache, Fokus und lokale Zeitbasis

- Forecast-Core-Cachevertrag Frontend v4 und Worker-Edge v3 dimensionieren Koordinaten, gerundete Höhe und effektive IANA-Zeitzone; unsichere Legacy-Einträge werden nicht migriert.
- Forecast-Fusion-Localcache v10 trennt Höhenstände; Lead-Time-Reconciliation und Tagesfusion nutzen reale lokale Stunden-Epochen.
- forecastPeriods.addForecastDays verwendet reine gregorianische Kalenderarithmetik ohne UTC-Date-Mutation; SevenDayForecastSummary nutzt diesen Vertrag für die Folgenacht.
- AppPortalPopover stellt den gemeinsamen verschachtelbaren Fokusstack bereit; Mehr-Drawer, Event-Center, Impressum und Einstellungen sind angeschlossen.
- Neue Regression test-mid-18-2-10-replit-audit-098597 schützt Cache-Dimensionen, Fokusvertrag, DST-/Datumsgrenzen und Release-Version.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit-Fixes

- Forecast-Core-Cache Frontend v4 und Worker-Edge v3 trennen Koordinaten, Höhe und effektive Ortszeitzone; unsichere Legacy-Caches werden nicht mehr als frischer Stand migriert.
- Direktabruf und Worker-Pfad reichen Höhe und Zeitzone konsistent an Open-Meteo weiter; der explizite Worker-Request-Key enthält dieselben Dimensionen.
- Forecast-Fusion-Cache v10 trennt Höhenstände; Tages-Lead-Time basiert auf realen lokalen Stunden-Epochen statt auf festem 12:00Z.
- Gemeinsamer Fokusstack für Dialoge/Popover/Sheets mit Initialfokus, Tab-/Shift-Tab-Fang, Escape nur auf oberster Ebene und Fokus-Rückgabe; Mehr, Event-Center, Impressum und Einstellungen angeschlossen.
- Zivile Kalenderarithmetik für Folgenächte arbeitet ohne UTC-Date-Mutation und ist für CET/CEST, Datums-/Jahresgrenzen sowie weit entfernte IANA-Zeitzonen regressionsgeschützt.
- Neue Regression: `scripts/test-mid-18-2-10-replit-audit-098597.mjs`.

## MID v0.9.85.96 · 2026-09-23 · MID 18.2.9 · METAR-Beobachtung und kompakte 14-Tage-Ansicht

- METAR-Current-Auswertung endet vor Trend-/Remark-Gruppen wie TEMPO, BECMG, NOSIG, INTER, PROB30/40, FM-Zeitgruppen und RMK.
- Der reproduzierende EDDG-Fall `... Q1020 TEMPO SHRA BKN025TCU` kann Current Weather nicht mehr fälschlich auf Regenschauer/Trendbewölkung setzen.
- 14 Tage: Default je Tag nur Wetterkopf, Tmin/Tmax, eine Skybar, Niederschlag, Wind/Böen und Konfidenz; Sekundärwerte ausschließlich im ausgewählten Inline-Detail.
- Doppelte 24-h-Detail-Skybar sowie separate Defaultblöcke für Sonnenscheindauer, Temperaturabweichung und Regime wurden entfernt.
- Replit vor Designänderung auf mid-stable v0.9.85.95 synchronisiert; Veröffentlichung weiterhin ausschließlich über den kanonischen GitHub-Releaseweg.
- Regressionen: `test-metar-trend-observation-boundary-098596.mjs` plus aktualisierter `test-fourteen-day-replit-fluid-grid-098593.mjs`.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.9 · Gewitter-, RUC-, Skybar- und Performance-Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer von Wolkenkomplement; alter Komplement-Vertrag und Wissenschaftstest aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.8 · J.1–J.5 Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer vom Wolkenkomplement; Wissenschaftsregression entsprechend aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.89 · 2026-09-22 · Arbeitspaket H · Responsive Gesamtabnahme und 7-Tage-Korrektur

- Replit-Abnahme: 7-Tage-Fix sowie H.1/H.2a/H.2b/H.2c umgesetzt; H.1 und H.2c jeweils mit vollständiger Light/Dark-Viewportmatrix grün, Typecheck/Produktionsbuild/Regressionen ohne Befund.
- Produktive Übernahme erfolgt bewusst als Mapping auf ForecastCockpit, MeteogramPanel und WaterSportsPanel statt durch Kopieren des Mockup-Sandbox-Codes.
- Neue finale UI-Schicht midC18WorkPackageH.css erzwingt die vertikale 7-Tage-Tagesliste unabhängig vom früheren Orientierungsvertrag, ordnet die aktive Detailfläche hinter allen sieben Zeilen an und schützt H.2c-Overflow-/Touchverträge.
- Regression test-mid-18-2-6-h-responsive-handoff-098589.mjs schützt die produktiven 7-Tage-, Meteogramm- und Tide-Verträge; meteorologische Daten-, Warn-, Schwellen-, Modellfusions- und Skybar-Fachlogik bleiben unverändert.

## MID v0.9.85.88 · 2026-09-22 · Arbeitspaket G · Ensemble, Klima und Widgets

- Replit-Abnahme vollständig grün: Typecheck, Produktionsbuild, fokussierte Regressionen sowie Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900.
- Produktintegration verwendet die bestehenden EnsemblePanel-, ClimatePanel- und AppleWidgetSettings-/Export-Verträge; Datenquellen, Schwellen und Berechnungen wurden nicht geändert.
- Neue finale UI-Schicht midC18WorkPackageG.css schützt Umbruch, Tooltipbreite, Touchziele und Overflow; Regression test-mid-18-2-5-g-ensemble-climate-widgets-098588.mjs sichert die Verträge.

## MID v0.9.85.87 · 2026-09-22 · 14-Tage-Zeilen responsiv entzerrt

- Replit-Abnahme: Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900 sowie längere mobile Detailansichten grün.
- Mobiler 14-Tage-Header nutzt flexiblen Textbereich plus getrennte Konfidenzspalte mit mindestens 132 px; verschachtelte Elemente erhalten min-width:0 und wesentliche Texte keinen Truncate-Vertrag.
- Neuer Regressionstest schützt ForecastRow-Struktur, Konfidenzpille, Umbruch und Overflow-Vertrag.
- Der v0.9.85.86-Heute-/24-h-Viewport-Regressionsvertrag ist vorwärtskompatibel auf 0.9.85.86 oder neuer fortgeschrieben; seine fachlichen Viewport-Assertions bleiben unverändert.

## MID v0.9.85.86 · 2026-09-22 · Heute-/24-h-Viewport-Fix

- Replit-Abnahme für Smartphone, Tablet und Desktop in Light/Dark vollständig grün.
- Künstliche 600/640-px-Mindestbreiten des 24-h-Profils entfernt; der Profiltrack bleibt durchgehend stündlich.
- Außencontainer der Heute-Arbeitsfläche gegen horizontalen Overflow abgesichert; der bewusste 90-Minuten-Innenscroll bleibt lokal begrenzt.
- Untere Profilachse erhält sicheren Rendering- und Padding-Raum; meteorologische Fachlogik und Daten bleiben unverändert.
- Neue Regression test-mid-18-2-5-today-viewport-098586 schützt den Responsive-Vertrag.

## MID v0.9.85.85 · 2026-09-22 · MID 18.2.5 · gesammelte Current-/24-h-/7-/14-Tage-Korrekturen

- Beide Replit-Einschübe gemeinsam abgenommen: Typecheck, Produktionsbuild und fokussierte Regressionen grün.
- Responsive Abnahme für Light/Dark auf Smartphone, Tablet und Desktop inklusive Hoch-/Querformat ohne offene Restpunkte.
- Produktive Übernahme schützt Current-Windrichtungspfeil, getrennten +12-h-Header, ausschließlich stündliches 24-h-Profil, aktive 7-/14-Tabs, kollisionsfreie 7-Tage-Zeilen, lesbare Konfidenz-Pillen und ganzzahlige Haupt-Sonnenstunden.
- Neue Regression scripts/test-mid-18-2-5-ui-fixes-098585.mjs und nach Arbeitspaket F geladener Designlayer src/midC18ResponsiveCorrections.css.

## MID v0.9.85.84 · 2026-09-22 · Arbeitspaket F · Map-first Kartenarbeitsraum

- Replit-F-Abnahme einschließlich Transparenz-Follow-up vollständig grün.
- Neuer Designlayer `src/midC18MapFirstWorkspace.css`, geladen nach Arbeitspaket E.
- Produktive Fachverträge verbleiben in `RadarPanel.tsx`, `WeatherMapsPanel.tsx` und `SynopticPanel.tsx`; keine Änderung der meteorologischen Datenlogik.
- Neue Regression `scripts/test-mid-18-2-5-f-map-first-098584.mjs` schützt Timeline, Playback, Jetzt, Layer-Deckkraft, Synoptik und Responsive-Komposition.
- Light/Dark-Abnahme: 360×800, 390×844, 430×932, 834×1112, 1112×834 und 1440×900.

## MID v0.9.85.83 · 2026-09-22 · Arbeitspaket E

- ForecastCockpit: gemeinsame MidForecastRow-Familie für 7-/14-Tage.
- 7 Tage: selectedDate ist alleiniger Inline-Detailzustand; unabhängiges expandedDate entfernt.
- 14 Tage: bisherige Fokuskarte direkt unter die aktive Tageszeile verschoben; kompakte Skybar und Tmin/Tmax-Faden aus bestehenden Daten ergänzt.
- Neuer zuletzt geladener Designlayer für Desktop, Tablet hoch/quer und Smartphone.
- Neuer Regressionstest schützt gemeinsame Row-Struktur, genau eine Inline-Erweiterung, vorhandene Datenquellen und Responsive-Vertrag.
- Replit-Vorprüfung: Typecheck/Produktionsbuild und Light/Dark-Viewportmatrix grün; kanonischer GitHub-Gate bleibt maßgeblich.

# MID v0.9.85.39

## MID-C9 · Mobile Layoutkorrektur nach Screenshots

- Aktuell: vier Kernparameter tatsächlich als 2×2-Raster; alte übergreifende Zellbelegungen zurückgesetzt. Wetterkopf, Quellenzeile und Niederschlagsinformation kompakter; doppelte Freifläche vor dem Footer reduziert.
- Kurzfrist: alle Zeitpunkte bleiben in genau einer horizontal scrollbareren Zeile. Die feste Sechs-Spalten-Begrenzung entfällt, auch der siebte Zeitpunkt bleibt oben.
- Favoriten: einzeilige Anordnung mit klarer Auswahl, separater Verwaltung und einmaliger Standard-Kennzeichnung; keine überlagerten Grid-Bereiche oder doppelte Abkürzung.
- Aktiver Kurzfrist-Schalter mit lesbarem Textkontrast. Wetterwerte, Quellen und Bedienfunktionen bleiben erhalten.

# MID v0.9.85.38

## MID-C9 · Einheitlicheres Design und ruhigere Bildsteuerung

- Die 90-Minuten-Vorschau bildet eine durchgehende Zeitleiste mit klar hervorgehobenem Zeitpunkt.
- Auf Tablets passen Seitenleiste und Inhaltsabstand zusammen; auf großen Bildschirmen sind die Navigationsziele wieder beschriftet. Lange Ortsnamen bleiben lesbar.
- „Mehr“ erhält übersichtliche Einstellungszeilen und einen beim Scrollen erreichbaren Kopf. Flächen und Abstände sind ruhiger und einheitlicher.
- Das DWD-Originalbild lässt sich in feineren Schritten von 50 bis 500 Prozent zoomen. Der betrachtete Ausschnitt bleibt beim Zoomen erhalten; „Standort“ und „100 %“ führen gezielt zurück.
- Verzögerte Zentrierungssprünge entfallen. Die eingebettete Originallegende wird nicht mehr durch allgemeine Bildgrößenregeln verkleinert.
- Wetterwerte, Warnschwellen, Parameterfarben und die bisherige geografische Bildkalibrierung bleiben unverändert.

# MID Build-Changelog · v0.9.85.37

## Redesign-Stufe C17 · DWD-Ortsausschnitt wieder exakt lokalisiert

- Der reale Mobil-Sichtvergleich zeigte, dass „Wolken + Niederschlagsart“ trotz unveränderter DWD-Georeferenzierung nicht in jedem Öffnungs-/Resize-Zyklus sichtbar auf dem gewählten Ort stehen blieb. Ursache war die Darstellungsfolge: der Bildcanvas konnte nach dem ersten Zentriervorgang noch seine Größe ändern beziehungsweise animieren.
- DwdPrecipitationTypeRadar zentriert jetzt mit der tatsächlich gerenderten Canvas- und Viewportgröße. Ein zusätzlicher ResizeObserver überwacht sowohl Viewport als auch Canvas und zieht den gewählten Standort nach jeder relevanten Größenänderung wieder exakt in die Mitte.
- Bildladen löst nach dem Layout zusätzlich eine Standortzentrierung aus. Die Wiederholungen liegen bei unmittelbarem Layout, zwei Animation Frames sowie 80/180/360 ms, damit iOS-/PWA-Layoutwechsel und aufklappende Bereiche nicht mehr in einem halbverschobenen Zustand enden.
- Der Standortmarker ist nun ein konsistentes MID/Lucide-MapPin mit zusätzlichem 6-px-Ankerpunkt exakt auf dem georeferenzierten Originalpixel. Der bisherige Emoji-Pin entfällt.
- src/midC17DwdLocationFix.css entfernt die Breitenanimation des Originalbild-Canvas, schützt Auto-Scroll-Zentrierung und reduziert die eingebettete Originallegende mobil leicht, ohne DWD-Inhalt oder Pixelanalyse zu verändern.
- scripts/test-c17-dwd-location-centering-098537.mjs schützt die etablierte Kalibrierung einschließlich des realen Elsig-Sichtvergleichs (50,67° N / 6,76° E → normierter Originalbildpunkt 0,33102793 / 0,46836195) und prüft exakte Zentrierbarkeit auf 320/390/430/768 px Viewports.
- Keine Änderung an DWD-Quelle, Originalbild, Niederschlagsartenklassifikation, Pixelanalyse, Radar-/Satellitenzeit, Nowcast-/RUC-Logik oder meteorologischen Schwellen.

# MID Build-Changelog · v0.9.85.36

## Redesign-Stufe C16 · Heute-Proportionen nach realem iPhone-Sichtvergleich

- Der Sichtvergleich mit v0.9.85.35 zeigte, dass das 24-h-Wetterprofil auf schmalen Viewports die volle Desktop-Y-Geometrie von 632 Einheiten beibehielt und dadurch gegenüber der verfügbaren Breite sichtbar überdehnt wirkte.
- `ForecastCockpit` skaliert die komplette Y-Geometrie des 24-h-Profils jetzt gemeinsam und konsistent: Smartphone bis 560 px auf 72 %, mittlere Viewports bis 860 px auf 86 %, Desktop unverändert auf 100 %. Zeitachse, Solarereignisse, Wetterpiktogramme, Wolken-, Temperatur-, Niederschlags-, Wind-, Druck- und Hazardspuren folgen derselben Skalierung.
- `src/midC16TodayProfileFix.css` schützt Textfluss und Containerbreiten. Die Kurzfrist-Zusammenfassung darf umbrechen, die 90-Minuten-Kopfzeile wird auf sehr schmalen Geräten von redundantem Zusatztext befreit.
- Der DWD-Disclosure verwendet nun einen expliziten Button statt des nativen `details`-Zustands. Dadurch kann eine vom Browser wiederhergestellte `open`-Eigenschaft das große DWD-Originalbild nach Rückkehr oder Reload nicht ungefragt erneut öffnen. Das Bild wird weiterhin erst nach Nutzeraktion gerendert. Zusätzlich wurde der nicht definierte helle `--card`-Fallback entfernt; die Disclosure-Fläche verwendet jetzt die aktiven MID-Themeflächen `--surface`/`--s2`.
- Wetterdaten, DWD-Originalprodukt, Pixelanalyse, Zoom, Nowcast-/RUC-Fusion, Warnschwellen, Parameterfarben und Zeitsemantik bleiben unverändert.
- `scripts/test-c16-today-profile-density-098536.mjs` schützt die responsive Profilgeometrie, den Textfluss und den explizit geschlossenen DWD-Startzustand.

# MID Build-Changelog · v0.9.85.35

## Redesign-Stufe C15 · Heute-Dichte und progressive DWD-Ansicht

- `DwdPrecipitationTypeDisclosure` hält das amtliche DWD-Originalprodukt vollständig verfügbar, rendert die große Bildfläche in „Heute“ und Kurzfrist aber erst nach bewusster Öffnung. Originalbild, Radar-/Satellitenzeit, Pixelanalyse und Zoom bleiben unverändert erhalten.
- `ForecastCockpit` und `ShortTermForecast` verwenden denselben Disclosure-Vertrag, damit das DWD-Bild nicht mehr mehrfach als dauerhaft dominante Fläche erscheint.
- `src/midC15TodayDensity.css` wird nach C14 geladen und verdichtet das mobile 24-h-Wetterprofil. Abgeleitete Signale werden auf schmalen Viewports als horizontale, touchfreundliche Leiste geführt; Auflösungswahl, Legende und Info bleiben erhalten.
- Die Profil- und Hilfeflächen sind weiterhin an ihren eigenen Viewport gebunden. Die meteorologischen Spuren, Warnschwellen, Parameterfarben, Quellprovenienz und Zeitsemantik werden nicht verändert.
- `scripts/test-c15-today-density-098535.mjs` schützt die progressive DWD-Ansicht, die C15-Kaskadenposition und die mobile Profil-Dichte. Der bestehende C11-Vertrag wurde ausschließlich auf den gemeinsamen Disclosure-Namen fortgeschrieben.

# MID Build-Changelog · v0.9.85.34

## Redesign-Stufe C14 · Karten als Arbeitsraum und reale Viewport-Korrekturen

- `src/midC14MapWorkspace.css` vereinheitlicht den Kartenbereich als Map-first-Arbeitsraum. Komposit und DWD-Wetterkarten verwenden denselben Dichtevertrag für Smartphone, Querformat, Tablet und Desktop.
- Der bestehende Komposit-Fokus bleibt fachlich unverändert: Radar, Satellit, Nowcast und Modell/Synoptik teilen weiterhin die bestätigte Produktzeitachse. Überschrift, Moduswahl und Zeitleiste werden visuell deutlich kleiner, die Karte erhält den größten Viewport-Anteil.
- `WeatherMapsPanel` entfernt die dauerhaft doppelte Zeitschritt-Auswahl. Direkt sichtbar bleiben nur Modell und Kartenprodukt; die Karte trägt Produkt, Gültigkeit und Lead Time kompakt als Overlay.
- Druckfläche/Höhe, Kartenbasis, Deckkraft und Reload liegen nun in `Darstellung & Ebenen`; Quelle, INIT und Gültigkeit liegen in `Quelle & Lauf`. Beide Bereiche sind standardmäßig eingeklappt und bleiben vollständig zugänglich.
- Die gemeinsame Kartenzeitleiste behält Zurück/Play/Vor/Range und ergänzt einen `Jetzt`-Sprung zum fachlich bevorzugten verfügbaren Termin.
- Der Screenshot-Abgleich zeigte eine zentrale Kaskadenursache: `v078` wurde nach den Redesign-Dateien geladen und konnte C7–C13 auf realen Smartphones teilweise wieder überschreiben. `src/main.tsx` lädt den Legacy-Layer nun vor sämtlichen Redesign-Stufen; C14 bleibt als letzte visuelle Schicht maßgeblich.
- `src/midC14ViewportFixes.css` verdichtet Kopf, Suche, Favoriten, Orts-/Warnkontext und aktuelle Kernwerte. Die primäre Smartphone-Ansicht zeigt vier Kernparameter; Sichtweite bleibt in den Zusatzdetails erreichbar.
- Das Impressum erhält einen strikt viewportgebundenen Dialog mit dauerhaft zugänglichem, sticky Schließen-Kopf und intern scrollendem Inhalt. Hoch- und Querformat verwenden Safe-Areas und `100dvh`.
- DWD-Originalbildzoom und breite Diagramme dürfen ihre äußeren Container nicht mehr verbreitern. Vergrößerung und horizontales Scrollen bleiben auf den jeweiligen Bild-/Diagrammviewport beschränkt; die App selbst wird horizontal geklemmt.
- `CompositeTimelineContract.phaseSources` bereitet die gemeinsame Kartenzeitachse auf einen späteren transparenten Übergang von Satellitenbeobachtungen zu modellbasierten Pseudo-Satellitenbildern vor. Jede Phase kann eine eigene Quelle tragen; weiterhin werden ausschließlich bestätigte Produktzeitpunkte verwendet und keine Zwischenbilder erfunden.
- Datenquellen, DWD-WMS/Raster, Radar-/Satelliten-/Nowcastlogik, Modellkonturen, Warnregeln, Farbcodierungen und Zeitsemantik wurden nicht geändert.
- `scripts/test-c14-map-workspace-098534.mjs` schützt Map-first-Hierarchie, eine gemeinsame Zeitleiste, einklappbare Sekundärsteuerung und Responsive-Verträge. `scripts/test-c14-viewport-fixes-098534.mjs` schützt Kaskadenreihenfolge, Portrait-Impressum, Zoom-Containment, Smartphone-Dichte und den künftigen Quellenwechsel Satellit → Pseudo-Satellit.

## Redesign-Stufe C13 · mobile Dichte und Aktuell

- `src/midC13MobileDensity.css` wird nach C12 geladen und korrigiert die im realen Smartphonebild noch zu große, kachelartige Aktuell-Darstellung.
- Der Orts-/Warnkontext erhält verbindlich die Reihenfolge vor `Aktuell`; die alte CSS-Sortierung darf den Ort nicht mehr ans Abschnittsende verschieben.
- Der bestehende `hidden`-Vertrag der Zusatzwerte wird auf Autorenebene geschützt. `mehr/weniger` blendet die Sektion damit tatsächlich ein bzw. aus.
- Geöffnete Zusatzwerte werden als eine zusammenhängende, ruhige Detailfläche mit Zeilentrennung dargestellt; UVI-/AQI-Skalen und Sonne/Mond bleiben erhalten, ohne wieder eine gleichrangige Kachelmatrix zu bilden.
- Auf Smartphonebreiten scrollt der große Kopf mit der Seite statt den knappen Viewport dauerhaft zu belegen. Logo, Aktionsflächen, Suche, Favoriten, Ortskopf, Atmosphärenkarte, Radar-Nowcast und Bottom-Bar erhalten reduzierte Höhen und Schriftgrößen mit Safe-Area-Schutz.
- Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogramme, Parameterfarben, Quellenbewertung und Zeitsemantik bleiben fachlich unverändert.
- `scripts/test-c13-mobile-density-098533.mjs` schützt Reihenfolge, echte Klappung, De-Kachelung, mobile Dichte und die wichtigsten Breakpoint-/Safe-Area-Verträge.

## Redesign-Stufe C12 · Vorhersage

- `src/midC12ForecastRedesign.css` wird nach C11 geladen und setzt die verbindliche visuelle Hierarchie der Vorhersage um.
- 7 Tage: Verlaufsgrafik bleibt Primärvisualisierung; Tageswerte bilden ein zusammenhängendes Band; die stündliche Detailansicht wird in denselben Arbeitsraum integriert.
- 14 Tage: Ensemble-/Konsistenzinformationen bleiben vollständig erhalten; Tagesdarstellung wird als fortlaufende Spalten organisiert; der gewählte Tag erhält eine integrierte Detailtiefe statt einer zweiten gleichgewichteten Karte.
- Responsive Verträge schützen Smartphone Hoch-/Querformat, Tablet, Desktop, Safe-Areas, horizontale Prognosebereiche und reduzierte Bewegung.
- Keine Änderung an Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogrammlogik, Parameterfarben oder Zeitsemantik.
- `scripts/test-c12-forecast-redesign-098532.mjs` schützt Struktur, Auswahlzustände, Responsive-Verträge und den ausgelieferten, nichttechnischen App-Changelog.

## Veröffentlichung

Verbindlicher Pfad: **Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Stable-Promotion**. Der Stand darf erst nach grünem Gate und erfolgreicher Stable-Promotion als veröffentlicht gelten.

- Renderprüfung von PR #442 um native Fill-Style-Sichtbarkeit (`layout.visibility`, numerisches `fill-opacity`) ergänzt. Der positive MapLibre-Query allein konnte bei unsichtbarem Fill eine falsche Gesundmeldung auslösen. Zusätzliche Vitest- und TSX-MapLibre-Mockfälle für `none`/`0`; unveränderte Feature-, GeoJSON-, Modell- und Source-PR-Gates. Sichtbare WebGL-Pixel und tatsächlicher Browser-/Recovery-Check weiterhin offene Release-Blocker.

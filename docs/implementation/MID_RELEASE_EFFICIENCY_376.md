# MID Release-Effizienz: kontrollierte Migration (Vorbereitung, kein produktiver Fast Path)

Stand: 30.10.2026. Verifizierte Basis \`main = mid-stable = 05798c4134431a5fb0455ef5f71441b4a7051e38\`, v0.9.85.373. Geplante Arbeitskennung .376 ist **keine behauptete Version oder Veröffentlichung**. Draft #524 (.374) unverändert geschützt; parallel angelegter .375-Branch ist nicht in Stable enthalten.

## Ziel, harte Grenzen und Reihenfolge

Ziel: kürzere Ende-zu-Ende-Zeit bei **unveränderten oder stärkeren** Source-/Release-/Worker-/Pages-/Stable-Gates, Attestierung, Reproduzierbarkeit und NoData-/WMO-/DWD-Verträgen. Kein Admin-Bypass, keine neue kostenpflichtige Infrastruktur, keine erweiterte Release-Token-Berechtigung, kein Force-Push, keine automatische PR-Zusammenführung durch Diagnostik. Die bestehenden kanonischen Workflowquellen unter \`ci/github/\` werden weiter über \`npm run sync:github-workflows\` gespiegelt.

1. **Messung (implementierter read-only Pilot):** \`tools/ci/release-timing.mjs\` liest GitHub-Actions-Metadaten (\`actions:read\`); kein Logdownload, keine Tokens im Bericht. Separater manueller Workflow \`MID Release Timing Audit (read-only)\`. \`node --test scripts/test-release-timing-0985376.mjs\` prüft Parallelität, fehlende Zeiten, problematische Eingaben und Perzentile. Zeit \`first job started → last job completed\` ist *kein* vollständig gemessener PR→Stable-Lead-Time-Ersatz. Source-Gate, Bot und Installer müssen bis zur Zuordnung über PR-HEAD, Merge-SHA, ZIP-/Snapshot-SHA und Promotion-SHA **getrennt** ausgewiesen werden. Die GitHub-Laufzeitmetadaten sind Grundlage, nicht die konfigurierte \`timeout-minutes\`-Obergrenze.
2. **Sichere Wiederverwendung (noch nicht aktiviert):** Bestehende SHA-Snapshot-/ZIP-Verträge bleiben unverändert. Ein zukünftiger vertrauenswürdiger Build-Produzent darf nur nach eindeutiger Identität von Source-Tree, Node-/Toolchain, Lockfile, buildrelevanten \`VITE_*\`-Umgebungswerten, Workflows/Actions, Testinventar und Eingangsartefakten sowie Nachweis ALLER erforderlichen grünen Testshards als Quelle dienen. Artefakte werden mit Hash und nachvollziehbarer Runner-Identität attestiert und unabhängig *verifiziert*; der Release-Bot bleibt exklusiver ZIP-Erzeuger. Kein simples Cache-Hit-Flag, kein PR-generierter unverifizierter ZIP und kein Austausch von GitHub-Run-Ergebnissen zwischen verschiedenen SHAs.
3. **Release Train (implementierter read-only Vorprüfer, keine automatische Änderung):** \`tools/ci/release-train-plan.mjs <manifest.json> MeteoMartini/MID\`. Ein Manifest (Schema 1) enthält genau \`mainSha\`, \`stableSha\` und 1–5 Einträge \`{"pr": N, "headSha": "<40 hex>"}\`. Der Live-Vorprüfer liest GitHub-PR-Metadaten und Dateipfade, verwirft SHA-Drift, Draft, fremde PR-Quelle, abweichende Basis und überlappende Dateien. Er markiert sicherheits-/RUC-/Worker-/Dependency-Pfade ausdrücklich. **Ein positives Ergebnis ist nur ein Planungshinweis**, kein Review, Source-Gate und schon gar keine Merge-/Deploy-Freigabe. Separate Feature-/Fix-Branches bleiben frühzeitig bei GitHub gesichert. Die Gesamtänderung wird selektiv in EINEM neuen autorisierten Integration-PR gegen aktuelle Stable zusammengesetzt; Versionsspiegel/Changelog gelten dem gesamten Paket; **kombinierter Source-Gate vollständig erneut**; danach ausschließlich SHA-Bot → ZIP → Installer → Worker/Pages → Stable. Zwei bis fünf thematisch verträgliche Patches, z. B. alle 2–4 Stunden, sind zunächst eine Empfehlung und **kein automatischer Takt**. P0-Hotfixe warten nicht auf ein Bündel.
4. **Vergleich/Abnahme (noch offen):** vor einer produktiven Änderung mindestens 10 repräsentative erfolgreiche Source- und Installerläufe sowie Fehler-/Retryfälle auswerten; p50/p95, Queue, Setup, npm, Python, Browser, Build, Core, Heavy, Bot, Pages, Worker, Promotion und Fehlerquote dokumentieren. Zwei identische Source-Trees als Referenz mit unverändertem und optimiertem Pfad auf vertrauenswürdiger CI prüfen. Erforderliche negative Fälle: PR-HEAD-Wechsel, Main-/Stable-Drift, abweichender ZIP-/Test-Artefakt-Hash, unvollständige Testshards, misslingender Build, unpassender Worker-/RUC-/Codec-Vertrag, veränderte Cloudflare-Variablen, fremder Workflow/Akteur, abgelaufener Nachweis, Cache-Poisoning, Pages-Fehler, Rollback und fehlende GitHub-Actions-API-Metadaten. Jede Unklarheit → klassischer vollständiger Installer / fail-closed; keine grüne Kurzschlussfreigabe.

## Verifizierter Ausgangspunkt (Protokollmessung, keine allgemeine Laufzeitgarantie)

Installer #40966776369: 29.10.2026 22:33:35Z bis 22:51:42Z ≈ 18,1 Minuten; \`Release-Core\` ≈ 14,8 min, langsamster \`Heavy\` ≈ 12 min, Pages ≈ 1,2 min, Stable-Promotion ≈ 0,1 min. Verschiedene Jobs laufen parallel. Source-Gate #41042447504 (PR #522) hatte als langsamen Shard \`heavy-unified-map 1/3\` ≈ 12 min. Source und Installer stammen nicht aus demselben Versionslauf: diese Zahlen dürfen **nicht** als bereits gemessene gemeinsame Lead Time addiert werden. Keine Änderung an Testausführung / Produktion in dieser Draft-Stufe.

## Gegenüberstellung mit professionellen CI/CD-Verfahren

- **GitHub Actions:** Artefakte für Weitergabe zwischen vertrauenswürdigen Jobs, Caches nur für regenerierbare Abhängigkeiten; Caches nicht als Vertrauensanker.
- **SLSA / GitHub Artifact Attestations:** kryptografische Provenienz des Erzeugers *und Prüfung beim Verbraucher*; Attestierung allein ist keine Freigabe. Erst nach passender Rechte-/Kostenprüfung und Vertragsfreigabe aktivieren.
- **GitLab Merge Trains / GitHub Merge Queue:** prüfen einen integrierten Zustand statt isolierter grüner PRs. MID übernimmt dieses Prinzip selektiver Integration ohne Ersatz des vorhandenen SHA-Bots.
- **DORA / Continuous Delivery:** kurze Entwicklungs-PRs; deploybare integrierte Version; reguläre kurze Release-Trains, kritische Sofort-Hotfixe.

## Definition of Done der vier Phasen

- Phase 1: Tooltests **auf GitHub CI ausgeführt**; manuelle Workflow-Runde erfolgreich; mindestens 10 echte Laufzeitdatensätze inkl. fehlender Zeitwerte und Fehlläufe; kein Secret im Log. Nur Einchecken ist keine erfüllte CI-Abnahme.
- Phase 2: positive/negative Provenienz-Gates, Konflikt-/RUC- und Worker-Proben, Testinventar-Parität, attestierter Byte-/SHA-Vertrag, Quelle und ZIP unverändert; A/B-Läufe erfolgreich; erst dann ist Vermeidung der redundanten Installer-Tests vertraglich verhandelbar.
- Phase 3: Ein getrennt entwickeltes, nicht sensibles Paket mit 2–5 Änderungen vollständig und gemeinsam geprüft, der etablierte Releaseweg nachweislich grün; kein Merge von Draft-/Abhängigkeits-PRs.
- Phase 4: Median und p95 per Patchklasse aus echten Runs, Rückverfolgbarkeit PR→Stable mit vollständigen SHAs, normaler Regression, RUC-Datenfrische und realen Pages-/Worker-Nachweisen; kein gemeldeter Erfolg auf reinen Planungsdaten.

## Nicht veröffentlichen, solange:

- .374 Draft #524 / parallele .375-Entwicklung nicht aufgelöst und eine neue Versionsnummer nicht eindeutig freigegeben ist.
- Der Integrations-PR nicht seine vollständige kombinierte Source-Prüfung bestanden hat.
- Die benötigte Ruleset-/Source-Bot-/Workflow-Synchronisations-Abnahme fehlt.
- Der neu vorgeschlagene Artefakt-Reuse-Pfad keine beweisbar gleichwertigen Sicherheits- und Testverträge besitzt.

Ergebnisse der Diagnose bleiben explizit **nicht releasefähig**; der vollständige bisherige Pfad gilt bis zur gesondert belegten Umstellung weiter.

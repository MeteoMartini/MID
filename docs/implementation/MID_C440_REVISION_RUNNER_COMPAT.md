# MID v0.9.85.440 – Revisionsrunner reproduzierbar Playwright-kompatibel

## Anlass und Originalfehler

Nach erfolgreicher Stable-Promotion von v0.9.85.439 (b4a28cb18fdd486bb49e93a9b3b552783f655212) scheiterte der lesende Revisionsworkflow [42216840169](https://github.com/MeteoMartini/MID/actions/runs/42216840169), **bevor** auch nur ein Core-/Heavy-Regressionstest starten konnte. Zehn von zehn Regressionsmatrixjobs scheiterten beim Browser-Bootstrap; das finale Gate blieb richtigerweise rot. Der Runner wählte für ubuntu-latest **Ubuntu 26.04**. Das unverändert gepinnte Playwright **1.56.1** meldete: Playwright does not support chromium on ubuntu26.04-x64. WebKit/Chromium müssen für alle Shards real startbar bleiben.

## Begrenzter und nachhaltiger Fix

- Alle **7** Jobs von ci/github/workflows/mid-code-revision.yml verwenden explizit ubuntu-24.04 statt des veränderlichen ubuntu-latest. Das verhindert unterschiedliche Images zwischen SHA-Bindung, Core/Heavy, CI/Nightly, Health, Performance und CodeQL. Kein anderes Workflow- oder Systemprogramm wird geändert.
- Die aktive Datei .github/workflows/mid-code-revision.yml ist **byteidentisch** zur kanonischen Datei. Der etablierte Synchronisationsvertrag bleibt maßgeblich.
- Eine schon bestehende **Pflichtregression** scripts/test-revision-parallel-matrix-0985385.mjs prüft nun alle sieben Runner-Pins und verbietet eine stillschweigende Rückkehr zu ubuntu-latest. Die übrigen Shard-/Sicherheits-/Provenienzassertions bleiben ungekürzt.
- Keine Änderung an scripts/prepare-browser-runtimes.mjs, Playwright-Version, Browsern, Testumfang, Shard-Inventar, Qualitätsgrenzen, Workflow-Rechten, Triggern, Secrets oder Release-Gates. 
- Der unterstützte Runner ist ein **bewusstes Kompatibilitäts-Pin**, kein Verzicht auf neuere sichere Systeme: Künftige Runner-Upgrades erfordern gezielte Playwright-/Toolchain-Qualifikation mit echten Chromium-/WebKit-Starts und vollständiger CI/Installer-Matrix, danach eine dokumentierte Änderung.

## Nachweise und Abnahme

- Original-Joblog 127888920922 belegt tatsächliches Image ubuntu-26.04 und den oben genannten Playwright-Fehler.
- GitHub Playwright-Dokumentation: Chromium/Firefox/WebKit auf Ubuntu 24.04 unterstützt; offizielle CI-Anleitung verwendet vollständiges playwright install --with-deps.
- Code-/Dokumentationsvorprüfung kann nur die korrekte syntaktische Änderung belegen. **Bis zum grünen Source-Gate und Installer:** keine erfolgreiche Browser-/1081-Pflichttest-Ausführung oder Produktionsfreigabe behaupten.
- Abnahme: Source-PR-Gate mit unveränderter Pflichtregression und zehn Core/Heavy-Shards, SHA-gebundener Merge, installer/Worker/Pages-Gates, Stable-Promotion und anschließend **neuer erfolgreicher MID-Revision-Run gegen den finalen Stable-SHA**. Der neue Revisionslauf muss tatsächliche Chromium-/WebKit-Starts, vollständige Matrix, CI-Collector und weitere einschlägige Revisionstasks grün nachweisen.

## RUC-Abgrenzung

Die RUC-Pipeline wird nicht geändert. Ihre eigenen GitHub-Läufe, Worker/Pages-Daten und Originaldaten-/SLO-Qualifikation bleiben von einer grünen Revision unabhängig. Die gesonderte RUC-Betriebsbeobachtung darf einen einzelnen erfolgreichen Publish nicht als 168h/27h/60min-P95-Freigabe ausgeben.

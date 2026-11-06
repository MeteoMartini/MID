# MID v0.9.85.440 – Revisionsbrowser P0 und RUC-Betriebsbeobachtung

**Basis:** v0.9.85.439, `main=mid-stable` SHA `b4a28cb18fdd486bb49e93a9b3b552783f655212` (6. November 2026). Der Nachweis ist ein Change-Kandidat, keine vorab erteilte Releasefreigabe.

## Reproduzierter Fehler
MID-Revision [#42216840169](https://github.com/MeteoMartini/MID/actions/runs/42216840169), repräsentativer Job `127888920922`: Runner `ubuntu-26.04`, unverändertes `scripts/prepare-browser-runtimes.mjs` bindet Playwright 1.56.1. Log meldet `Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.56.1!` sowie `Playwright does not support chromium on ubuntu26.04-x64`. Alle zehn Regressionsshards stoppen vor den eigentlichen Tests. CodeQL ist unabhängig davon grün; die Fail-Closed-Aggregation ist korrekt rot.

## Eng begrenzte Korrektur
Die **vier Browserjobs** `revision_regressions`, `ci`, `nightly`, `performance` werden auf GitHub-hosted `ubuntu-24.04` gepinnt. Das ist die laut Microsoft Playwright unterstützte Ubuntu-Basis auch für WebKit und Chromium; die drei Browser-unabhängigen Jobs behalten ihren unveränderten Runner. Kanonische Quelle `ci/github/workflows/mid-code-revision.yml` und aktiver Spiegel `.github/workflows/mid-code-revision.yml` müssen bytegleich bleiben (normaler Wartungsbefehl `npm run sync:github-workflows`). Keine anderen Workflow-, Test- oder Releaseregeln ändern. Alle zehn Shards, Source-SHA-Fencing, Browserinstallationen, CodeQL und fail-closed Ergebnisaggregation bleiben erhalten.

Die neue Pflichtregression `scripts/test-revision-runner-playwright-0985440.mjs` verifiziert vier Runner-Pins, beide Browserinstallationspfade, unveränderte Matrix-/Regressionseinbindung, Spiegelgleichheit und eine absichtlich fehlschlagende ubuntu-latest-Negativprobe. Das Pflichtinventar erhöht sich von 1081 auf **1082**. Vor Source-Gate/Installer **keine** vollständige CI- oder reale Browserfreigabe behaupten; nach Promotion mindestens einen neuen Revisionslauf auf dem neuen Stable-SHA als zwingenden unabhängigen Post-Release-Nachweis kontrollieren.

## RUC-Beobachtung – separater P0-Befund, keine Pipelineänderung

- Aktuelle erfolgreiche Preprocess-/Pages-/Worker-Kette: [#42218214737](https://github.com/MeteoMartini/MID/actions/runs/42218214737). Health am 2026-11-06T13:07:47Z: Lauf 11:00 UTC, 542040 Punkte, EPS20; Pages und Worker als success, Full-Codec als verified/published.
- Frühere unabhängige [Verfügbarkeitsbeobachtung #42216912428](https://github.com/MeteoMartini/MID/actions/runs/42216912428) um 12:21 UTC: älterer Lauf 08:00 UTC; `pagesValid=true`, `workerValid=false`, `sameRun=false`, `appAdopted=null`; nicht als echte vollständige Datenübernahme zählen.
- [168h-Originalbeobachter #42222275219](https://github.com/MeteoMartini/MID/actions/runs/42222275219) erfasst 108 DWD-Verzeichnisproben, 54 öffentliche Readbacks und 62 ausgewählte GitHub-Runs, lehnt dennoch `productionSloAuthorized` ab. Native Original-GRIB/EPS20, exakte Erstveröffentlichungszeit, Client-Adoption und P95≤60 Minuten sind **NOT VERIFIED**.
- Watchdog [#42216849307](https://github.com/MeteoMartini/MID/actions/runs/42216849307) hat den Catch-up-Bedarf korrekt erkannt, einen parallelen aktiven Preprocess erkannt und daher keinen doppelten Dispatch durchgeführt.

**RUC-Betriebsfreigabe bleibt begrenzt:** Eine grüne Pipeline ist nicht identisch mit kontinuierlicher Field-/Run-Integrität oder amtlichem Warnstatus. Diese P0-CI-Reparatur ändert keine GRIB-Daten, RUC-Warnung, Worker-/Pages-Pipeline, SLO- oder Codec-Admission.

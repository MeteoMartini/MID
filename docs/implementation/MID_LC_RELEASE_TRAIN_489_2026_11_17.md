# MID LC · v0.9.85.489 · Release-Train und SHA-Gates (Train 17.11.2026; Prüfstand 18.11.2026)

## Verifizierter Ausgangspunkt

Ausgangs-Stable `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, Version 0.9.85.488, fünf aktive Rulesets. LC-PR #902 ist der einzige für diese .489-Integration vorgesehene Branch. Ein Merge, ZIP, Installer, Worker-/Pages-Promotion oder tatsächliche Stable-Veröffentlichung wird hier **nicht** vorweggenommen.

## Stand der verpflichtenden Gates (18.11.2026)

- Full Source-PR Gate `44203788790` auf Source-HEAD `3758d463e07576a49a36302e43068f206c231d99`: **SUCCESS**, Source-Kern, Core-4/4, Heavy-6/6 und Aggregator success. RUC-Originaldaten-Sonderjobs nach Vertragsprüfung skipped; kein positiver Originaldaten-Nachweis daraus ableiten.
- Vorheriger Full-Gate-Fehllauf `44183104251`: `npm run audit:all` meldete 11 Findings (5 HIGH, 6 MODERATE). Gepinnter Fix-Alias nach isolierter Node/npm-Prüfung: 0 HIGH/CRITICAL, 6 MODERATE. Der Community-Fork ist kein offizieller Micromatch-Patch und muss risikobewertet und ausdrücklich als Dependency-Entscheidung freigegeben werden.
- Release-Bot `44205541585`: **FAILURE**, Originalmeldung `MID_REVIEW_OPEN_THREAD`, fünf neue fachliche Cubic-Reviewthreads auf dem Source-HEAD. Kein Merge, ZIP, Installer oder Stable-Promotion. #839/#740 separat; deren offener Status ist kein pauschaler Blocker.
- Vite 8.3.5 hängt **direkt** von `picomatch ^4.0.7` ab und `tinyglobby` ebenfalls von `picomatch ^4.0.4`. Ein nur auf einen Parent beschränkter Alias behebt nicht beide Pfade. Der global gepinnte npm-Override ersetzt ausschließlich die `picomatch`-Auflösung laut Lockfile; er ist eine bewusste Supply-Chain-Entscheidung, nicht ohne Owner-Akzeptanz freizugeben.
- Vier weitere Cubic-Threads verlangen präzise Status-, Changelog-, Release-Notizen- und Datumsangaben. Diese Dokumentationskorrektur ist zunächst ausschließlich ein SHA-gebundener, **ref-freier** QA-Handoff; kein PR-HEAD wurde bewegt, alle Original-Gates müssen auf einem später autorisiert integrierten HEAD erneut erfolgen.

## Selektiv übernommener Produktumfang

- Wetterzwilling: archivierte Modell-Vorlauf- und Ausgabezeiten werden mit dem lokalen Zielmittag/DST 23-/25-Stunden-Tagen geprüft. Aus #899 sind sechs Git-Blobs SHA-identisch übernommen; Wetterwerte, Missing-Data- und amtliche Warnsemantik bleiben unverändert.
- Changelog-Integrität: drei SHA-identische Dateien aus dem früheren Spezial-PR #868 (nur Changelog-Helper, Syncer und QA). Historische CHANGELOG.md und public/CHANGELOG.md werden nicht erneut dupliziert. Die geänderte .489-Release-Sektion und die versionierten Nutzer-/Build-Notizen sind synchron; alle älteren Changelog-Bytes bleiben erhalten.
- Sicherheitswartung CVE-2026-112366: git-parentgebundene Commits `34560bd791072e65672f3af69a2e2f3d77c772f2` (npm Override+Lockfile) und `771b6a5a772f63c6ef328e53d149de423d66a5a4` (existierende Pflichtregression). Alias `npm:@ryotsu/picomatch@4.0.7-a` mit Original-npm-SHA512, *kein* erzwungenes Vite-Downgrade. 42 bounded ReDoS-Fälle, Paketherkunft und Modulidentität geprüft. Das Paket ist ein Community-Fork, kein offizieller micromatch-Upstream-Fix.
- Externe isolierte Node 22.16.0/npm 10.9.2 QA auf den exakt Git-Blob-identischen .489-Bytes: normales `npm ci`, `npm run audit:all` (0 HIGH/CRITICAL, 6 MODERATE), `npm run audit:dependencies` (83 Produktionsversionen, npm Bulk Advisory checked), `npm audit signatures` und kleiner Vite-8/React-19-Smoke PASS. **Dies ist kein MID-Vollbuild und keine Source-/Installer-Freigabe.**

## Spezialarbeiten explizit vom Release entkoppelt

Der erste LC-Draft hatte optionale Shadow-Arbeit aus #839/#740 und einen nicht aktiven GitHub-Releases-Katalog-Entwurf aus #901 aufgenommen. Die ursprüngliche Reviewrunde identifizierte weitere P1/P2-Befunde (u. a. unvollständige Shadow-Dokumentation, unbeschränkte PAX-Header, Dateinamen-Duplikate und fehlende reale Installer-Provenienz sowie fehlerhafter Katalog-Workflow-Pfad). **Diese unfertigen Zusatzdateien werden in .489 vollständig zurückgestellt.** Die ursprünglichen Quell-PRs/Commits #839 und das offene Issue #901 bleiben erhalten und sind Gegenstand separater fachlicher QA.

Die drei Installer-Workflowspiegel und beide Agent-Source-Release-Workflowspiegel sind für .489 wieder **Git-Blob-identisch zum aktuellen Stable**. Die bestehenden geschützten Source-/Merge-/Installer-/Worker-/Pages-/Stable-Gates werden nicht verändert, die QA-/Review-Schutzregeln nicht abgeschwächt. #839/#740 stellen **keine pauschale Release-Sperre** dar.

## Noch verbindlich auszuführen

Exakter neuer HEAD: vollständige Scope-/Review-/Versionen-/PR-Driftkontrolle; erfolgreiche Draft-Vorqualifikation; `Ready for review` nur nach fachlicher Prüfung; anschließend Source-Core, vier Core-Shards, sämtliche Heavy-/Browser-/Map-/meteorologischen Originaldaten-Gates und finales `Agent-Quellstand vollständig prüfen` SUCCESS. Danach ausschließlich SHA-gebundener MID Release Bot, serverseitiges unveränderliches Release-ZIP, `install-mid.yml`, betroffene Worker-/Pages-Gates und `mid-stable`-Promotion. Das Ergebnis darf ausschließlich durch tatsächliche Runs und finalen `main=mid-stable`-SHA als veröffentlicht gelten.

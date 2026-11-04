# #344 / #651 · Gesamt-gzip: Dateinachweis statt Grenzwertänderung

Basis erneut live: main=mid-stable `7e998730daaa4a409cd3e15d4f4cf0f70efaaeda`, MID .425; AGENTS, Baseline, Source of Truth und MID_PERFORMANCE_BASELINE/Logo-/Releaseverträge gelesen. Offene Kandidaten #651/#650/#648 sowie RUC-/Dependency-Drafts geprüft, kein überlappender Budgetchecker-/Revisionsartefakt-Umbau gefunden. `chatgpt/v0.9.85.426-budget-file-evidence` bezeichnet nur den Diagnosekandidaten, keine gebaute oder veröffentlichte Appversion. Keine CSS-Optimierung.

## Gate-Zustand ursachengerecht

Der volle `scripts/check-build-budget.mjs` ist über package.json `test:build-budget` erreichbar, wird aber weder von `npm run build` noch `test:regressions` aufgerufen. Explizite Workflowaufrufe ausschließlich im kanonischen `ci/github/workflows/mid-code-revision.yml` (gespiegelt unter .github): Jobs ci (normaler nicht tolerierter Schritt), nightly und performance (budget-Schritt continue-on-error, nachfolgende Befundmeldung). Trigger unter anderem mid-stable-Push und Zeitplan; das ist der getrennte Revisionspfad und KEIN verpflichtendes Source-/Installer-Vorfreigabegate.

`chatgpt-pr-gate.yml` und `install-mid.yml` bauen und führen die regulären Regressionen aus. Dort schützt `test-bundle-budget-098594.mjs` das engere Haupt-JS-/CSS-Rohbudget (1.500.000 / 1.760.000 B); es ist kein Ersatz für totalGzipBytes. Ein erfolgreicher Installer bei rotem vollen Gesamtbudget ist deshalb kein Widerspruch. Diese Einbindung wird hier nicht verschärft, abgeschwächt oder umverdrahtet. Kein neuer Releaseweg.

## Vorhandene Nachweise statt Wiederholungsbuild

#651: 8.718.691 B gzip, Limit 8.500.000 B, Überschreitung 218.691 B. Der damalige Report enthält keine Einzeldateien und kein archiviertes vollständiges Dist-Abbild. Der vorhandene eingecheckte Release-Dist ergibt 8.719.276 B, eine Differenz von 585 B; er wird ausdrücklich nicht als byteidentischer #651-Build ausgegeben. Seine Dateiverteilung und SHA-256 stehen vollständig in `released-dist-file-inventory.json`, der unveränderte #651-Report liegt daneben. Kein neuer Produktionsbuild ausgeführt.

Wichtigste Verursacher im vorhandenen Release-Dist (gzip-9):

| Datei | Roh B | gzip B |
|---|---:|---:|
| mid-logo-dark-horizontal.png | 1.268.989 | 1.269.391 |
| mid-app-icon-light-1024.png | 947.058 | 947.366 |
| mid-app-icon-dark-1024.png | 884.282 | 884.570 |
| mid-social-card.png | 673.827 | 668.539 |
| mid-logo-light-horizontal.png | 674.170 | 655.879 |
| assets/index-rBs5P8mv.js | 1.493.496 | 459.895 |
| CHANGELOG.md | 1.052.834 | 345.061 |

PNG ist bereits komprimiert und kann durch zusätzliches gzip sogar wachsen. Das bestehende totalGzipBytes summiert trotzdem gzip-9 ALLER Dateien. `compressibleGzipBytes` umfasst nur den unveränderten definierten Satz .js/.css/.html/.json/.xml/.svg/.txt/.webmanifest/.map, `staticMediaBytes` ist die ROH-Summe der vorhandenen Medienerweiterungen. Markdown zählt gemäß bestehender Definition als other zum Gesamtwert, nicht zur compressible-Gruppe. Keine stillschweigende Umklassifizierung. `categories.json` zeigt die vollständig aufgeschlüsselten Roh-/gzip-Summen aller drei Gruppen.

## Genau die fehlende Diagnose ergänzen

Der bestehende Budgetreport behält Schema, Summen, Limits, Kompressionsparameter und Exitverhalten. Ergänzt wird ausschließlich ein deterministisch nach gzip sortiertes `assets`-Inventar mit Dateipfad, Erweiterung, Roh-/gzip-Größe, bestehender Kategorie und SHA-256. Der Report wird weiterhin VOR einem Fehlerexit geschrieben. Drei vorhandene Revisionsjobs laden ihn unter Run-/Attempt-/Job-gebundenem Artefaktnamen hoch, auch wenn der Budgetcheck fehlschlägt. Bisher war kein entsprechender Upload vorhanden. Pinned bestehende upload-artifact-Version, unveränderte Berechtigungen/Schutzregeln; kanonische Quelle mittels `sync:github-workflows` gespiegelt.

## Kein künstlicher Produktfix

Die naheliegende größte Wortmarke (RGBA, 2048×768, keine Metadatenblöcke) wurde nur im Speicher mit Pillow PNG optimize/compress_level=9 neu kodiert: vorher/nachher jeweils 1.268.989 B, **0 B Einsparung**. Das große Light-Appicon besitzt bereits RGB ohne redundanten Alpha-Kanal. Keine verlustbehaftete Quantisierung, Verkleinerung, transparenten Pixeländerungen oder Entfernung gebrauchter Alias-/PWA-/iOS-/Exportressourcen. Es wird keine allgemeine Unmöglichkeit weiterer Kompression behauptet; in diesem eng begrenzten Schritt wurde kein hinreichender verlustfreier Kandidat bewiesen. Alle Produktassets unverändert; Gesamtbudget bleibt rot.

## Gezielte Prüfung

- `timeout 30s node scripts/test-budget-file-evidence-0985426.mjs`: echte CLI auf kleiner temporärer Dist-Struktur, SHA-/gzip-/Kategorie-/Summengleichheit; zusätzlicher übergroßer Binärfall bleibt Exit 1 und sichert trotzdem vollständige Evidenz. Bestanden.
- `timeout 30s node scripts/test-build-budget-media-contract-097620.mjs`: bestehende Messdefinition und Start-CSS – bestanden.
- `timeout 30s node scripts/test-code-revision-automation-09190.mjs`: bestehender Revisionsworkflowvertrag – bestanden.
- Neuer Checker gegen vorhandenes Release-Dist: erwarteter Exit 1, 8.719.276 > 8.500.000. Kein Grünstatus erfunden.
- JSON-Artefakte und kanonische Workflowspiegel geprüft; keine vollständige Regression, kein neuer Build, keine Browser-/Bilddesignmatrix, keine CI-Läufe oder Produktionsaktionen ausgelöst.

Ergebnis: benötigte Dateievidenz wird künftig im tatsächlich ausführenden CI-Pfad erhalten. Kein nachgewiesener Produkt-Größenfix, kein Limitwechsel, kein Merge/Deployment/Promotion. Die genaue ursprüngliche #651-Dateiverteilung bleibt mangels jener Bytes historisch nicht rekonstruierbar; dieser Draft schließt die Diagnose-Lücke für die nächsten regulären Revisionsläufe.

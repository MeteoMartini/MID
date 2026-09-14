# MID v0.9.84.95 – Testbericht

## GitHub-/Basisprüfung vor dem Build
- Repository: `MeteoMartini/MID`.
- Erfolgreicher Stable-Ausgangspunkt: **v0.9.84.93**, Installer **#1047**.
- `mid-stable`: Commit `aa54eac98d5e8ebea739f3ad98edb923a8ef2d7b` (`Install MID v0.9.84.93`).
- Fehlgeschlagener Upload: Installer **#1048**, Run `34808567755`, Upload-Commit `447166f333cc178c4ee598a68e2e8903656ca838`.
- GitHub-Job `MID installieren, prüfen und bauen` scheiterte im Schritt **„Produktionsbuild und Regressionstests ausführen“**; nachfolgende Worker-/Pages-/Promotion-Schritte wurden nicht ausgeführt.

## Lokal reproduzierter Release-Gate-Fehler
Auf dem v0.9.84.94-Kandidaten schlug `scripts/test-navigation-composite-ruc-098491.mjs` reproduzierbar fehl. Der Test erwartete den alten Konturpfad ohne expliziten Renderer und verbot zugleich `L.svg({pane:'mid-model-lines', ...})`, obwohl v0.9.84.94 diesen Renderer bewusst zur sicheren Pane-/Z-Index-Bindung einführt.

Nach der ersten Korrektur wurde die komplette lokale Sammlung von **788** automatisch erkannten Regressionen einmal statisch durchlaufen. Ohne installierte Projektabhängigkeiten sind 109 davon in dieser Arbeitsumgebung nicht ausführbar (vor allem `typescript-strada`, lokale Typdefinitionen bzw. die abweichende globale TypeScript-Version). Entscheidend für den Hotfix: Der Durchlauf deckte zusätzlich vier echte, von v0.9.84.94 veraltete String-/Quelltextverträge auf. Nach deren Korrektur blieben in den geänderten Bereichen keine weiteren inhaltlichen Assertion-Fehler zurück; die verbleibenden lokalen Ausfälle sind abhängigkeits-/Compilerbedingt und werden nicht als bestanden ausgegeben.

## Korrigierte Altverträge
- `test-navigation-composite-ruc-098491.mjs` – expliziter, panegebundener SVG-Renderer plus panegebundene Polylines.
- `test-mobile-dayrange-contour-overlays-071083.mjs` – derselbe aktuelle Kontur-/Renderervertrag.
- `test-optional-bottom-navigation-09790.mjs` – sichtbar bleibender 26-px-Griff statt historischem 13-px-Wert.
- `test-performance-openmeteo-contours-071070.mjs` – Modelllinien-Pane darf durch Modellframe, Grid-Isohypsen oder Druckzentren bereitgestellt werden.
- `test-detail-wind-gust-reconciliation-071061.mjs` – visuelle monotone Kurvenführung bei unveränderter punktweiser Wind-/Böen-Plausibilisierung.

## Erfolgreiche fokussierte Prüfungen
Erfolgreich ausgeführt wurden unter anderem:
- Bottom-Bar/Komposit/Isohypsen: `test-bottom-bar-current-persistence-isohypses-098492`, `test-bottom-bar-settings-synoptic-polish-098493`, `test-navigation-composite-ruc-098491`, `test-optional-bottom-navigation-09790`.
- iOS/Responsive: `test-ios-floating-bottom-bar-098489`, `test-viewport-textflow-098485`, `test-view-simulation-bottom-isohypsen-smoothing-098494`, `test-appwide-readability-continuation-098479`.
- Synoptik/Konturen: `test-mobile-dayrange-contour-overlays-071083`, `test-performance-openmeteo-contours-071070`, `test-synoptic-isoheight-visibility-098455`, `test-composite-synoptic-completeness-098456`, `test-composite-layer-density-098488`.
- Tagesansicht: `test-detail-wind-gust-reconciliation-071061`, `test-chart-layout-079`.
- Release-Verträge: `test-versioning`, `test-aggregate-version-contract-09613`, `test-baseline-079526-contract`, `test-release-lineage`, `test-release-upload-budget-097410`.
- Syntax: `node --check` für `worker.js`, `worker/metar-proxy.js`, `worker-src/00-core-observations.js` und die fünf angepassten Regressionen.

## Vollständiger lokaler Build
Ein lokales `npm ci` wurde versucht, blieb in der isolierten Arbeitsumgebung am Pakettransport hängen und wurde abgebrochen. Deshalb wird weder der vollständige TypeScript/Vite-Build noch die vollständige 788/788-Suite lokal als bestanden behauptet. Der GitHub-Installer mit Node.js 22 und reproduzierbarer Lockfile-Installation bleibt das definitive Voll-Gate.

## Worker
Kein fachlicher Worker-Unterschied zu v0.9.84.93 nach Neutralisierung der Versionskennung. **Worker-Upload nicht erforderlich.**

## Release-Paketierung
Das Professional-Release wurde nach dem kanonischen Transportvertrag erstellt: ohne `.github`, `dist`, `node_modules`, `artifacts` und `ios/App/App/public`; diese Inhalte werden im Installer bzw. nach dem verifizierten Build regeneriert. Die ZIP-Integrität wurde mit `unzip -t` geprüft, die Pflichtdateien sind enthalten und das Archiv bleibt unter dem internen 24-MB-Sicherheitslimit für den Browser-Upload. Anschließend wurde derselbe fokussierte Hotfix-/Responsive-/Versionsvertrag nochmals direkt aus einem frisch entpackten Release erfolgreich geprüft.

# MID v0.9.84.92 – Testbericht

## GitHub-Basis
Installer #1045 für v0.9.84.91 wurde vollständig erfolgreich abgeschlossen: Produktionsbuild und Regressionen, Capacitor-iOS-Übernahme, Worker-0%-Smoke/100%-Promotion, GitHub Pages und Fast-Forward-Promotion nach `mid-stable`. v0.9.84.92 wurde auf genau diesem stabilen Stand weiterentwickelt.

## Lokal bestandene fokussierte Regressionen
- `test-bottom-bar-current-persistence-isohypses-098492.mjs`
- `test-navigation-composite-ruc-098491.mjs`
- `test-ios-floating-bottom-bar-098489.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-synoptic-regional-fronts-098488.mjs`
- `test-current-header-density-098472.mjs`
- `test-viewport-textflow-098485.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`

Zusätzlich wurden die angrenzenden Modern-/Mehr-/Bottom-Bar-Verträge während der Umsetzung angepasst und erfolgreich ausgeführt.

## Syntax / generierte Aggregate
- `src/App.tsx` und `src/RadarPanel.tsx`: TSX-Syntax per `transpileModule` geprüft.
- `worker/metar-proxy.js` und `worker.js`: `node --check` bestanden.
- Service Worker: Syntaxprüfung bestanden.
- `worker/metar-proxy.js` / `worker.js` entsprechen wieder den kanonischen `worker-src`-Modulen.
- `src/styles.css` entspricht den `styles-src`-Modulen.
- Versionsmetadaten sind auf **0.9.84.92** synchronisiert.

## Vollständiger lokaler Testlauf – Umgebungsgrenze
Der komplette Aggregatlauf wurde angestoßen, ist in der isolierten Transportumgebung aber kein valider Ersatz für GitHub Actions: das ausgelieferte Quell-ZIP enthält absichtlich keine `node_modules`; mehrere ältere Tests benötigen `typescript-strada`. Ein reproduzierbares `npm ci` wurde versucht, lief jedoch in den Pakettransport-Timeout. Die global vorhandene TypeScript-Version unterscheidet sich außerdem von der im Projekt gepinnten zukünftigen Version. Deshalb wird **kein vollständiger lokaler 100%-Gesamttest behauptet**.

Der nächste GitHub-Installer bleibt das definitive Voll-Gate mit projektgepinnter Node-/npm-/TypeScript-Umgebung. Die für die vier geänderten Bereiche maßgeblichen Regressionen sind lokal grün.

## Verpackungsprüfung
Vor Freigabe werden Professional- und Worker-ZIP frisch erzeugt, mit `unzip -t` geprüft, ohne `node_modules` verpackt und die wesentlichen Regressionen nochmals gegen den entpackten Release-Inhalt ausgeführt.

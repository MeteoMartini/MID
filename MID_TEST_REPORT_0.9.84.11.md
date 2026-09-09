# MID v0.9.84.11 – Testbericht

## Gezielte Skybar-Prüfung

Bestanden:

- `test-weather-profile-skybar-pills-097723.mjs`
- `test-skybar-sun-cloud-exclusive-097863.mjs`
- `test-skybar-sunshine-time-alignment-097881.mjs`
- `test-skybar-four-thickness-appwide-09799.mjs`
- `test-skybar-daylight-no-gaps-097913.mjs`
- `test-parallel-merge-skybar-phase-097839.mjs`
- `test-skybar-shower-overlay-cloud-priority-098411.mjs`

Damit sind insbesondere geschützt: 69-%-Gesamtbewölkungsfall, Wolkenpriorität vor Sonnenscheindauer, komplementäres gelbes Grundband unter 50 % Gesamtbewölkung, sonnige Schauer als Niederschlags-Overlay, Verdecken des Grundbands bei gleich dicker/dickerer Niederschlagslage, Phasenfarben sowie die appweite zentrale Skybar-Einbindung.

## Release-/Syntaxprüfungen

Bestanden:

- `node --experimental-strip-types --check src/detailSkyBar.ts`
- Worker-Syntax für `worker.js` und `worker/metar-proxy.js`
- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-lineage.mjs`
- `test-release-upload-budget-097410.mjs`
- `worker.js` und `worker/metar-proxy.js` bytegleich
- Worker-Semantik gegenüber v0.9.84.9 nach Normalisierung von `WORKER_VERSION` bytegleich

## Breiter Regressionslauf in der isolierten Umgebung

Automatisch erkannt: **726** Tests.

- **619 bestanden** ohne vollständige lokale NPM-Installation.
- **94** konnten wegen fehlender NPM-Module nicht ausgeführt werden.
- **12** brachen mit dem im Container vorhandenen alten TypeScript-CLI an der nicht unterstützten Option `--ignoreConfig` ab.
- **1** bereits im unveränderten Ausgangsstand v0.9.84.9 fehlschlagende Travel-/Water-Climatology-Regression blieb unverändert rot; der identische Test wurde gegen die hochgeladene Basis erneut ausgeführt und zeigt denselben Befund.

Es wurde kein neuer Skybar-bezogener Regressionsfehler festgestellt.

## Produktionsbuild / iOS

`npm ci` konnte in der isolierten Umgebung nicht vollständig abgeschlossen werden: der Online-Lauf lief in einen Transport-Timeout, der Offline-Lauf bestätigte einen nicht vorhandenen Cache-Eintrag (`yauzl-2.10.0.tgz`). Deshalb wurden der vollständige TypeScript-7-/Vite-Produktionsbuild und ein echter `cap sync ios` hier nicht als bestanden ausgegeben.

Die Release-/iOS-Versionsmetadaten wurden reproduzierbar synchronisiert: MID v0.9.84.11, iOS `MARKETING_VERSION = 0.9.84`, `CURRENT_PROJECT_VERSION = 12`. Die eingebettete iOS-Webkopie wird gemäß Releasevertrag erst nach einem vollständigen Build/Capacitor-Sync regeneriert.

## ZIP-Nachprüfung

Die unversionierte Professional-ZIP wurde separat entpackt. Darin wurden Paket-/Baseline-Version, die sieben gezielten Skybar-Regressionen, Versions-/Lineage-Regressionsschutz, `detailSkyBar.ts`-Syntax, beide Worker-Syntaxprüfungen und die Bytegleichheit von `worker.js`/`worker/metar-proxy.js` erneut geprüft. Ausschlüsse für `node_modules`, `dist`, `.git`, `.github` und `ios/App/App/public` wurden ebenfalls bestätigt.

Nach Aufnahme dieses Prüfvermerks wird die finale ZIP deterministisch neu erzeugt und ihre ZIP-Integrität erneut geprüft.

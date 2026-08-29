# MID v0.9.69.0 – DWD ICON-D2-RUC / RUC-EPS Forward-Port

## Umsetzung

- Die in MID 17.7.3/v0.9.67.11 definierte RUC-Fachlogik wurde gezielt auf den neueren gemeinsamen Browser/PWA/iOS-Quellstand v0.9.68.2 vorwärts portiert; neuere native Standort-, OAuth-, Share-/Import-/Export- und Capacitor-Stände bleiben erhalten.
- ICON-D2-RUC kalibriert ausschließlich die kanonischen Best-Match-Stunden 0–14 h im RUC-Gebiet. Temperatur, Taupunkt, MSL-Druck, Wind/Böen/-richtung, Feuchte, Bewölkung, CAPE/CIN und Niederschlag werden mit fachlichen Begrenzungen eingebunden.
- Ein eigener RUC-Stundenparser akzeptiert den echten hourly-only-Vertrag und verlangt weder Tagesdaten noch eine deterministische Niederschlagswahrscheinlichkeit.
- ICON-D2-RUC-EPS wird als echtes 20+-Member-fähiges Regionalensemble vor ICON-D2-EPS für kurzfristige Events genutzt, bleibt aber innerhalb derselben DWD-Ensemble-/Variantengruppe und wird in normalen 7-/14-Tage-Ensembles nicht zusätzlich geladen.
- Der Worker kann die vorverarbeiteten RUC-/RUC-EPS-Produkte über kleine R2-Byte-Range-Reads verwenden; bestehende optionale JSON-Punktadapter bleiben Fallback. Im Worker findet keine GRIB-/BUFR-Decodierung statt.
- Die DWD-Vorverarbeitung sucht den jüngsten gemeinsamen vollständigen RUC/RUC-EPS-Lauf, dekodiert mit ecCodes, wählt explizit die vollen Stunden 0…14, prüft das gemeinsame native Gitter, erzeugt einen fail-closed räumlichen Lookup und veröffentlicht `latest.json` erst nach vollständigen Laufobjekten.
- Die appweite Regel „Gewitter erst bei beobachtetem Blitz“ bleibt auch bei numerischem RUC erhalten.

## Kosten-/Aktivierungsstatus

Die R2-/GitHub-Actions-Produktionspipeline ist absichtlich standardmäßig deaktiviert. `MID_RUC_PIPELINE_ENABLED` wird nicht gesetzt und kein R2-Bucket/Accountdienst aktiviert. Eine Aktivierung darf erst nach transparenter Kostenprüfung und ausdrücklicher Freigabe erfolgen. Ohne Aktivierung bleibt die App über Best Match/ICON-D2/ICON-D2-EPS vollständig funktionsfähig.

## Plattformvertrag

Browser/PWA und iOS verwenden unverändert denselben React/Vite-Fachkern und denselben Worker. Es wurde kein iOS-Fork angelegt. Der nächste native Meilenstein `lifecycle-offline-resume-without-local-data-loss` bleibt unverändert.

## Regression / Freigabe

- Neue RUC-Pipeline-/Runtime-Regressionen: **2/2 bestanden**.
- Gezielte RUC-, Best-Match-, Forecast-Fusion-, Ensemble-, Versions-, Baseline- und Cross-Platform-Regressionen: **bestanden**.
- Vollständige automatisch erkannte MID-Suite: **533/558 lokal ausführbar und bestanden**. Die übrigen **25/558** besitzen keinen fachlichen Assertion-Fehler, sondern können nach einem abgebrochenen `npm ci` ausschließlich wegen fehlender lokaler Build-Abhängigkeiten nicht starten: 17 Tests melden leere/nicht geladene `@types/*`-Pakete (`TS2688`), 8 Extremflächen-Tests melden fehlendes `esbuild` (`ERR_MODULE_NOT_FOUND`).
- Registrydiagnose: `npm ci` und `npm ping` scheitern in der aktuellen Laufzeit reproduzierbar an der nicht erreichbaren npm-Registry/DNS-Auflösung (`EAI_AGAIN` bzw. Timeout). Der beschädigte partielle `node_modules`-Baum wird **nicht** ausgeliefert.
- TypeScript-Fachcode wurde vor dem fortschreitenden Registry-Abbruch mit der verfügbaren TypeScript-5.8.3-Laufzeit erfolgreich `--noEmit` geprüft; der lockfile-genaue Compiler 5.9.3 kann in dieser Laufzeit nicht neu installiert werden.
- Browser-Vite-Produktionsbuild und `cap sync ios` können lokal nicht erneut ausgeführt werden, weil `vite`, `esbuild` und `@capacitor/cli` durch denselben Registryfehler fehlen. Der gemeinsame Cross-Platform-/iOS-Strukturvertrag und die bestehenden nativen Adaptertests laufen grün; Xcode-Marketing-/Buildversion ist auf v0.9.69/1 synchronisiert.
- Der Release ist deshalb ein **CI-validierbarer Kandidat**. Vor Stable-Aktivierung muss die reguläre GitHub-Releaseprüfung mit erfolgreichem `npm ci`, TypeScript 5.9.3, Vite-Build, allen 558 Regressionen und Capacitor-Sync vollständig grün sein.

## Worker-Release

Worker-Upload ist für v0.9.69.0 erforderlich, da Forecast-Fusion, RUC/RUC-EPS-Punktpfad und Regionalensemble-Proxy geändert wurden. Die R2-Produktivquelle selbst bleibt bis zur separaten Kostenfreigabe deaktiviert.

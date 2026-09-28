# MID v0.9.39.9

## CI-Regressionsfix nach erfolgreichem Installer und Produktionsbuild

Der v0.9.39.8-Installer erreichte auf GitHub erstmals wieder erfolgreich den Produktionsbuild und die Regressionstests. Der anschliessende Fehler lag ausschliesslich in `scripts/test-install-node-modules-directory-bootstrap-09397.mjs`.

Der historische Test untersuchte das reale Projektverzeichnis `node_modules/` und verlangte dort den einmaligen Release-Bootstrap (`node_modules/minimist/` leer). Die Regressionstests laufen jedoch erst nach `npm ci`; zu diesem Zeitpunkt ist `node_modules/` bestimmungsgemaess vollstaendig mit allen Abhaengigkeiten befuellt. Damit war der Test nach erfolgreicher Installation zwangslaufig falsch-negativ.

v0.9.39.9 entkoppelt die Regression vom Live-Installationsverzeichnis. Der alte `rsync --delete`-/`diff`-Vertrag wird nun vollstaendig in einem temporaeren Checkout simuliert, inklusive geschuetztem `node_modules/minimist/.git`-Rest und einer zu loeschenden Altdatei. Der Test prueft damit weiterhin die reale Fehlerklasse, ohne mit dem von `npm ci` erzeugten Laufzeitverzeichnis zu kollidieren.

Der einmalige Bootstrap im Replacement-ZIP bleibt fuer den noch nicht aktualisierten Installer auf `main` erhalten: `node_modules/` und `node_modules/minimist/` werden als leere Verzeichnisse ausgeliefert; keine Node-Pakete sind Bestandteil des Releases.

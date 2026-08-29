# MID v0.9.73.9 – Helles/dunkles MID-Logo und reparierte Wolkenkästchen

## Anlass

Für die MID-Oberfläche sollten die beiden neu entworfenen MID-Logovarianten direkt in der App nutzbar werden: ein dunkles Logo für helle Layouts und ein helles Logo für dunkle Layouts. Zusätzlich sollte die Auswahl in den Einstellungen überschreibbar sein.

Parallel war das Wolkenband im 24-h-Wetterprofil regressiv verschlechtert: Die drei Wolkenschichten wirkten visuell von den stündlichen Spalten entkoppelt und verloren die zuvor saubere Einbindung in das übrige Profilraster.

## Umsetzung

### 1. Appweites MID-Logo-Branding

- Beide gelieferten Logo-Dateien wurden als öffentliche App-Assets eingebunden:
  - `public/mid-logo-dark.png`
  - `public/mid-logo-light.png`
- Der Kopfbereich der App nutzt nun kein starres Einzel-Logo mehr, sondern ein auf Theme/Layout aufgelöstes Branding.
- Neue Einstellungsoption `MID-Logo` in den Darstellungs-/Branding-Einstellungen:
  - `Auto`
  - `Dunkles Logo`
  - `Helles Logo`
- `Auto` folgt dem Layoutkontrast:
  - dunkles Logo auf hellen Flächen
  - helles Logo auf dunklen Flächen
- Die Auswahl wird persistent in `localStorage` gespeichert und beim Start sofort wiederhergestellt.
- Bereits der Startbildschirm / Boot-Shell und das geladene Favicon übernehmen die gewählte bzw. automatisch aufgelöste Logovariante.
- Beide Logo-Varianten wurden zusätzlich in die Shell-Caches aufgenommen, damit das Branding auch offline konsistent verfügbar bleibt.

### 2. Reparatur der Wolkenkästchen im 24-h-Wetterprofil

- Die bisher wieder eingeführten bandartigen, über die gesamte Breite gezogenen Wolkenflächen wurden zurück in eine klar spaltengebundene Kartenlogik überführt.
- Jede Stunde erhält nun wieder sauber eingerückte, eigenständige H/M/L-Wolkenkästchen, die exakt an den übrigen Stundenwerten ausgerichtet sind.
- Ergänzt wurden dezente `cloud-cell-frame`-Rahmen, damit auch schwach bewölkte oder leere Felder optisch sauber im Raster verankert bleiben.
- Die Füllung bleibt weiterhin neutral grau mit weicheren Übergängen und bedeckungsabhängiger Dunkelheit; die frühere regressiv wirkende losgelöste Vollbandoptik entfällt.
- Die vertikale Reihenfolge H/M/L bleibt explizit geschützt.

## Validierung

Lokal erfolgreich ausgeführt:

- `npm run maintain:aggregates`
- `node --check worker/metar-proxy.js`
- `node --check worker.js`
- `node scripts/test-logo-cloud-profile-09739.mjs`
- `node scripts/test-cockpit-meteogram-pro-09180.mjs`
- `node scripts/test-dwd-radar-meteogram-alignment-09211.mjs`
- `node scripts/test-mid-original-dwd-weather-profile-09310.mjs`
- `node scripts/test-mid-weather-profile-thermal-sun-09320.mjs`
- `node scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs`

## Bekannte Gate-Grenze

Die lokale Linux-Arbeitskopie bleibt weiterhin von einem bereits bekannten Paket-/`node_modules`-Problem betroffen. Deshalb lassen sich TypeScript/Vite und die komplette Suite in dieser extrahierten Umgebung aktuell nicht verlässlich bis zum Ende ausführen; dieselbe Grenze war bereits im Status dokumentiert. Für den vollständigen Freigabenachweis bleibt das Release-CI-Gate maßgeblich.

## Worker

Diese Änderung ist funktional browser-/UI-seitig. Es wurde keine fachliche Worker-Logik für Datenabruf, Fusion oder Ausgabe geändert. Ein Worker-Upload ist für diese Hotfix-Etappe fachlich nicht erforderlich.

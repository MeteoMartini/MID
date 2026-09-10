# MID v0.9.84.28 – Testbericht

## Geprüfter Umfang
Der Release basiert auf dem vom Nutzer bereitgestellten v0.9.84.27-Stand und ändert ausschließlich den Windows-Widget-Export, Dokumentation, Versionierung und den zugehörigen Regressionstest.

## Verbindliche Prüfungen
- Firmenclient-Vertrag: kein Node.js/npm/winget und keine Administratorrechte als Voraussetzung.
- Keine Security-Overrides (`--ignore-certificate-errors`, `--no-sandbox`, `ExecutionPolicy Bypass`).
- Microsoft-Edge-Erkennung in Standardinstallationspfaden.
- Lokale CDP-Kommunikation ausschließlich über `127.0.0.1`.
- Warten auf `midWidgetReady=ready` und Crop der `.weatherwidget`-Fläche per `Page.captureScreenshot`.
- Zwölf ECMWF-Light-Links für drei Orte, zwei Ansichten und 5/7 Tage.
- Transaktionales Staging: vorhandene PNGs werden erst nach vollständigem Erfolg ersetzt.
- Browser-Fallback vorhanden, falls eine Unternehmensrichtlinie Headless/DevTools blockiert.

## Laufzeitprüfung
Der gezielte neue Regressionstest und der bestehende Widget-Rendervertrag werden lokal ausgeführt. Vor ZIP-Freigabe läuft außerdem einmal der vorhandene `release:preflight` des Projekts; die Ergebnisse werden nach Laufabschluss in diesem Bericht ergänzt.

## Windows-Firmenclient
Ein echter Unternehmensclient mit den konkreten Gruppenrichtlinien steht in der Build-Umgebung nicht zur Verfügung. Das ist bewusst kein Grund, Sicherheitsmechanismen zu simulieren oder zu umgehen. Der Code ist deshalb fail-closed ausgelegt: Richtliniensperren führen zum Browser-Fallback und lassen bestehende PNGs unverändert.

## Ergebnis der lokalen Freigabeprüfung
Erfolgreich ausgeführt wurden:
- `node --check worker.js`
- `node --check worker/metar-proxy.js`
- `test-widget-corporate-client-098428.mjs`
- `test-widget-render-readiness-098424.mjs`
- `test-versioning.mjs`
- `test-baseline-079526-contract.mjs`
- `test-release-lineage.mjs`
- `test-release-upload-budget-097410.mjs`

Der vollständige lokale `release:preflight` konnte in dieser isolierten Build-Umgebung nicht abgeschlossen werden, weil `npm ci` keine Pakete aus dem npm-Registry beziehen konnte und kein npm-Cache vorhanden ist. Es wurde kein zweiter paralleler Testlauf erzwungen. Die fachlich unveränderte App-Basis v0.9.84.27 war bereits der aktuelle `main`-/`mid-stable`-Stand; die neue Änderung ist auf den Widget-Export begrenzt. Der normale GitHub-Installer bleibt das vollständige Build-/Regressionsgate beim Einspielen des Release-ZIPs.

## Worker
Keine fachliche Worker-Änderung. Die Versionsmarke wurde auf v0.9.84.28 synchronisiert. `MID-worker.zip` wird deshalb als gekoppeltes Notfall-/Audit-Artefakt erzeugt; ein manueller Worker-Upload ist für diese Änderung nicht erforderlich.

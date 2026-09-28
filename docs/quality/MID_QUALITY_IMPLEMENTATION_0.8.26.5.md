## MID v0.8.26.5 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab v0.8.26.4. Die Recharts-3-Laufzeitdarstellung wurde korrigiert und die Datenherkunft der bestehenden Flugwetterdiagnosen präzisiert; es wurde kein eigenständiges neues Datenprodukt eingeführt.

### Ensemble-Diagramme

- Liveansicht verwendet den nativen responsiven Modus von Recharts 3.
- Reale Wrapperhöhe und eine belastbare Mindesthöhe verhindern 0-Pixel-Diagramme.
- Temperatur-, Niederschlags- und Winddiagramme nutzen denselben abgesicherten Livepfad.
- Feste PNG-Exportgeometrie bleibt getrennt und unverändert.

### Meteogramme / DWD-Flugwetterdaten

- Aktuelle Vereisungs- und Turbulenzfelder als MID-Diagnosen gekennzeichnet.
- Keine irreführende Gleichsetzung mit ADWICE oder WAWFOR-EDP.
- DWD-Datenzugang und technische Voraussetzungen in separatem Audit dokumentiert.
- Eine direkte DWD-Einbindung wird erst bei vorhandenem WAWFOR-Vertrag, Zugangsdaten und serverseitigem GRIB2-Ingest umgesetzt.

### Prüfung

- alle 188 automatisch erkannten Regressionstests einzeln bestanden
- 68 TypeScript-/TSX-Dateien parsergeprüft
- 194 JavaScript-/MJS-Dateien syntaktisch geprüft
- Worker syntaktisch geprüft
- Paket, Lockfile, Baseline, Frontend, beide Service Worker und Worker versionssynchron
- keine generierten TypeScript-/Vite-Artefakte im Release

Der vollständige lokale Produktionsbuild konnte nicht ausgeführt werden, weil die Projektabhängigkeiten in der isolierten Umgebung nicht installiert werden konnten; der interne Paketspiegel lieferte `yallist-3.1.1.tgz` mit HTTP 404. Der GitHub-Workflow führt den vollständigen Build mit installierten Abhängigkeiten aus.

### Worker

Kein funktionaler Worker-Umbau. Der Worker wurde nur versionssynchronisiert.

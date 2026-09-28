## MID v0.8.26.1 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.0**, da ausschließlich die Recharts-3-Migration buildfähig korrigiert und zusätzlich abgesichert wurde.

### Korrekturen

- ungenutzte Konstante `ENSEMBLE_EXPORT_PLOT_WIDTH` entfernt
- nicht mehr unterstütztes Recharts-Prop `isFront` bei beiden `ReferenceDot`-Markern entfernt
- offizielle Recharts-3-Ebenensteuerung über `zIndex={800}` eingesetzt
- Niederschlags- und Hazardmarker bleiben oberhalb der Diagrammflächen sichtbar
- bestehende Exportgeometrie-Regression auf die tatsächlich verwendeten vier Exportbreiten umgestellt
- neue AST-basierte Regression gegen beide gemeldeten Buildfehler ergänzt
- Versionsprüfung für spätere Wartungsreleases entkoppelt

### Prüfung

- alle 184 automatisch erkannten MID-Regressionstests bestanden
- 68 TypeScript-/TSX-Dateien parsergeprüft
- 189 JavaScript-/MJS-Dateien syntaktisch geprüft
- Worker syntaktisch geprüft
- Paket-, Lockfile-, Baseline-, Frontend-, Worker- und Service-Worker-Version synchron
- Release enthält keine generierten TypeScript-/Vite-Artefakte

Ein vollständiger lokaler `npm ci && npm run build` war in der isolierten Umgebung nicht möglich, weil der interne Paketspiegel die benötigten Archive `yallist-3.1.1.tgz` und anschließend `vite-6.4.3.tgz` mit HTTP 404 beantwortete. Die beiden im GitHub-Build konkret gemeldeten TypeScript-Ursachen wurden direkt beseitigt und durch neue Regressionen geschützt.

### Worker

- keine funktionale Änderung
- lediglich auf **v0.8.26.1** versionssynchronisiert

## MID v0.8.26.6 umgesetzt

**Versionsbewertung:** Wartungsrelease ab v0.8.26.5, da ausschließlich ein TypeScript-Buildfehler im bestehenden Wasserwetter-Modul behoben wurde.

### Ursache

`src/WaterSportsPanel.tsx` enthielt in `movingAverage` den Callback-Parameter `value`, obwohl nur `index` benötigt wurde. Wegen `noUnusedParameters: true` brach der Produktionsbuild mit `TS6133` ab.

### Korrektur

- ungenutzten Callback-Parameter durch `_` ersetzt
- Gezeitenberechnung unverändert erhalten
- gezielte Regression gegen erneute Einführung des ungenutzten Parameters ergänzt
- Ensemble-/Flugwetterquellen-Regression von einer fest verdrahteten Einzelversion auf die Wartungslinie ab v0.8.26.5 umgestellt

### Funktionale Auswirkungen

Keine. Wasserwetter, Gezeiten, Wendepunkte, Ensemble-Diagramme und Flugwetterdiagnosen bleiben unverändert.

### Prüfung

- 189 automatisch erkannte Regressionstests bestanden
- 195 JavaScript-/MJS-Dateien mit `node --check` ohne Syntaxfehler
- 66 TypeScript-/TSX-Dateien parsergeprüft
- keine verbleibenden TS6133-/TS6196-/TS6198-Diagnosen im Quellstand
- Worker syntaktisch geprüft
- Paket, Lockfile, Baseline, Frontend, beide Service Worker und Worker auf v0.8.26.6 synchronisiert

### Einschränkung der lokalen Buildprüfung

Ein vollständiges lokales `npm ci && npm run build` war in der isolierten Umgebung nicht möglich, weil der interne Paketspiegel benötigte Archive wie `yallist-3.1.1.tgz` beziehungsweise `vite-6.4.3.tgz` mit HTTP 404 beantwortete. Der konkret gemeldete TypeScript-Buildfehler wurde direkt beseitigt und durch eine Regression geschützt.

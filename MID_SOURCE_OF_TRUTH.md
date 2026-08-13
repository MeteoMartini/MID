# MID – verbindliche Codebasis

## Technischer Ausgangspunkt

Für jede weitere Entwicklung gilt ausschließlich der GitHub-Zweig `mid-stable` im Repository `MeteoMartini/MID` als Codebasis. Dieser Zweig wird vom Release-Workflow erst aktualisiert, nachdem Build, sämtliche Regressionstests und das GitHub-Pages-Deployment erfolgreich waren.

`main`, ältere ZIP-Dateien, Chat-Anhänge, Chat-Zusammenfassungen und Erinnerungen dienen nur zur fachlichen Einordnung. Sie dürfen niemals ohne Abgleich mit `mid-stable` als Quellcodebasis verwendet werden.

## Pflichtprüfung vor jeder Änderung

1. `package.json` aus `mid-stable` lesen.
2. `MID_BASELINE.json` aus `mid-stable` lesen.
3. Releaseversion, Linie, Referenzcommit und Pflichtregressionen prüfen.
4. Erst danach den vollständigen Quellstand aus `mid-stable` übernehmen.
5. Bei fehlender oder widersprüchlicher Basis keinen neuen Release erzeugen.

## Verbindliche Anweisung für neue MID-Chats

> Nutze ausschließlich `MeteoMartini/MID`, Branch `mid-stable`, als Codebasis. Lies zuerst `MID_BASELINE.json` und `package.json`. Verwende weder ältere Uploads noch aus Chats rekonstruierte App-Stände. Brich ab, wenn die Basis nicht eindeutig verifiziert ist.

## Versionslogik

- Funktionale Erweiterung: nächste dreiteilige Funktionsversion.
- Fehlerkorrektur, Regression oder technische Wartung: nächste vierteilige Wartungsversion.
- Die Releaseversion wird zentral aus `package.json` in App, Worker, Service Worker, `version.json` und `MID_BASELINE.json` synchronisiert.

## Release-, Abhängigkeits- und Wartungsvertrag ab v0.8.26.0

- Paketversion, Rootversion des `package-lock.json`, `MID_BASELINE.json`, Frontend, Worker, Service Worker und `version.json` werden ausschließlich über `npm run sync-version` gemeinsam fortgeschrieben.
- Der Produktionsbuild führt TypeScript-Prüfungen mit `--noEmit` aus. `*.tsbuildinfo`, generierte `vite.config.js`/`vite.config.d.ts`, `node_modules` und `dist` gehören nicht zur verbindlichen Quell- oder Releasebasis.
- Die unterstützte Laufzeit ist in `package.json` festgelegt. Releases verwenden einen reproduzierbaren npm-Lockfile-Vertrag und dürfen keine internen oder lokalen Registry-URLs enthalten.
- GitHub Actions müssen auf vollständige Commit-SHAs festgeschrieben sein. Berechtigungen werden pro Job nach dem Minimalprinzip vergeben; Sicherheits- und Abhängigkeitsprüfungen dürfen den Funktions- und Regressionstest nicht ersetzen.
- Dependabot darf Aktualisierungsvorschläge erzeugen, aber keine Hauptversionsmigration automatisch zusammenführen. Funktionskritische Bibliotheken – insbesondere Diagramm-, Karten- und React-Hauptversionen – werden nur in einem eigenständig geprüften MID-Release migriert.
- Laufzeitcaches benötigen eine fachlich angemessene Ablaufzeit und eine feste Obergrenze. Beim Begrenzen dürfen bestehende Fallbacks, Offlinewerte oder Funktionen nicht stillschweigend entfallen.
- DOM-Beobachter sind auf den kleinsten fachlich erforderlichen Container und Ereignissatz zu beschränken. Dokumentweite Attributbeobachtung ist nicht zulässig, wenn dieselbe Funktion über Komponentenereignisse, Interaktion oder `ResizeObserver` erhalten werden kann.

## Verbindlicher UI- und Architekturvertrag ab v0.9.50.0

- `MID_UI_ARCHITECTURE_CONTRACT.md` ist für neue Sektionen, Menüs, Info-Schaltflächen, Tooltips, Drawer, Formatierungen und fachliche UI-Verbraucher verbindlich.
- Neue nicht-modale, verankerte Ebenen verwenden `src/AppPortalPopover.tsx`; appweite `(i)`-Hinweise verwenden `src/AppInfoPopover.tsx`/`AppInfoHint`.
- Neue Dateien dürfen keine zweite generische `createPortal`-/Außenklick-/Escape-Engine kopieren. Historisch spezialisierte Ensemble-Diagrammtooltips sind nur als regressionsgeschützte Ausnahme zulässig.
- Neue Sektionen dürfen appweite Wetter-, Niederschlags-, Wetterzwilling-, Stations-, Zeit- oder Einheitenlogik nicht lokal neu zusammensetzen, wenn dafür bereits ein kanonischer MID-Pfad existiert.
- Codebereinigungen dürfen geschützte Funktionen nicht entfernen. Strukturelle Vereinheitlichung ist nur zulässig, wenn die bestehenden Fach- und UI-Regressionen erhalten bleiben oder auf denselben, nun zentralen Vertrag aktualisiert werden.

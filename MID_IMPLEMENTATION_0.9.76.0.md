# MID v0.9.76.0 – TypeScript 7.0.2

## Ergebnis

Der getrennte TypeScript-7-Kompatibilitätsmeilenstein hebt den gemeinsamen
MID-Quellstand von TypeScript 5.9.3 auf exakt TypeScript 7.0.2. App- und
Node-Konfiguration kompilieren ohne fachliche Quellcodeänderung.

## Abgrenzung

- React, React DOM und react-is bleiben 18.3.1.
- Vite bleibt 6.4.3 und `@vitejs/plugin-react` bleibt 4.7.0.
- Browser, PWA und Capacitor-iOS nutzen unverändert denselben React/Vite-Kern;
  es entsteht kein iOS-Fork.
- Worker-Fachlogik, Forecast-Fusion, DWD-RUC/RUC-EPS, Karten, Persistenz und
  Apple-Capabilities bleiben unverändert.

## Reproduzierbarkeit

- `package.json` und `package-lock.json` schreiben TypeScript 7.0.2 exakt fest.
- Da TypeScript 7 die frühere JavaScript-Compiler-API nicht mehr exportiert,
  verwenden nur die API-basierten Regressionen den offiziellen Side-by-side-
  Ansatz über den Alias `typescript-strada` 6.0.3. Produkt-Typechecks und
  sämtliche `tsc`-Aufrufe bleiben TypeScript 7.0.2.
- Dependency-Policy und bestehende Wartungswächter wurden vom historischen
  Zurückstellungsstatus auf den qualifizierten Stable-Vertrag aktualisiert.
- Der neue Required Test
  `scripts/test-typescript-7-compatibility-09760.mjs` prüft Compiler, Lockfile,
  unveränderte Nachbar-Toolchain, No-Emit-Konfiguration, Dokumentation und
  Baseline-Schutz.

## Qualitätssicherung

Der lockfile-genaue Neuinstallationslauf mit `npm ci` ist reproduzierbar. App-
und Node-Typecheck sowie der Vite-Produktionsbuild mit 2665 transformierten
Modulen sind grün; alle 583 automatisch erkannten Regressionstests bestehen.
Der Audit mit High-Gate enthält keine hohen oder kritischen Befunde. Die drei
verbleibenden moderaten Hinweise liegen ausschließlich in der Capacitor-CLI-
Entwicklungskette und würden laut npm nur über einen erzwungenen Breaking-
Downgrade verändert.

`worker/metar-proxy.js` und `worker.js` sind bytegleich und syntaktisch gültig.
Der versionsbereinigte semantische Vergleich mit v0.9.75.0 ist unverändert.
`npm run ios:sync` war erfolgreich; sämtliche gemeinsamen Vite-Dateien sind im
Browser- und iOS-Webbundle bytegleich. Nur die von Capacitor erwarteten Brücken
`cordova.js` und `cordova_plugins.js` kommen in der nativen Kopie hinzu. Ein
manueller Worker-Upload ist nicht erforderlich, weil keine Worker-Semantik
geändert wurde.

# MID TypeScript-7-Kompatibilitätsvertrag

Stand: v0.9.76.0

## Verbindlicher Werkzeugstand

- TypeScript ist exakt auf `7.0.2` festgeschrieben; Bereichsangaben wie `^7.0.2`
  oder ein nicht synchrones Lockfile sind unzulässig.
- TypeScript 7 stellt die frühere Strada-JavaScript-Compiler-API nicht mehr am
  Paket-Root bereit. Ausschließlich API-basierte Regressionen verwenden deshalb
  den exakt gepinnten npm-Alias `typescript-strada` auf TypeScript `6.0.3`.
  App-/Node-Typecheck und alle `tsc`-Aufrufe verwenden weiterhin ausschließlich
  TypeScript 7.0.2.
- React/React DOM/react-is bleiben `18.3.1`, Vite bleibt `6.4.3` und
  `@vitejs/plugin-react` bleibt `4.7.0`.
- React 19, Vite 8 und plugin-react 6 sind ausdrücklich nicht Bestandteil
  dieses Meilensteins.

## Compiler- und Plattformgrenze

- App und Node-Konfiguration werden getrennt mit `tsc --noEmit` geprüft.
- `strict`, `isolatedModules`, `moduleResolution: Bundler` und die bestehenden
  No-Emit-/Unused-Verträge bleiben erhalten.
- TypeScript erzeugt keine Laufzeitartefakte. Browser, PWA und Capacitor-iOS
  verwenden weiterhin denselben von Vite gebauten React-Fachkern.
- Die Worker-Runtime bleibt JavaScript und erhält durch diesen Milestone keine
  fachliche Änderung.

## Freigabegate

Eine Stable-Übernahme ist nur zulässig, wenn mit dem lockfile-genauen Compiler
7.0.2 beide Typechecks, der Browser-Produktionsbuild, Worker-Syntax, die
vollständige MID-Regressionssuite, Capacitor-Sync und der bytegleiche
Gleichlauf aller gemeinsamen Browser-/iOS-Webbundle-Dateien grün sind. Der Required Test
`scripts/test-typescript-7-compatibility-09760.mjs` verhindert einen stillen
Rückfall auf TypeScript 5, direkte Strada-API-Imports aus dem TypeScript-7-Paket
oder die Kopplung an weitere Toolchain-Majors.

## Capacitor-Konfiguration im Release-CI

Die Produktquellen bleiben vollständig auf **TypeScript 7.0.2**. Die Capacitor-Metakonfiguration liegt jedoch bewusst als `capacitor.config.json` vor. Grund: Der bestehende Release-Installer verwendet Node 22.16; dort ist natives TypeScript-Stripping noch nicht standardmäßig aktiv, während TypeScript 7 die von älteren Loaderpfaden erwartete klassische Compiler-API nicht mehr bereitstellt. Eine JSON-Konfiguration benötigt weder die entfernte Compiler-API noch Laufzeit-Transpilation und hält `cap copy ios` sowie `cap sync ios` deshalb unabhängig von diesem Loaderdetail stabil. Dies ist **kein iOS-Fork** und verändert weder den React/Vite-Fachkern noch die native Capacitor-Hülle fachlich.

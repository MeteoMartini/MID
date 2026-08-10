# MID Dependency Upgrade Policy

Stand: MID Stable-Audit 10.08.2026

Der Stable-Channel erhält keine ungeprüften Major-/Toolchain-Sprünge. Der reproduzierbare Vertrag bleibt zunächst:

- React / React DOM / react-is: 18.3.1
- Recharts: 3.8.1
- TypeScript: 5.9.3
- Vite: 6.4.3
- @vitejs/plugin-react: 4.7.0

Recharts ist der früheste isolierte Upgrade-Kandidat, weil MID dafür bereits umfangreiche Diagrammregressionen besitzt. Ein Kandidat wie 3.10.x darf erst nach vollständigem Build, sämtlichen Ensemble-/Tooltip-/Export-/Responsive-Regressionen und Browserprüfung übernommen werden.

React 19, TypeScript 7 und Vite 8 werden nicht einzeln in `mid-stable` angehoben. Sie gehören in einen getrennten Kompatibilitätszweig mit vollständiger visueller, funktionaler, Performance-, PWA- und CI-Regression. Erst ein vollständig grüner Lauf darf den Stable-Vertrag ändern.

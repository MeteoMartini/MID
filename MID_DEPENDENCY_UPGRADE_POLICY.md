# MID Dependency Upgrade Policy

Stand: MID Stable-Audit 10.08.2026

Der Stable-Channel erhält keine ungeprüften Major-/Toolchain-Sprünge. Der reproduzierbare Vertrag bleibt zunächst:

- React / React DOM / react-is: 18.3.1
- Recharts: 3.10.1 (isoliert gegen Diagramm-/Tooltip-/Export-/Responsive-Verträge qualifiziert)
- TypeScript: 5.9.3
- Vite: 6.4.3
- @vitejs/plugin-react: 4.7.0
- Lucide React: 1.34.0 (React 18.3.1 bleibt unverändert)
- MapLibre GL JS: 6.5.0 (inkl. DOM-Sanitizing-Korrektur aus der 6.4.1-Linie)
- GitHub Actions: checkout 7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`) und setup-node 7.0.0 (`820762786026740c76f36085b0efc47a31fe5020`), jeweils SHA-gepinnt
- CodeQL: 4.37.7 (`ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd`), SHA-gepinnt
- Workflow-Aktivierung: Der Release-Installer verändert `.github` nicht selbst; checkout/setup-node/CodeQL werden über `npm run sync:github-workflows` ausdrücklich administrativ synchronisiert.

Sicherheits-Patches innerhalb kompatibler Transitivreihen werden im Stable-Channel unmittelbar angehoben, sobald `npm audit` einen Befund meldet und die vollständige Regression grün bleibt. Aktueller Mindestvertrag: `nanoid >=3.3.18` im 3.x-Pfad sowie `protocol-buffers-schema >=3.6.1`.

Recharts 3.10.1 ist nach dem isolierten Kandidatenlauf der neue Stable-Vertrag. Weitere Recharts-Minor-/Patch-Upgrades bleiben weiterhin an vollständigen Build sowie Ensemble-/Tooltip-/Export-/Responsive-Regressionen gebunden.

React 19, TypeScript 7 und Vite 8 werden nicht einzeln in `mid-stable` angehoben. Sie gehören in einen getrennten Kompatibilitätszweig mit vollständiger visueller, funktionaler, Performance-, PWA- und CI-Regression. Erst ein vollständig grüner Lauf darf den Stable-Vertrag ändern.

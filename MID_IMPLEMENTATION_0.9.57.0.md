# MID v0.9.57.0 – Zeitpfeil und kontrollierte Dependency-Wartung

## Kompositbild
- Die getrennten Schalter „Zugbahn“ und „Zeit · abs./rel.“ sind durch einen einzelnen Schalter „Zeitpfeil“ ersetzt.
- Der Zeitpfeil wird als lange, durchgehende Achse dargestellt und endet mit seiner Pfeilspitze exakt am gewählten Ort bzw. Standort.
- Die Richtung nutzt die Radar-Mehrframebewegung und verifiziert bzw. korrigiert sie mit der lokalen Schwerpunktlage des aktuellen Echofelds.
- Die Achse verwendet dezente absolute Stundenlabels und eine kompakte Richtungs-/Geschwindigkeitsbeschriftung.

## Freigegebene Wartungsupdates
- `lucide-react` 0.468.0 → 1.30.0.
- `recharts` 3.8.1 → 3.10.1 einschließlich Lockfile-Nachführung (`immer` 11.1.17, `reselect` 5.2.0).
- `actions/checkout` → SHA-gepinntes v7.0.1.
- `actions/setup-node` → SHA-gepinntes v7.0.0.
- React/React-DOM/react-is bleiben 18.3.1; TypeScript bleibt 5.9.3; Vite bleibt 6.4.3; `@vitejs/plugin-react` bleibt 4.7.0.

## Regression
- Neuer Vertrag `test-approved-dependency-upgrades-09570.mjs` schützt die freigegebenen und ausdrücklich zurückgestellten Upgrades.
- `test-github-actions-v7-sync-09570.mjs` prüft die explizite administrative Synchronisierung auch für zusätzliche vorhandene MID-Workflows, ohne die automatische `.github`-Selbstmodifikation wieder einzuführen.
- Neuer Vertrag `test-composite-time-arrow-09561.mjs` schützt den einzelnen langen Zeitpfeil.

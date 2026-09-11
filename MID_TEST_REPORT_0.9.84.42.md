# MID v0.9.84.42 – Testbericht

## GitHub #995 – Ausgangsbefund

Der reale Installerlauf #995 für v0.9.84.41 absolvierte `npm ci`, Dependency-Audit, TypeScript 7 und den Vite-Produktionsbuild erfolgreich. Der Abbruch erfolgte erst in der Regression mit 4/741 veralteten statischen Erwartungen.

## Lokal ausgeführte Zielprüfungen

- `test-hyperlocal-fields.mjs` – PASS
- `test-night-icons-astronomy-08130.mjs` – PASS
- `test-radar-phase-echo-recovery-09406.mjs` – PASS
- `test-ui-polish-night-icons-09145.mjs` – PASS
- `test-climate-hazard-widget-09804.mjs` – PASS

Die lokale Laufzeit enthält keinen vollständigen `node_modules`-Stand. Ein lokaler Komplettlauf mit der projektierten TypeScript-7-/Vite-Toolchain ist deshalb hier nicht belastbar möglich; der GitHub-Installer bleibt das vollständige fail-closed Release-Gate.

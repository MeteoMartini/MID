# MID v0.9.23.2

## CI-Hotfix
Der historische Wartungs-/Recharts-Test `test-maintenance-recharts3-cache-ci-08260.mjs` wurde vollständig CI-deterministisch gemacht.

- harte Release-Invarianten bleiben erhalten: Paket-/Lockfile-/Baseline-Version, Lockfile-Wurzel, Recharts/react-is, TypeScript/Vite und Cache-Verträge;
- Workflow-SHA-Prüfungen sind nur noch Diagnose, da dafür eigene Workflow-/CI-Regressionen existieren;
- keine Abhängigkeit mehr von Build-Artefakten, Dateisystemzustand, npm-Unterprozessen oder lokaler TypeScript-Auflösung;
- der eigentliche MID-Funktionsstand v0.9.23.x bleibt unverändert.

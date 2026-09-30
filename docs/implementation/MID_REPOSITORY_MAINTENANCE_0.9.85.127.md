# MID v0.9.85.127 · Repository-Hygiene und Governance

Basis: `mid-stable@81d2bfb9d872ba97f4e2a3fec82e92a6f8aefab0` (formal v0.9.85.126).

- Der bereits integrierte Funktionsstand aus PR #208 wird konsistent als v0.9.85.127 versioniert.
- Nicht mehr baselinegebundene historische Root-Dokumente werden referenzbewusst nach `docs/` verschoben.
- Neue versionsbezogene Implementierungs-, Audit- und Handoff-Dokumente entstehen ab diesem Stand nicht mehr im Root.
- Der Branch-Cleanup löscht nur alte, ungeschützte Branches ohne offenen PR, deren Head vollständig in `main` oder `mid-stable` enthalten ist.
- `contracts/index.json` registriert die weiterhin normativen Markdown-Verträge maschinenlesbar.
- Agent-Branches verwenden `<agent>/v<version>-<topic>`; vor neuer Arbeit wird auf überlappende offene PRs/Branches geprüft.
- KNMI-Diagnoseworkflows werden auf die weiterhin benötigten produktionsnahen Checks reduziert und historische Diagnosen archiviert.
- Vitest/V8-Coverage wird ergänzend eingeführt, ohne die bestehende Regression-Suite zu ersetzen.

Meteorologische Fachlogik, Warnschwellen, Modellfusion und Datenquellen werden nicht verändert.

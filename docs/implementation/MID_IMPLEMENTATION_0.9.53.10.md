# MID v0.9.53.10

## Dependency-Sicherheitswartung

Die nächtliche MID-Revision vom 14.08.2026 war funktional vollständig grün, meldete jedoch zwei Abhängigkeitsbefunde. Dieser Wartungsstand aktualisiert ausschließlich die betroffenen kompatiblen Transitivreihen und verschärft die bestehende Audit-Regression.

- `nanoid` wird im bestehenden 3.x-Pfad von 3.3.17 auf 3.3.18 angehoben.
- `protocol-buffers-schema` wird von 3.6.0 auf 3.6.1 angehoben.
- Keine Major-/Toolchain-Migration; React, Recharts, TypeScript, Vite und die übrigen Stable-Verträge bleiben unverändert.
- `scripts/test-nightly-audit-dependencies-09311.mjs` verlangt künftig mindestens nanoid 3.3.18 und protocol-buffers-schema 3.6.1.
- Die Dependency-Upgrade-Policy dokumentiert kompatible Security-Patches als zulässige Stable-Wartung.
- Worker fachlich unverändert; lediglich Versionssynchronisation auf v0.9.53.10.

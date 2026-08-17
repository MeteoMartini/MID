# MID v0.9.54.2

## GitHub-Actions-Regressionsfix nach v0.9.54.1

Der Produktionslauf von v0.9.54.1 zeigte einen verbliebenen historischen Testkonflikt: `vite.config.ts` verwendet seit dem Audit-Nachtrag aus v0.9.53.57 absichtlich `manualChunks: midVendorChunk`, während `scripts/test-performance-budget.mjs` noch pauschal jedes Auftreten von `manualChunks` ablehnte.

### Korrektur

- `test-performance-budget.mjs` akzeptiert genau die auditierte `ReactVendor`-/`ChartsVendor`-Aufteilung.
- Zusätzliche oder unbekannte manuelle Vendor-Chunks führen weiterhin zum Fehler.
- Mehr als eine `manualChunks`-Zuweisung wird abgelehnt.
- Ein manueller MapLibre-Vendor-Chunk bleibt ausdrücklich verboten; die bestehende dynamische Karten-Lazy-Grenze wird geschützt.
- Der bestehende `test-build-render-stability-08274.mjs` und der neue Stable-Hardening-Vertrag aus v0.9.53.57 bleiben unverändert wirksam.

### Funktionsumfang

Keine Wetter- oder UI-Funktion wurde geändert. Die Open-Meteo-Erweiterungen aus v0.9.54.0 sowie das Stable-Hardening aus v0.9.54.1 bleiben vollständig erhalten.

### Worker

Keine funktionale Worker-Änderung. Der Worker wird lediglich auf v0.9.54.2 versionssynchronisiert, damit Professional- und Worker-Paket denselben Release-Stand ausweisen.

# MID Vertragsregistry

Die normativen MID-Verträge bleiben weiterhin die versionierten Markdown-Dateien im Repository-Root. `contracts/index.json` ist ab v0.9.85.127 die maschinenlesbare Registry dieser Verträge; sie ersetzt keinen Vertragstext.

`contracts/registry.schema.json` beschreibt die Registry-Struktur. `scripts/test-contract-registry-0985127.mjs` stellt sicher, dass jeder Root-Vertrag genau einmal registriert ist und dass Registry- und Releaseversion zusammenpassen.

Neue dauerhafte Verträge werden atomar als Markdown-Vertrag, Registry-Eintrag und – soweit fachlich erforderlich – Regression/Baseline-Erweiterung gepflegt.

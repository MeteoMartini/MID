# MID v0.9.85.385 – Parallelisierte, SHA-gebundene Revisionsprüfung

- Die bisherige etwa 49-minütige automatische Revision erhält zehn voneinander isolierte und vollständige Prüfgänge: vier Core-Subshards sowie sechs Heavy-Subshards, davon drei strikt getrennte Unified-Map-Browsergruppen.
- Alle 1.057 registrierten Regressionen bleiben Pflicht. Das bestehende Testinventar wird ohne doppelte oder ausgelassene Fälle partitioniert; die 24 Karten-/Designkombinationen einschließlich ICON-EU-Isobaren und Speicherprüfung bleiben verpflichtend.
- Die Revision bindet alle Jobs an einen gemeinsamen Quell-SHA, prüft GitHub-Main-/Stable-Drift und verweigert bei fehlenden oder fehlgeschlagenen Matrixjobs den grünen CI-/Nightly-Abschluss. Web, iOS, Worker und Wetterdaten bleiben funktional unverändert.
- Alle Builds und Browserprüfungen verwenden weiterhin die bestehenden Toolchain-/Lockfile-/Umgebungs-Verträge; bestehende Source-PR-, Installer-, Worker-/Pages- und Stable-Promotion-Gates werden nicht verkürzt.
- Der Laufzeitgewinn ist zunächst ein zu verifizierendes Ziel. Unsignierte Build-/Testartefakte werden weiterhin nicht wiederverwendet; Issue #526 und die unabhängige Signatur-/A/B-Abnahme bleiben offen.

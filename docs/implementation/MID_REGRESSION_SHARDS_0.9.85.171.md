# MID v0.9.85.171 · Isolierte Heavy-Regression-Shards im Source-Gate

## Ausgangslage
Verifizierte Basis ist `main = mid-stable = 53671910a16d5bd0d6cf9fe47945891789bb0dff`, MID v0.9.85.170, ohne offene Pull Requests. Die pausierten Works wurden nicht verändert. Im letzten gemessenen Source-Gate benötigten die vollständigen 912 Regressionen rund 616 Sekunden. Allein `test-adaptive-native-maps-0985141.mjs` und `test-unified-map-layers-0985167.mjs` benötigten etwa 218 bzw. 201 Sekunden; die Berg-Visualmatrix weitere rund 59 Sekunden.

## Umsetzung
`scripts/regression-shards.mjs` erzeugt aus dem kanonischen automatisch entdeckten `regressionSuite()`-Inventar eine verlustfreie 1:1-Partition: `core`, `heavy-native-map`, `heavy-unified-map` und `heavy-mountain-visual`. Unbekannte Heavy-Testnamen, Doppelzuweisungen, fehlende oder zusätzliche Tests brechen fail-closed ab. Der normale Runner kann weiterhin ohne Shard-Variable das vollständige Inventar ausführen.

Der Kernjob behält Struktur-, Lockfile-, Dependency-/Security-, Produktionsbuild-, Worker-Syntax-, iOS-Hüllen- und Paketierungsprüfung. Drei GitHub-Matrixjobs führen die Heavy-Shards in eigenen Runnern aus. Jeder Heavy-Runner lädt denselben PR-Merge-SHA, installiert reproduzierbar aus demselben Lockfile, erzeugt einen eigenen Produktionsbuild und führt exakt einen Heavy-Shard seriell aus. Arbeitsbaum, Ports, Browserprofile und temporäre Dateien werden damit zwischen Heavy-Prüfungen isoliert.

Der bestehende Required-Check `Agent-Quellstand vollständig prüfen` ist der abschließende Aggregator und wird nur erfolgreich, wenn `source_core` und die vollständige Heavy-Matrix erfolgreich sind. `fail-fast: false` verhindert, dass ein Fehler weitere Heavy-Befunde verdeckt.

## Unveränderte Sicherheitsgrenzen
Kein Test wird gestrichen, kein Schwellenwert gelockert und keine Berechtigung erweitert. Der Auto-Release reagiert weiterhin nur auf einen insgesamt erfolgreichen Source-PR-Workflow. Der Installer führt in v0.9.85.171 weiterhin seine vollständige unabhängige Prüfung aus; Worker-Smokes, Pages-Gate, Fast-Forward-only-Stable-Promotion und SHA-Verifikation bleiben unverändert.

## Regression
`scripts/test-regression-sharding-0985171.mjs` schützt Inventarvollständigkeit, Eindeutigkeit, die drei expliziten Heavy-Zuordnungen, bytegleiche Workflow-Spiegel, `fail-fast: false` sowie den finalen Required-Check-Aggregator.

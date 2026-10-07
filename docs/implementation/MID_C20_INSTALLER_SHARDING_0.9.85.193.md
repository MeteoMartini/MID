# MID-C20 · Vollständige parallele Installerprüfung · v0.9.85.193

Basis: main = mid-stable = 9998db3dd5358101717ecd16482f7f88e4983ebb (.192).

Die .192-Installer-Suite dauerte 802,7 Sekunden: Unified Map 333,2 s, Native Map 183,8 s, Mountain 50,2 s. Diese bisherigen seriellen Heavy-Prüfungen sind der größte vermeidbare Wartezeitanteil. Keine Viewports, Themes, Designs, Assertions, Sicherheitsprüfungen oder meteorologischen Tests entfallen.

## Bindung und Freigabe

1. `prepare_release` lädt den exakten Event-SHA, führt die bisherigen ZIP-Integritäts-, Pfad-, Link-, Struktur- und vollständigen Ersatzprüfungen unverändert aus. Anschließend erstellt es einen unveränderlichen Snapshot. Der an GitHub-Joboutputs gebundene Manifest-Hash bindet Event-SHA, Archiv-Hash und die vollständige Datei-Hashliste.
2. `verify_core` und alle fünf `verify_heavy`-Instanzen laden ausschließlich das Artefakt dieses Runs und Attempts. Vor Ausführung prüfen sie den erwarteten Manifest-Hash, Event-SHA, Archiv-Hash und die komplette Dateiliste. Jeder Runner installiert reproduzierbar per Lockfile. Core behält den Produktionsaudit, Produktionsbuild, Worker-Syntax und iOS-/Lifecycle-Prüfungen.
3. Heavy Native und Mountain bleiben vollständig. Unified Map verteilt die sechs Viewports disjunkt auf `1/3`, `2/3`, `3/3`; jede Gruppe prüft beide Themes und beide Designs. Ungültige Gruppen schlagen fehl. Die Summe bleibt exakt 24 Browserfälle. Der Source-PR-Gate prüft weiterhin die vollständige Kartenmatrix.
4. `install_build` benötigt den Erfolg von Vorbereitung, Core und gesamter Heavy-Matrix. Es übernimmt ausschließlich den SHA-verifizierten gebauten Core-Snapshot. Erst danach wird der begrenzte Release-Bot-Token erzeugt. Bestehende Commit-Race-, Worker-, Rollback-, RUC-, Pages- und Stable-Gates bleiben unverändert.

Keine Tests erhalten Schreibcredentials. Snapshots enthalten weder Git-Metadaten noch node_modules oder Release-ZIP; Artefakte sind run-/attempt-spezifisch und nur einen Tag aufbewahrt. Diagnoseberichte werden nie für Freigaben gelesen.

## Prüfvertrag

Die frühere .190-Prüfung verlangte ein monolithisches `npm run verify` ohne Shard. Sie wird gezielt auf den ausdrücklich gewünschten vollständigen Core-plus-Heavy-Vertrag erweitert: Budgets und Mirrors bleiben streng, alle Heavy-Anteile und die abschließenden Abhängigkeiten werden geprüft. Zusätzliche reale Negativtests prüfen falsche Manifest-Hashes, Event-SHA und beschädigte Archive sowie Git-Erhalt und exakte Wiederherstellung.

Der Workflow-Audit fand vor der Änderung keine kritischen/hohen Befunde, sieben bestehende mittlere Hinweise in anderen Workflows; diese werden nicht außerhalb des Auftrags verändert. Lokaler Audit ersetzt keine Prüfung externer Rulesets, Apps oder Secret-Konfiguration.

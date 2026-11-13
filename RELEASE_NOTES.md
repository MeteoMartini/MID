# MID v0.9.85.464

## Änderungen
- Der MID-Release-Train kann den offiziellen Installer auch beim zulässigen SHA-geprüften Wiederanlauf ohne lokalen Git-Checkout starten. Der GitHub-Workflow benennt das Ziel-Repository nun ausdrücklich.
- Die Schutzprüfungen für das exakte Release-ZIP, die geprüfte PR und den Bot, die Branchstände sowie bereits laufende Installer bleiben vollständig erhalten. Es gibt keine Lockerung von Branchschutz, Reviews oder Release-Gates.
- Wettermodelle, Radar- und Satellitendaten, Warnungen und Anzeigeeinstellungen werden durch dieses Wartungsupdate nicht verändert.

## Qualität und Abgrenzung
- Der vier Dateien umfassende Fix des Spezial-Drafts #784 wurde auf der zuletzt veröffentlichten Stable-Basis integriert; beide Workflow-Spiegel sowie Release-Train- und Vitest-Prüfungen wurden angepasst.
- Vollständiges Source-Gate, kontrollierter SHA-Bot-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion sind weiterhin Voraussetzung für die Veröffentlichung.

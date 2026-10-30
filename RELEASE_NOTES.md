# MID v0.9.85.376

## Vollständige Prüfungen mit kürzerem Veröffentlichungsweg
- Die Kernregressionen des Installers werden auf vier unabhängige Prüfgruppen verteilt. Jede Gruppe prüft denselben unveränderlichen Release-Stand; nur wenn alle Pflichtprüfungen erfolgreich sind, kann die Veröffentlichung fortgesetzt werden.
- Neue rein lesende Diagnosewerkzeuge zeigen Laufzeiten, Engpässe und mögliche Updatepakete. Mehrere kompatible Korrekturen können gemeinsam als eine vollständig geprüfte Version veröffentlicht werden; dringende Fehlerbehebungen warten nicht auf ein Paket.
- Updatepakete können bereits im Draft-Zustand geplant werden. SHA-Wechsel, unvollständige Dateilisten, Umbenennungskonflikte und fremde Entwicklungsbranches blockieren die Vorprüfung.
- Herkunftsprüfungen binden Ergebnisse an den konkreten GitHub-Prüfversuch, Quellstand und alle Pflichtgruppen. Frühere Prüfergebnisse ersetzen keine Installerprüfung.
- Wetterberechnung, Warnschwellen, Datenquellen und Bedienoberfläche bleiben unverändert. Eine Laufzeitverkürzung wird erst nach realen Veröffentlichungen als gemessen ausgewiesen.

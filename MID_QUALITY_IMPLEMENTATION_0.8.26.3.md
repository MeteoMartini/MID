## MID v0.8.26.3 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.2**, da keine Wetterfunktion verändert wurde, sondern die Installations- und Prüfstrecke zuverlässig mit älteren aktiven GitHub-Workflows kompatibel gemacht wurde.

### Ursache der wiederholten GitHub-Fehler

Der im Repository aktive Installationsworkflow stammte weiterhin aus einem älteren MID-Stand. Das Projekt-ZIP ersetzte den Quellcode, schloss `.github` jedoch aus. Zwei neue Regressionstests prüften anschließend die noch alten aktiven Workflowdateien und mussten deshalb gemeinsam fehlschlagen.

Eine automatische Änderung von `.github/workflows` im laufenden Installationsjob ist kein belastbarer Migrationsweg. Workflowdateien benötigen einen gesonderten Schreibvertrag und werden daher nicht mehr vom regulären Installationsjob selbst verändert.

### Korrektur

- CI- und Wartungsregressionen prüfen das kanonische Workflowpaket unter `ci/github/` statt die möglicherweise noch ältere aktive Repositorykonfiguration.
- Der reguläre Installationslauf bleibt dadurch auch mit dem alten aktiven Installer ausführbar.
- Die automatische Workflow-Selbständerung wurde aus dem neuen Installer entfernt.
- Ein explizites Synchronisationsskript für die bewusste manuelle Übernahme bleibt enthalten.
- Fremde beziehungsweise eigene zusätzliche Workflows werden nicht gelöscht.
- Eine neue Regression simuliert einen alten aktiven Installer und prüft die vollständige Kompatibilität.

### Funktionsschutz

Es wurden keine Wetter-, Radar-, Ensemble-, Warn-, Export-, Cache- oder Darstellungsfunktionen entfernt oder eingeschränkt.

### Worker

Keine funktionale Workeränderung; nur Versionssynchronisierung.

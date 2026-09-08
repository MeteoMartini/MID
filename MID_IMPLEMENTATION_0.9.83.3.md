# MID v0.9.83.3 – Implementierung

## Anlass
GitHub-Release-Lauf #942 scheiterte nach erfolgreichem Produktionsbuild in fünf Pflichtregressionen. Mit der Vite-8/Rolldown-Migration war `esbuild` als transitive Buildabhängigkeit entfallen, obwohl zwei isolierte Testhüllen es weiterhin direkt importieren. Drei weitere Prüfungen enthielten veraltete Erwartungen aus der Migration.

## Korrektur
- `esbuild` 0.28.2 ist wieder als direkte, exakt fixierte Entwicklungsabhängigkeit samt Lockfile-Eintrag vorhanden.
- Der Abhängigkeitsvertrag prüft Paketdeklaration, Lockfile und dokumentierten Einsatzzweck.
- Der Nacht-Audit verlangt für `browserslist` nur dann eine sichere Mindestversion, wenn das Paket überhaupt installiert ist; ein entfernter Abhängigkeitspfad ist nicht verwundbar.
- Der Farbtest akzeptiert den gewollten Alias des Klima-Tmax-Tokens auf die zentrale Tmax-Farbe.
- Die Plugin-React-6-Kopplung ist in der Policy wieder eindeutig maschinenlesbar.
- Vite 8 verwendet weiterhin Rolldown, Oxc und Lightning CSS; die Produktionspipeline wird nicht auf esbuild zurückgestellt.
- Keine fachliche Änderung an App, Wetterdaten, UI oder Worker.

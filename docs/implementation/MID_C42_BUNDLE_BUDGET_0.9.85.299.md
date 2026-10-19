# MID C42 · Fail-closed Main-Bundle-Größenprüfung · v0.9.85.299

## Basis und Risiko

19.10.2026: veröffentlichter Stable/Maintenance-SHA `a21791cea8e51546ba568d9fedaf3729ae069dab`, `v0.9.85.298`, Installer `39277116386` erfolgreich. Das initiale CSS des Release-Artefakts umfasst 1.759.985 Byte roh (nur 15 Byte unter 1.760.000); dies ist kein Nachweis der tatsächlichen Browser-Verarbeitungszeit.

`scripts/test-bundle-budget-098594.mjs` prüfte Größe bisher nur, **falls** eine entsprechende `index-*.js`-/`index-*.css`-Datei vorhanden war. Ein Build-Ordner mit nur einer Teilmenge der Hauptartefakte konnte so unbemerkt die Budgetprüfung bestehen. Die vorgeschaltete vollständige Vite-/HTML-Validierung und das separate Gesamtbudget bieten zwar weitere Schutzschichten, diese Einzelprüfung war aber nicht fail-closed.

## Änderungen und Verträge

- Wenn `dist/assets` existiert, sind Main-JS und Main-CSS jetzt zwingend vorhanden. Fehlende Hauptartefakte melden Fehler und einen ungleich Null-Exit.
- Das explizite frühere Source-only-Verhalten **ohne `dist/assets`** bleibt für Vor-Build-Regressionen bestehen; die eigentlichen MID-Release-Gates verlangen weiterhin Build und gesamtes Budget.
- Bestehende Grenzwerte 1.500.000 B Main-JS und 1.760.000 B Main-CSS wurden **nicht** angehoben; kein CSS-Byte verändert und kein Layout- oder Datenpfad verändert.
- Neues deterministisches Testskript prüft sieben Fälle ohne Netzwerk- oder Browserabhängigkeit. `MID_BASELINE.json` führt es zusätzlich zu den bisherigen Regressionen.

## Qualität und offene Folgeschritte

Focused: `node scripts/test-bundle-budget-missing-assets-0985299.mjs`; außerdem `node scripts/test-bundle-budget-098594.mjs` gegen vollständig gebauten Release und bestehende `scripts/test-build-budget-media-contract-097620.mjs`. Vollständiger Build/CI/Pages/Stable nach tatsächlichem GitHub-Nachweis dokumentieren, nicht vorwegnehmen.

Das CSS-Budget bleibt akut eng. Die nächste fachliche Maßnahme bleibt #344: Browser-Coverage/CDP unter repräsentativen Ansichten und Kaskaden-/Pixel-Parität vor jeder Lazy-CSS-Verlagerung. Replit-Arbeitskopie unverändert und nicht als Basis verwendet.

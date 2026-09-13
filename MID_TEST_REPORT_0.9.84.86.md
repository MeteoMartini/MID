# MID v0.9.84.86 – Testbericht

## GitHub Actions #1039

Der hochgeladene v0.9.84.85-Stand wurde in GitHub Actions vollständig installiert und gebaut. `npm ci`, Dependency-Prüfung, TypeScript/Vite-Build und die übrigen Release-Schritte bis zur Regression liefen erfolgreich. In der Regressionssuite bestanden **777 von 779** Prüfungen; exakt zwei Tests scheiterten an veralteten Text-/UI-Erwartungen.

Die beiden Fehler wurden für v0.9.84.86 gezielt korrigiert, ohne die produktive Anwendungslogik zu ändern.

## Lokal ausgeführte fokussierte Regressionen

Folgende Prüfungen wurden nach der Korrektur erfolgreich ausgeführt:

- `node scripts/test-mid-weather-profile-thermal-sun-09320.mjs`
- `node scripts/test-sports-section-collapse-09280.mjs`
- `node scripts/test-versioning.mjs`
- `node scripts/test-release-lineage.mjs`

Ergebnis:

- 24-h-Thermik-/Hazard-/Ensemble-Sonnenband-Regressionsprüfung: **bestanden**
- Einklappbare Sportsektionen / Tooltip-Vertrag: **bestanden**
- Versionskonsistenz **0.9.84.86**: **bestanden**
- Release-Lineage / Direktupdate-Fähigkeit: **bestanden**

## Vollständiger lokaler Preflight

Der offizielle lokale ZIP-Packer startet absichtlich einen vollständigen `release-preflight.mjs` mit frischem Dependency-Setup. Dieser konnte in der isolierten Ausführungsumgebung nicht vollständig wiederholt werden, weil `npm ci` beim externen Pakettransport in einen Timeout lief. Das ist kein Anwendungsfehler und wird hier ausdrücklich **nicht** als bestandener Volltest ausgewiesen.

Für die Risikobewertung ist relevant: GitHub Actions #1039 hatte denselben produktiven v0.9.84.85-Code bereits erfolgreich installiert und gebaut; dort waren 777/779 Regressionen grün. v0.9.84.86 ändert nur die beiden betroffenen Testverträge sowie Versions-/Changelog-Metadaten. Die zuvor fehlschlagenden Tests wurden lokal gezielt erfolgreich geprüft.

Der nächste GitHub-Installerlauf bleibt damit das definitive vollständige Release-Gate.

## Worker

Funktionaler Worker-Diff: **keiner**. Ausschließlich `WORKER_VERSION` wurde von `0.9.84.85` auf `0.9.84.86` synchronisiert. Ein separater manueller Worker-Upload ist für diese Korrektur nicht erforderlich.

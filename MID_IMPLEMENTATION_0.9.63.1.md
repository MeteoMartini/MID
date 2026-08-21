# MID v0.9.63.1 – CI-/Regressionskorrektur

## Ursache

Der Produktionscode von v0.9.63.0 war typ- und buildfähig. Im vollständigen GitHub-Lauf scheiterten jedoch neun Regressionen: sieben isolierte Tests kompilierten `forecastFusion.ts`, ohne den in v0.9.63.0 eingeführten gemeinsamen Cacheimport zu ersetzen. Zwei neue Wartungstests importierten TypeScript-Dateien direkt; das funktioniert unter neueren Node-Versionen, nicht aber unter dem in MID festgelegten Node.js 22.16.0 ohne experimentelle Laufzeitoption.

## Korrektur

- Isolierte Forecast-Fusion-Regressionen stellen den Cachevertrag wie die übrigen bestehenden Modultests explizit als Testdouble bereit.
- Flugbriefing- und Wartungsvertragsregressionen transpilieren ihre TypeScript-Testmodule mit der projektlokalen, lockfile-gebundenen TypeScript-Version.
- Historische Persistenz- und Zeitpfeiltests prüfen die ausgelagerten Nutzerverträge in `storageContracts.ts` und `compositeSettings.ts`, nicht mehr die frühere Position einzelner Quelltextliterale.
- Die CI-Determinismusregression schützt die Node.js-22.16-kompatible Ladestrategie dauerhaft.

## Fachlicher Umfang

Dies ist ein reines Wartungsrelease. Wetterzwilling/Fusion, Flugbriefing, Komposit-Zeitpfeil, Radar-/Nowcast-Logik, Persistenz, Cacheverhalten und Worker-Fachlogik bleiben gegenüber v0.9.63.0 unverändert.

# MID v0.9.53.47 – CI-Regressionsvertrag für reaktivierte Sensorik

## Anlass

Der GitHub-Installer meldete nach v0.9.53.46 weiterhin die beiden Regressionen `test-mid-followups-095323.mjs` und `test-weather-twin-stages-0800.mjs`. Die Produktlogik selbst war dabei nicht die Ursache. Beide Tests enthielten noch unnötig fragile bzw. historisch überholte Vertragsannahmen.

## Korrektur

- `test-mid-followups-095323.mjs` prüft den einheitlichen Default-Closed-Hauptmodulvertrag nun mengenbasiert statt über eine feste Reihenfolge der Einträge. Damit bleiben `ventilation`, `mountain`, `water`, `composite`, `ensemble` und `long-range` verbindlich geschützt, ohne dass eine semantisch irrelevante Array-Reihenfolge den Release stoppt.
- `test-weather-twin-stages-0800.mjs` erzwingt nicht länger die frühere vorläufige Deaktivierung einer Oberfläche für eigene Sensoren. Seit der bewusst reaktivierten Stations- und Lüftungsintegration sind eigene Sensoren wieder zulässig; deren tatsächliche Funktionsverträge werden durch die dedizierten Netatmo-, Stations- und Lüftungstests abgesichert.
- Keine meteorologische, Stations-, OAuth-, Wetterzwilling- oder Lüftungslogik wurde geändert.

## Prüfung

Die beiden zuvor in GitHub gemeldeten Regressionen sowie die dedizierten Tests für Netatmo, Stationsreaktivierung und Lüftungsassistent werden lokal explizit ausgeführt. Der Worker erhält ausschließlich die synchronisierte Versionskennung; ein funktionaler Worker-Upload ist für diesen CI-Vertragsfix nicht erforderlich.

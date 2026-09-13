# MID v0.9.84.86 – Implementierungsbericht

## Anlass

GitHub Actions Lauf **#1039** (`MID-Release aus ZIP installieren und veröffentlichen`) schlug nach dem Upload des v0.9.84.85-Professional-ZIP fehl. Der eigentliche Installations- und Produktionsbuild war dabei erfolgreich; die Pipeline stoppte erst in der Regressionssuite bei zwei veralteten Testverträgen.

## Ursache

1. `scripts/test-mid-weather-profile-thermal-sun-09320.mjs` erwartete weiterhin eine sichtbare zusätzliche Delta-Temperaturausgabe mit `K</dd>`. Diese Ausgabe war in v0.9.84.85 absichtlich aus den 24-h-Einzeldaten entfernt worden; dort werden nun Lufttemperatur, gefühlte Temperatur und Taupunkt getrennt dargestellt.
2. `scripts/test-sports-section-collapse-09280.mjs` erwartete noch die alte Wasser-Modulbeschreibung `Wasserwetter, Gezeiten und Bedingungen`. Seit v0.9.84.85 lautet die bewusst verbesserte Beschreibung `Pegel, Wasserwetter, Gezeiten und Bedingungen`, damit amtliche Pegeldaten leichter auffindbar sind.

Damit lag kein Fehler in Vite, TypeScript, npm, Wetterdatenlogik, Pegelberechnung oder der produktiven UI vor, sondern eine Inkonsistenz zwischen zwei älteren Regressionstests und dem aktuellen, beabsichtigten UI-Vertrag.

## Änderungen in v0.9.84.86

- `test-mid-weather-profile-thermal-sun-09320.mjs` an den aktuellen 24-h-Vertrag angepasst:
  - `profile-temperature-values` wird positiv geprüft.
  - `Luft`, `gefühlt` und `Taupunkt` werden als sichtbare Einzelwerte positiv geprüft.
  - Die veraltete zusätzliche `K</dd>`-Delta-Ausgabe wird jetzt ausdrücklich verworfen.
- `test-sports-section-collapse-09280.mjs` schützt die aktuelle Beschreibung `Pegel, Wasserwetter, Gezeiten und Bedingungen`.
- Releaseversion auf **0.9.84.86** angehoben und Versionsmetadaten synchronisiert.
- Changelog ergänzt.

## Nicht verändert

Die produktive Wetter-/UI-Fachlogik aus v0.9.84.85 wurde nicht zurückgenommen oder verändert. Insbesondere bleiben die Viewport-/Textflusskorrekturen, die kompakteren 24-h-Einzeldaten und die bessere Pegel-Auffindbarkeit erhalten. Radar, Satellit, Karten, Warnungen, Modellfusion, Wetterzwilling und Datenquellen wurden nicht angefasst.

Die Worker-Fachlogik ist ebenfalls unverändert. Der Diff von v0.9.84.85 zu v0.9.84.86 betrifft dort ausschließlich die Konstante `WORKER_VERSION`.

## Release-Basis

Unmittelbar vor Erstellung des korrigierten ZIP wurde GitHub Actions erneut geprüft. Der jüngste Installerlauf auf `main` ist weiterhin **#1039**, Commit `44086ee71e4e31beaef9f1a8e3e07d70bb545354`, mit Ergebnis `failure`. Es liegt kein neuerer Release-Upload vor.

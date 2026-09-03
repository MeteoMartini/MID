# MID Implementation v0.9.78.8

Datum: 2026-09-03

## Anlass

Der GitHub-Release scheiterte nach der Entfernung der eigenständigen Kachel „Gewitterrisiko“ an einer veralteten Regression. Gleichzeitig wurde die 14-Tage-Cockpitdarstellung auf Desktopbreiten um etwa 1100–1300 CSS-Pixel durch den für mobile Querformate gedachten 7×2-Komprimierungsmodus unleserlich.

## Umsetzung

### Aktuelle Wetterdaten / Gewittervertrag

- Die eigenständige Kachel „Gewitterrisiko“ bleibt entfernt.
- Das kanonische 6-Stunden-Ortsrisiko bleibt als gemeinsame Fachquelle für „Aktuell“ und Wassersport erhalten.
- Bei relevantem Risiko wird die Information kompakt in der Niederschlagskachel angezeigt; die Niederschlagskachel verwendet weiterhin Weather Icon System 2.0.
- `test-location-thunder-water-tide-layout-09644.mjs` wurde vom historischen separaten Kartenvertrag auf diesen Nachfolgevertrag migriert. Wasser-/Tiden- und Bergsportlogik bleiben unverändert geschützt.

### 14-Tage-Desktoplayout

- Der 7×2-Querformatmodus gilt nur noch bis 1024 CSS-Pixel und damit für Mobil-/Tablet-Querformat.
- Oberhalb 1024 CSS-Pixel verwendet das 14-Tage-Cockpit wieder lesbare Desktopkarten mit mindestens 190 px Kartenbreite und horizontalem Scrollen statt Mikroschrift.
- Kartenkopf wird kollisionsfrei in Wetterkopf/Konsistenz, Wetterregime und Tmin/Tmax gegliedert.
- Temperatur-, Niederschlags- und Windzeilen erhalten auf Desktop eine zweizeilige Label/Wert-/Track-Geometrie, damit Werte nicht übereinanderlaufen.

## Worker

Keine fachliche Workeränderung. Die Änderungen betreffen Frontend, CSS und Regressionen.

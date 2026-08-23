# MID v0.9.65.2 – Reiseklimatologie / Einheitenstandardisierung

## Anlass
Der Reiseplaner konnte für Kreta im Oktober gleichzeitig sonnige Wettercodes, 0,0 h/Tag Sonnenschein und 0 km/h Wind ausgeben. Ursache war eine Kombination aus dem Basisabruf `models=era5_land` für dort nicht vollständig native Variablen und einer Nullwert-Konvertierung, durch die `Number(null)` fälschlich als meteorologische 0 in die Klimamittel einging.

## Datenquelle
Der Basisabruf verwendet jetzt `models=era5_seamless` für 1991–2020. Damit bleibt die feinere ERA5-Land-Landtemperatur erhalten, während ERA5 Niederschlag, Solarstrahlung/Sonnenscheindauer und Wind ergänzt. `snow_depth` bleibt wegen seiner Verfügbarkeit ein ausdrücklich optionaler, separater ERA5-Land-Stundenabruf.

Explizite API-Einheiten: `temperature_unit=celsius`, `precipitation_unit=mm`, `wind_speed_unit=kn`. Damit entspricht die interne Reiseplaner-Windgröße dem MID-weiten kanonischen Knotenvertrag.

## Schutz gegen fehlerhafte Quellenwerte
Der Basiscache wurde von v2 auf v3 angehoben. Alte, bereits lokal gespeicherte fehlerhafte Klimareihen werden dadurch nicht übernommen. Vor Aggregation werden Vollständigkeit und elementare Plausibilität geprüft. Historische Reihen mit fehlenden Pflichtfeldern, durchgehend 0 h Sonnenschein trotz Tageslicht oder durchgehend 0 Wind werden als Quellfehler verworfen.

## Appweite Einheiten
`TravelPlannerPanel` erhält die globale `WindUnit` aus `App.tsx`. Windanzeige erfolgt über die bestehende zentrale `wind()`-Formatierung; Grenzwerte werden aus der aktuell gewählten Anzeigeeinheit nach Knoten zurückgerechnet. Unterstützt bleiben kt, km/h, m/s und mph. Temperatur/Niederschlag/Schnee bleiben entsprechend dem bestehenden MID-Vertrag °C/mm/cm.

## Regression
`scripts/test-travel-planner-era5-seamless-units-09652.mjs` schützt Datenquelle, Cachemigration, Plausibilitätsguards, Worker-unabhängige Schneehöhe und appweite Wind-Einheiten. Die bestehenden Reiseplaner-/Abrufbudgettests wurden auf den korrigierten Quellenvertrag migriert.

## Worker
Keine fachliche Worker-Änderung. Die Worker-Releasekennung wird lediglich auf v0.9.65.2 synchronisiert, damit Versionsdiagnose und Aggregate konsistent bleiben.

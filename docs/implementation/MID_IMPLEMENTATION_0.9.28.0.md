# MID v0.9.28.0

## Sportsektionen + zuverlässige Lokalisierung im DWD-Produkt

- **Berg-/Wintersport** und **Wassersport** werden auf Modulebene einklappbar. Der bestehende `CollapsibleModule`-Mechanismus speichert den Zustand in `localStorage` (`mid:module:mountain:open` / `mid:module:water:open`). Standardmäßig bleiben beide Bereiche geöffnet, bis der Nutzer den Zustand ändert.
- **Wolken + Niederschlagsart** behält das unveränderte amtliche DWD-Kombinationsbild für die Niederschlagsart und dessen bildgebundene Radar-/Sat-Zeitstände.
- Zur zuverlässigen Ortslokalisierung wird zusätzlich ein **georeferenzierter WGS84-Standort-Locator** eingeblendet. Er markiert die unveränderten Standortkoordinaten direkt auf einer Leaflet-Karte und kombiniert die bereits im MID-Worker freigegebenen DWD-WMS-Layer `dwd:Niederschlagsradar` und `dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night`.
- Der Locator ist standardmäßig sichtbar, über das Standort-Symbol ein-/ausblendbar und merkt seinen Zustand (`mid:dwd-precipitation-locator-open`).
- Es wird bewusst **kein geschätzter Marker mehr in das statische DWD-Originalbild** gelegt. Damit bleibt die Niederschlagsart source-faithful, während die geografische Zuordnung konstruktiv korrekt auf WGS84 erfolgt.
- Neue Regression schützt die dauerhafte Einklappbarkeit von Wasser-/Bergsport; die bestehende DWD-Georeferenzierungsregression wurde auf den separaten Locator aktualisiert.

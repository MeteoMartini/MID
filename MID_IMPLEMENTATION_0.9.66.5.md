# MID 0.9.66.5 – robuste klimatologische Wassertemperatur im Reiseplaner

## Befund

Die bereits vorhandene ERA5-Ocean-Wassertemperatur konnte bei Küstenzielen weiterhin vollständig aus der Ergebnisansicht verschwinden. Drei Effekte wirkten zusammen: Der erste Referenzabruf (1991) war ein harter Gatekeeper, negative Ergebnisse wurden unter dem allgemeinen dreijährigen Reise-Klimacache gespeichert, und der 45-km-Küstenradius war enger als die native ERA5-Ocean-Auflösung von etwa 0,5° (~50 km). Dadurch konnte ein einzelner fehlender Abruf oder eine grobe Küstenzelle die SST dauerhaft unterdrücken.

## Umsetzung

- Der SST-Cachevertrag wird auf `mid:travel-water-climate:1991-2020:v4` migriert; alte negative v3-Einträge werden dadurch sofort ignoriert.
- Alle acht Referenzjahre 1991, 1995, 1999, 2003, 2007, 2011, 2015 und 2020 werden unabhängig über `Promise.allSettled` ausgewertet. Kein einzelnes Jahr kann die gesamte Wassertemperatur mehr blockieren.
- Ab vier gültigen Referenzjahren wird das klimatologische Mittel gebildet; fehlende Einzeljahre werden transparent über die Anzahl der verwendeten Referenzjahre kenntlich gemacht.
- Negative bzw. unvollständige SST-Ergebnisse werden nicht mehr langfristig gespeichert. Ein später wieder verfügbarer Datenweg kann sich daher unmittelbar erholen.
- Der zulässige Abstand zur bevorzugten Meereszelle beträgt 80 km. Das berücksichtigt das native 0,5°-ERA5-Ocean-Raster, verhindert aber weiterhin Wassertemperaturkarten für klar binnenländische Ziele.
- Technische SST-Ausfälle werden im Reiseergebnis sichtbar gemeldet, ohne die übrige Reiseklimatologie zu verwerfen. Sauber nicht verfügbare bzw. nicht küstennahe SST bleibt weiterhin ohne erfundene Ersatztemperatur.

## Datenweg und Kosten

Die Wassertemperatur bleibt eine klimatologische historische SST aus Open-Meteo ERA5-Ocean für exakt die Kalendertage des geplanten Reisezeitraums. Es werden keine aktuellen Marinewerte als Klimaersatz verwendet. Der MID-Worker ist fachlich nicht beteiligt; es entstehen keine neuen kostenpflichtigen Abhängigkeiten.

## Regression

`scripts/test-travel-water-climatology-resilience-09665.mjs` prüft dynamisch einen fehlenden 1991-Abruf bei sieben gültigen Folgejahren, eine gültige ERA5-Ocean-Zelle zwischen 45 und 80 km sowie die Erholung nach einem zunächst negativen, nicht gecachten SST-Versuch. Zusätzlich wird die sichtbare UI-Fehlerdiagnose abgesichert.

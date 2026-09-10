# MID v0.9.84.37 – Implementierungsnotiz

## Anlass
GitHub-Installer #990 bestand ZIP-Prüfung, npm-Installation, Dependency-Audit, TypeScript 7 und den Vite-Produktionsbuild. Erst die Regressionssuite stoppte mit sechs veralteten Erwartungswerten.

## Korrekturen
- App-weite Niederschlagsfarbprüfung auf die zentralen CSS-Phasentokens umgestellt.
- Piktogramm-Farbvertrag an die beabsichtigte Trennung Graupel/Schnee, Misch-/Gefrierphase und Hagel/Gewitter angepasst.
- ICAO-Hauptsuche wird über sichtbaren Suchplatzhalter, Ergebniskennzeichnung und Accessibility-Vertrag geschützt statt über den entfernten Literaltext „ICAO-Ortssuche“.
- Eigenständige Gewitterinformation wird strukturell als separater Standort-Nowcard geprüft statt über eine alte Überschrift.
- Quellenfußzeile präzisiert DWD Open Data und EUMETNET OPERA CIRRUS.
- Visible-Internals-Test erwartet die aktuelle nutzerorientierte DWD-Quellenformulierung.

## Funktionsumfang
Keine der sechs Korrekturen entfernt einen Funktionspfad. ICAO-Auflösung, KONRAD3D-Gewitterinformation, Radar-/Modell-Phasenfusion und zentrale Niederschlagspalette bleiben aktiv.

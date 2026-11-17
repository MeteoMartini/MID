# MID Audit 1.0 · unabhängige Beobachtung: NoData ist kein trockener Tag

**17.11.2026 | Basis** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, fünf aktive Rulesets. QA-DRAFT, kein Release.

## Gesicherter Quellbefund und meteorologischer Bezug
PDF `20261117_MID-Audit(1).pdf`, S. 4 (unabhängige MAE-/Brier-Verifikation) und S. 5 (Plausibilität/Stationen) verlangt, dass unabhängig beobachtete Referenzen mit gültiger Messqualität verifiziert werden. In `src/forecastVerification.ts` werden jedoch eingelesene Referenzen mit `reference.precipitation>DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM?1:0` binarisiert, ohne vorausgehenden Zahlen-/Bereichsgate. Bei JSON-`null`, Strings, negativen Mengen oder aus `NaN` serialisiertem `null` entsteht ein **falsches trockenes Ereignis**. Bei `Math.abs(prediction.max-reference.max)` kann ein `null`-Temperaturwert über JavaScript-Koerzierung zu `0°C` werden. Ebenso können negative Böen-/Sonnenscheindauern als legitime Messwerte gerechnet werden. Diese Punkte sind bisher von #886 (Guard der *prognostizierten* PoP, nicht der *beobachteten* Mengen) und #890/#892 (Zeitprovenienz der Prognose) getrennt.

## Isolierter, fehlertoleranter und performanter Fix
- `src/twinObservationEvidence.ts` mit O(1)-Guards für reelle, finite, nichtnegative Niederschlags-/Böen-/Sonnenscheinwerte und physikalisch konsistente Tmin/Tmax-Paare. Keine extremwetterfremde Obergrenze, echter Nullniederschlag bleibt 0.
- `src/forecastVerification.ts` bewertet **jeden Parameter einzeln**: ungültige Referenzregenmenge sperrt nur Niederschlags-MAE, Brier-Trocken/Nass und Kalibrationsbin; valide Temperatur darf weiterhin in die Skillstatistik. Fehlende Tmax/Tmin-Paare, negative Böen-/Sonnenscheindauern erzeugen keine Scheinevidenz. Die Archiv- und Messdaten bleiben byteidentisch.
- `tests/unit/mid-audit-observed-nodata-qa.test.ts` testet Null/NaN/String/negative Werte, echte 0 und Extremwerte, Tmax/Tmin, 7 synthetische unabhängige Messreferenztage mit nur 2 validen PoP-Tagen und 3 validen Temperaturtagen, Original-Archivbytes unverändert.
- Diese Dokumentation.

**Wichtige LC-/Release-Semantik:** Die vier Dateiblobs basieren auf Stable .486; `src/forecastVerification.ts` darf nach #886/#890/**#892** niemals vollständig über einen LC-/Release-Branch kopiert werden. Ausschließlich neuen Import, `modelParameterErrors()`-Teil und Referenz-Guard in `calibrationBins()` mit den bereits vorhandenen PoP-/Hindsight-/Lead-Guards zusammenführen. Vor Intake SHAs/Blobs und laufende PRs (#868, #894 und #892) erneut kontrollieren; bestehende Tests nicht lockern. Keine Änderung an WMO/DWD-Warnungen, Modellfusion, Stationsdatenbeschaffung, Preis/Plugin, CSS, Worker, IndexedDB-Schema, iOS oder Releases.

**Pflichtgates:** gezielte Validierung des Brier-/Station-/Archiv-/Paired-Contracts, Vitest/V8, Browser-Report, vollständige Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Promotion am exakten End-SHA. 72 Stunden synthetische Daten sind keine echte Skillstudie. Begrenzte Parameterfilter schützen statistische Aussage, sind kein empirischer INP/FPS-Gewinn.

**Literatur:** ECMWF „Recommendations for the Verification of Local Weather Forecasts“ https://www.ecmwf.int/sites/default/files/elibrary/2003/11401-recommendations-verification-local-weather-forecasts.pdf ; JWGFVR Verification FAQ https://jwgfvr.github.io/forecastverification/ ; WMO/WGNE https://wgne.net/publications/suggested-methods-for-precipitation-verification/ .

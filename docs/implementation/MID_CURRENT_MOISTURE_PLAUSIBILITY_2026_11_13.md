# MID v0.9.85.462 – Thermodynamische Konsistenz von Temperatur, Taupunkt und Feuchte

## Anlass und belegte Ursache
13.11.2026, Rheidt: Aktuell zeigt T = −1 °C, Td = +1 °C, RH = 95 %. In `src/App.tsx` wurden `temperature`, `humidity`, `dewPoint` separat aus Stationsanalyse und Modellfallback ausgewählt. `src/forecastLocalAnchor.ts` tat das ebenso. Bei robusten Stationsmitteln werden Parameter eigenständig nach Qualität/Entfernung/Zeiten gewichtet. Damit kann ein heterogener Blend ein physikalisch unmögliches Tripel liefern, selbst wenn seine einzelnen Quellen korrekt sind.

## Amtlicher Referenzstandard
Deutscher Wetterdienst: *Handbuch Flugwetterdienste – Band Tech*, Version 4.0 (23.02.2024), Abschnitt 6.3, S. 43: Sättigungsdampfdruck C1=6.10780 hPa, für T≥0 °C C2=17.08085/C3=234.175 K; für T<0 °C C2=17.84362/C3=245.425 K. Bei T≥0 und Td<0 muss die Taupunktinversion mit den kalten Konstanten wiederholt werden. TD≤T. RH ist WMO-konform auf Sättigung über Wasser bezogen; Taupunkt über Wasser ist nicht mit Reifpunkt über Eis gleichzusetzen.
https://www.dwd.de/DE/leistungen/lf_11_flugwetterbetriebsdienste/handbuch_band_tech_v4.0_mod.pdf

## Lösung und Fachgrenzen
- `src/currentMoistureConsistency.ts`: gemeinsame reine DWD-Thermodynamik mit Plausibilität, RH-Vergleichstoleranz ±5 Prozentpunkte, Quellenursprung, optionalem Quellenzeitversatz max. 30 min; fehlender/ungültiger Wert bleibt `undefined`. Bei echter 0 % RH ist ein endlicher Taupunkt nicht berechenbar.
- Die ursprünglichen Stations-/DWD-/Modellrohdaten bleiben erhalten und unverändert; keine Verschleierung durch `min(T,Td)` eines widersprüchlichen Eingangstripels.
- Nur konsistente, zeitlich und nach Ursprung passende Daten erscheinen als gemeldeter Taupunkt. Bei Konflikt wird der Taupunkt mathematisch aus der *angezeigten Temperatur und RH* neu berechnet und explizit mit `≈`/„berechnet“ gekennzeichnet. Verschiedene Quellursprünge werden als Näherung bezeichnet. Fehlt eine zeitgleiche T/RH-Basis, erscheint `–`, niemals 0.
- Die Schlussprüfung wird zentral im aktuellen Wetterbild und dem lokalen Forecast-Anker verwendet. Der lokale Anker darf einen korrigierten Modell-/Stationsmix nicht als originale Taupunktmessung markieren.
- Abgrenzung: Eigenes MID-Qualitätsverfahren; keine amtliche Warnung, keine Änderung eines amtlichen DWD-Datensatzes. Echter Feuchtefeld-Rasterdatenfehler muss im jeweiligen Provider separat fachlich geprüft werden.

## Wissenschaftliche QA
Original-Screenshot −1/+1/95%; echte 100%-Sättigung, Unterschreitung 0 °C, Kalt-Inversion bei leicht positiver T, RH=0, RH>100, null/NaN, Felder verschiedener Quellen, 31-Minuten-Zeitabweichung, widersprüchliche RH bei Td<T sowie vollständige T×RH-Matrix, Rückrechnung, Rundungsmonotonie. Ziel: Tests in Source/Core/Vitest und anschließend vollständiger Browser-/Release-Train; keine veröffentlichte Freigabe vor SHA-gebundener vollständiger E2E-Abnahme.

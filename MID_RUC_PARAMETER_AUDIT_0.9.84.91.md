# MID v0.9.84.91 · RUC Parameter-/Zeitauflösungs-Audit

## Ergebnis in einem Satz

MID sollte die hohe RUC-Zeitauflösung **parameter-nativ und gezielt** nutzen, nicht alle Felder pauschal auf 5 Minuten verdichten. Der größte unmittelbare Mehrwert liegt in den bereits vorhandenen 15-Minuten-Hydrometeor-Feldern für den Radar-Niederschlagsphasenlayer; dieser Schritt ist in v0.9.84.91 umgesetzt.

## Aktueller sinnvoller Vertrag

| Gruppe | MID-Nutzung | Empfohlene Kadenz | Begründung |
|---|---|---|---|
| Niederschlagsmenge / Timing | Nowcast-/RUC-Fusion | 5 min | rasch veränderlich; hoher Nutzen für Beginn/Dauer/Menge |
| Regen/Schnee/Graupel-Phase | Radar-Phasenlayer | 15 min nativ | DWD-Ausgabe nativ 15 min; keine künstliche 5-min-Phase |
| CAPE/CIN / Konvektion | RUC-Schnelldiagnose | 15 min | konvektive Entwicklung profitiert von höherer Kadenz |
| Reflektivität / Severe-Diagnostik | Gewitter-/Extrempfade | 15 min bzw. produktspezifisch | direkte Ereignisdiagnostik |
| Temperatur/Wind/Feuchte-Kernzustand | Forecast-Kern | 60 min | breites 5-min-Upsampling bringt wenig neue Information |
| SNOWLMT/HZEROCL/CEILING | nächster Kandidat | 15 min nur +0…6 h prüfen | hoher Phasen-/Aviationnutzen; gezielter statt flächiger Ausbau |

## Speicher-/Traffic-Effekt

Berechnet mit 542.040 RUC-Punkten und int16-Speicherung:

- 25 Zeitstände (+0…6 h / 15 min): 27.102.000 Byte = 25,85 MiB **pro Feld**.
- 57 Zeitstände (+0…14 h / 15 min): 61.792.560 Byte = 58,93 MiB **pro Feld**.
- 73 Zeitstände (+0…6 h / 5 min): 79.137.840 Byte = 75,47 MiB **pro Feld**.
- 6→14 h bei 15 min: +33,08 MiB **pro Feld und Lauf**.

Die Kosten multiplizieren sich mit Feldzahl, stündlichen RUC-Läufen, GitHub-Pages-Snapshotaufbewahrung und Worker-Traffic. Eine pauschale Verdichtung würde daher Ressourcen stark erhöhen, ohne proportional mehr Vorhersageinformation zu erzeugen.

## Niederschlagsphase

In v0.9.84.91:

1. `RAIN_GSP`, `SNOW_GSP`, `GRAU_GSP` aus `rapid.phase15` werden in das lokale Radar-Phasenraster übernommen.
2. Die native Modellphase wird gegen die vorhandene thermodynamische Information plausibilisiert.
3. OPERA bleibt Beobachtungsmaske: ohne Radarecho kein nichtflüssiges Phasensymbol.
4. Bei unvollständigem/stalem RUC-Block fällt MID auf die bisherige Rapid-/Regionalmodell-Phase zurück.
5. Hail wird nicht pauschal aus Graupel abgeleitet; vorhandene WMO-/Severe-/Hail-Diagnostik bleibt getrennt.

## Nächste mögliche Ausbaustufe

Nicht sofort umgesetzt, aber fachlich sinnvoll zu evaluieren:

- `SNOWLMT` + `HZEROCL` als kompakter 15-Minuten-Nahbereich +0…6 h für Phasengrenzen,
- `CEILING` 15 min für Flug-/Nebel-/tiefe Wolkenanwendungen,
- kompakte kategoriale Ableitungen statt Vollfeldspeicherung, falls Pages-Budget relevant bleibt,
- optional HAIL_GSP/KE-Hail nur für konvektive Zellen/Severe-Pfad und nicht als flächendeckende Radarphase.

Breites 5-Minuten-Upsampling langsamer Felder bleibt ausdrücklich **nicht empfohlen**.

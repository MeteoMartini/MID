# MID v0.9.35.0

## I. Langfrist – echtes Multi-Modell

- ECMWF-Varianten werden nicht mehr als unabhängige Modellfamilien gezählt.
- Lokales numerisches Multi-Modell: ECMWF EC46/SEAS5 + sämtliche im neuesten verfügbaren NOAA-NMME-ENSMEAN-Lauf numerisch vorhandenen Modellfamilien.
- NOAA CFSv2 E1/E2/E3 dient als zusätzlicher Fallback, falls der NMME-ENSMEAN-Lauf vorübergehend nicht auswertbar ist.
- Gleichgewichtung nach Modellfamilie statt Roh-Memberzahl.
- Gemeinsame Rauchfahne: Mittellinie = Multi-Modell-Mittel; Band = Ensemble-/Intermodell-Unschärfe.
- Temperatur in K, gemeinsamer Niederschlagsvergleich als Anomalie in mm/Tag zum jeweiligen Modellklima.
- Einzelmodellansicht bleibt erhalten.
- Erster Monatszeitschritt erhält zusätzlichen Innenabstand zur Y-Achse.

## II. Berg-/Wintersport – Schneefallgrenze

- Vollständig einklappbare Schnellübersicht.
- Horizonte: 1 / 3 / 7 / 14 Tage.
- Multi-Modell-Ensemble aus verfügbaren Ensemble-Mean/Spread-Systemen von DWD, ECMWF, NOAA, CMC und Google; nicht verfügbare Systeme fallen einzeln aus, ohne die Gesamtgrafik zu blockieren.
- Medianlinie, 25–75-%-Innenband und 10–90-%-Außenband.
- Oberhalb der Schneefallgrenze blauer Bereich, darunter grüner Bereich.
- Tal/Mitte/Berg als kontrastreiche Höhenreferenzen.
- Antippen des Diagramms setzt einen Zeitschritt; kompakte Zeile zeigt Zeitpunkt, Median, 10–90-%-Spanne, Modell- und Memberzahl.
- Die bisherigen großen Zusatzkarten unter dem Diagramm entfallen.
- Bei nicht erreichbarem Ensemble bleibt die Best-Match-Schneefallgrenze als Fallback.

## Worker

- Funktionale Änderung: neuer NOAA-NMME/CFSv2-Endpunkt `cfsv2-seasonal-point`.
- Aktuellsten verfügbaren NMME-ENSMEAN-Lauf automatisch ermitteln.
- Alle darin vorhandenen Modellfamilien mit passenden Temperatur-/Niederschlagsanomaliedateien einlesen.
- NetCDF-Classic-Punktparser verwendet den nächstgelegenen Rasterpunkt.
- CFSv2-E1/E2/E3 bleibt als Rückfallpfad.

## Prüfung

- 348/348 automatisch erkannte MID-Regressionstests bestanden.
- 88/88 TS/TSX-Quelldateien parsergeprüft.
- Worker-JavaScript mit `node --check` geprüft.

**Worker-Upload erforderlich: Ja.**

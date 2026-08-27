# MID v0.9.67.7 – Extremwetter-Ausblick Mitteleuropa / vollständiges ICON-D2-Gebiet

## Ziel
Der bisher als DACH geführte Extremwetter-Ausblick wird auf das vollständige ICON-D2-Modellgebiet erweitert und in der Oberfläche als **Mitteleuropa** bezeichnet.

## Räumlicher Vertrag
Nach der DWD-Modellbeschreibung wird die reale, gedrehte ICON-D2-Ausgabefläche durch die geografischen Eckpunkte angenähert:
- Südwest: 0,25° W / 43,19° N
- Südost: 17,54° E / 43,42° N
- Nordwest: 3,84° W / 57,31° N
- Nordost: 20,21° E / 57,62° N

MID rekonstruiert aus der offiziellen DWD-Rotation (rotierter Nordpol 170° W / 40° N) die vier gekrümmten Modellränder mit 24 Stützintervallen je Kante. Dadurch wird nicht nur das Eckpunkt-Viereck angenähert: Die gekrümmte Nordkante erreicht in der Mitte knapp 58,0° N. Die Kartenbounds reichen deshalb von 3,85° W bis 20,21° E und 43,18° N bis 58,0° N. Damit wird das vollständige ICON-D2-Modellgebiet betrachtet, nicht nur Deutschland, Österreich und die Schweiz.

## Analyseraster und Abrufschutz
Das regionale Analyseraster wird von 13 × 17 auf 19 × 31 Knoten erweitert. Für die Analysezentren wird ein leicht eingerückter Rasterrahmen von 3,5° W bis 19,9° E und 43,45° N bis 57,75° N verwendet; die Abdeckungsmaske bleibt die vollständige gekrümmte ICON-D2-Domäne. Dadurch liegen auch an den Randzonen belastbare Stützpunkte innerhalb des Modellgebiets. Der Rasterabstand beträgt rund 60–100 km. Die Open-Meteo-Mehrpunktabrufe bleiben in 60er-Batches und werden mit höchstens vier parallelen Batches ausgeführt, damit die deutlich größere Fläche nicht zu unnötigen Lastspitzen führt.

## Regionen
Die Regionszuordnung wurde über D/A/CH hinaus u. a. um Südostengland, Nordsee, Dänemark, Niederlande, Belgien, Frankreich, Tschechien, Polen, Slowakei, Westungarn, Slowenien, Nordwestkroatien und Norditalien ergänzt. Die bereits feineren Alpenregionen bleiben erhalten.

## Oberfläche und Cache
- Sichtbare Bezeichnung: **MID Extremwetter-Ausblick · Mitteleuropa**.
- Untertitel: gesamtes ICON-D2-Modellgebiet.
- Sicherheitsverweis auf die jeweils zuständigen nationalen Warnstellen bzw. MeteoAlarm.
- Payload-Scope: `Mitteleuropa`.
- Cachegeneration `v4`, damit alte DACH-Payloads mit kleinerem Gebiet nicht als vollständiger neuer Ausblick erscheinen.
- Der interne Worker-Routenname `dach-extreme-outlook` bleibt aus Kompatibilitätsgründen unverändert; er ist nicht Teil der sichtbaren Produktbezeichnung.

## Unverändert
Gefahrenarten, I1–I4-Schwellen, P-Wahrscheinlichkeiten, Canvas-Konturen, Schraffur, Marker-/Popup-Kopplung sowie der MapLibre-6.5.0-Kartenkern bleiben fachlich unverändert.

# MID 0.9.66.6 – feldbasierte DACH-Gefahrengebiete

## Befund

Die bisherige Konturdarstellung erhielt nur bereits sichtbare Modellstützfelder. Um jedes isolierte Feld wurde derselbe radialsymmetrische Stützkern gelegt. Deshalb entstanden wiederholt nahezu identische, sechseckig wirkende Flächen. Diese Geometrien beschrieben nicht den räumlichen Verlauf des Wahrscheinlichkeitsfeldes.

## Umsetzung

- Für jedes DACH-Stützfeld und jede Gefahr werden nun die vollständigen, monotonen Überschreitungswahrscheinlichkeiten der Intensitäten I1 bis I4 ausgegeben – auch unterhalb der Darstellungsschwelle.
- Die Professional-App baut daraus ein zusammenhängendes skalares Wahrscheinlichkeitsfeld auf dem georeferenzierten DACH-Raster auf. Zwischen benachbarten Stützfeldern wird bilinear interpoliert; fehlende Rasterpunkte begrenzen die DACH-Abdeckung.
- Die festgelegten Schwellen bleiben unverändert: 40 % in der Gesamtlage, 10 % in den Einzelgefahren und 5 % für I4-Ausnahmesignale. Für jede Intensität wird die zugehörige Isoplethe aus ihrem eigenen Wahrscheinlichkeitsfeld abgeleitet.
- Zusammenhängende Schwellenüberschreitungen werden zu einem Gefahrengebiet verbunden. Lage, Ausrichtung, Ausdehnung und Rand folgen damit den räumlichen Modellgradienten; identische Stützpunkt-Sechsecke und Rechteckzellen werden nicht mehr erzeugt.
- I1 bis I4 werden von niedriger zu höherer Intensität geschichtet. So können stärkere Kerne innerhalb größerer, niedrigerer Intensitätsflächen erscheinen. Farbe, Deckkraft, Schraffur und Prozentmarker behalten ihre bisherige Bedeutung.
- Die Kartenbeschreibung benennt ausdrücklich vollständige Wahrscheinlichkeitsfelder und unterscheidet die modellbasierten Gefahrengebiete weiterhin von amtlichen Warnpolygonen und gemeindescharfen Aussagen.

## Datenweg und Kompatibilität

Die zusätzlichen Feldwerte werden aus den bereits abgerufenen ICON-D2-EPS-/ICON-D2-Daten berechnet. Anzahl der Modellabrufe, Datenquellen, fachliche Schwellen, Parameter und appweite Einheiten ändern sich nicht. Der kanonische Worker und der daraus generierte kostenlose Browser-Direktweg verwenden dieselbe Berechnung.

Ein älterer Worker bleibt technisch kompatibel; die App rekonstruiert dann bestmögliche Konturen aus den vorhandenen Signalen. Für die vollständige, durch Unterschwellenwerte geformte Geometrie muss der Worker 0.9.66.6 aktiv sein oder der Browser-Direktweg verwendet werden. Der Outlook-Cache wurde deshalb auf v3 migriert.

## Ausgangsstand und Absicherung

Die Umsetzung baut vollständig auf den geprüften Nutzerpaketen MID 0.9.66.5 auf. Deren robuste klimatologische Reise-Wassertemperatur mit SST-v4-Cache, unabhängigen ERA5-Ocean-Referenzjahren, 80-km-Küstenradius und sichtbarer Fehlerdiagnose bleibt unverändert erhalten.

Die Regression `scripts/test-extreme-outlook-field-contours-09666.mjs` prüft vollständige I1–I4-Felder, monotone Worker-Ausgabe, unveränderte Schwellen, getrennte und verschmolzene unregelmäßige Gebiete, Reaktion auf Unterschwellenwerte, DACH-Abdeckung, Canvas-Füllung und das Fehlen der alten Radialkern-/Sechsecklogik. Zusätzlich bleibt die Reise-SST-Regression aus 0.9.66.5 verbindlich.

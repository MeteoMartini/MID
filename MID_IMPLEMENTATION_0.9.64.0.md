# MID v0.9.64.0 – ausrichtungsabhängige mobile 7-Tage-Darstellung

## Hochformat – vollständige Tageszeilen

- Auf Mobilgeräten und Tablets im Hochformat wird jeder Prognosetag als vollständige, kompakte Zeile dargestellt.
- Die Zeile enthält weiterhin Wochentag und Datum, Tag-/Nachtpiktogramme, farbig klassifiziertes Wetterregime, Minimum und Maximum, Temperaturspanne, Niederschlagsmenge, Wahrscheinlichkeit und Dauer, Windrichtung, Mittelwind, Böen sowie den Stundenaufruf.
- Alle sieben Tage stehen untereinander. Horizontales Scrollen, Ellipsis und abgeschnittene Fachwerte sind für diesen Pfad ausgeschlossen.
- Im Hochformat wird der Wochentag ausgeschrieben; die schmale Datumsnotation bleibt zusätzlich erhalten.

## Querformat – sieben vollständige Schmalspalten

- Im Querformat verteilt das Cockpit die sieben Tage auf sieben gleich breite, schrumpfbare Spalten.
- Die Karten behalten denselben vollständigen Informationsumfang wie das Hochformat und benötigen keine horizontale Bewegung.
- Längere Wetter- und Niederschlagstexte dürfen innerhalb der jeweiligen Karte umbrechen, aber weder aus dem Rahmen laufen noch per Ellipsis verschwinden.

## Farbige Wetterregime

Die vorhandene fachliche Klassifikation bleibt unverändert und wird in beiden Ausrichtungen als farbige Regimepille dargestellt:

- Nass/Regen bzw. konkrete Niederschlagsart: Blau
- Schauer: Türkisblau
- Sonnig: Gelb/Gold
- Wind: Grün
- Heiß: Orange
- Ruhig: Grau

Die Temperaturfarbtöne für Minimum und Maximum bleiben davon getrennt und verwenden weiterhin die klimatologische Einordnung.

## Worker

Die Änderung betrifft ausschließlich React-Markup und responsives CSS der Professional-App. Wetterdaten, Prognosefusion, Radar/Nowcast, Push und Worker-Routing bleiben unverändert. Ein Worker-Update ist fachlich nicht erforderlich.

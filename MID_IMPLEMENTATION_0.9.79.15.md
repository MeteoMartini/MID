# MID v0.9.79.15 – MOSMIX-Anteil und Laufaktualität transparent

## Extern
- Im Modellstand wird der ungefähre direkte MOSMIX-Korrekturanteil für Temperatur, Tmin/Tmax, Taupunkt, Druck, Wind/Böen sowie den Niederschlags-Konsensanker beziffert.
- Jede Modellzeile zeigt zusätzlich eine Aktualitätsbewertung aus Init-Zeit und Modellzyklus.
- DWD MOSMIX erhält nun einen echten, offiziell verifizierten Init-Zyklus statt „von Quelle nicht ausgewiesen“, sofern der DWD-OpenData-Laufindex erreichbar ist.

## Intern
- MOSMIX-L-Init wird aus dem offiziellen DWD-OpenData-Dateinamen `MOSMIX_L_YYYYMMDDHH.kmz` gelesen; der Bereitstellungszeitpunkt wird getrennt geführt.
- Bei fehlender Verifikation wird kein Init geraten.
- Die stündliche MOSMIX-Gewichtsfunktion ist im Frontend zentralisiert und wird sowohl für die echte Korrektur als auch für die UI-Anteilsanzeige verwendet.
- Neuer Vertrag und Regression sichern Laufmetadaten, Aktualitätsanzeige und Anteilslogik.

## Worker
Fachliche Workeränderung: ja. Der Worker muss für die MOSMIX-Laufmetadaten aktualisiert werden.

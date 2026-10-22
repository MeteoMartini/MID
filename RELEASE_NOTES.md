# MID v0.9.85.309

- Extremwetter-Ausblick: Verschachtelte Gefahrenflächen mit Löchern und Inseln erscheinen nicht mehr mehrfach übereinander; ihre modellierten Werte bleiben unverändert.

- Extremwetter-Ausblick: Bei einer nicht geladenen oder leer gerenderten nativen Gefahrenebene kann eine georeferenzierte Ersatzdarstellung aus denselben modellierten Wahrscheinlichkeitskonturen einspringen.
- Ein klarer Hinweis kennzeichnet diesen Ersatzmodus; Gefahrenstufen, Eintrittswahrscheinlichkeiten, Schraffuren und amtliche Warnungen bleiben fachlich unverändert.
- Der native Kartenlayer bleibt der bevorzugte Normalfall und wird nach erfolgreicher Wiederherstellung erneut verwendet.

- Extremwetter-Kartenfallback erkennt zusätzlich explizit ausgeblendete bzw. vollständig transparente native Fill-Layer, auch wenn die Featureabfrage Geometrie zurückliefert. Keine Änderung meteorologischer Felder.

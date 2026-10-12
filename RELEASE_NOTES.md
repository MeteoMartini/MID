# MID v0.9.85.245 · Robuste Wetterdatenabfragen

- Geschlossene Karten-Info-Dialoge geben den Tastaturfokus nur zurück, wenn inzwischen kein anderes Bedienelement ausgewählt wurde. Dadurch bleiben Deckkraftregler und Kartentermin unabhängig bedienbar.
- Identische gleichzeitige Wetterdatenabfragen werden weiter gemeinsam ausgeführt, ohne dass der Abbruch einer Ansicht andere aktive Ansichten beeinträchtigt.
- Bei Orts- und Ansichtswechsel werden nicht mehr benötigte Abfragen beendet, weiterhin benötigte Daten jedoch zuverlässig geladen.
- Explizite längere Wartezeiten von Open-Meteo werden eingehalten; unnötige erneute Versuche bei einer längeren Sperre werden vermieden.
- Zusätzliche automatische Tests sichern gemeinsame Abfragen, unabhängige Abbrüche und die Behandlung von Rate-Limits ab. Wettermodelle und Vorhersageberechnung bleiben unverändert.

# MID v0.9.85.245 · Robuste Wetterdatenabfragen

- Die Deckkraftsteuerung in Wetterkarten behält nach einer Änderung ihren Tastaturfokus; Pfeiltasten bleiben beim Regler und verändern nicht unbeabsichtigt den Kartentermin.
- Identische gleichzeitige Wetterdatenabfragen werden weiter gemeinsam ausgeführt, ohne dass der Abbruch einer Ansicht andere aktive Ansichten beeinträchtigt.
- Bei Orts- und Ansichtswechsel werden nicht mehr benötigte Abfragen beendet, weiterhin benötigte Daten jedoch zuverlässig geladen.
- Explizite längere Wartezeiten von Open-Meteo werden eingehalten; unnötige erneute Versuche bei einer längeren Sperre werden vermieden.
- Zusätzliche automatische Tests sichern gemeinsame Abfragen, unabhängige Abbrüche und die Behandlung von Rate-Limits ab. Wettermodelle und Vorhersageberechnung bleiben unverändert.

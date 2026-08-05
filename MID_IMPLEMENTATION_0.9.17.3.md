# MID v0.9.17.3

- Klick/Tipp auf Kurzfrist-Zeitpunkte funktioniert jetzt in 90-Minuten-Slots, Kurzfristmatrix und 24h-Stundenleiste.
- Kurzfristdetails werden über eine aktive Auswahl im Cockpit direkt aktualisiert.
- Kurzfrist-Temperaturen nutzen nun ECMWF-orientierte Temperaturfarben.
- Das bisherige Kurzfristdiagramm wurde durch eine interaktive Kurzfristmatrix mit allen relevanten Parametern ersetzt.
- Mobile/schmale Displays zeigen die Kurzfristkacheln als flache, horizontal gestreckte Felder in Einspaltenlogik.
- Responsive CSS für Matrix, Fokuskarte und 24h-Leiste erweitert.
- Regression `scripts/test-cockpit-shortterm-interaction-09173.mjs` ergänzt und Versionsstand auf v0.9.17.3 fortgeschrieben.

- CI-Buildkorrektur: ungenutzte Deklarationen beseitigt beziehungsweise fachlich in die Kurzfristdarstellung eingebunden; TypeScript-TS6133-Schutz ergänzt.

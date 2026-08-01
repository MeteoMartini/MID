## MID v0.8.27.9

### Umgesetzt
- Das Temperatur-Ensemble-Tooltip wurde in Schriftgrößen, Abständen, Padding und Maximalbreite gezielt verdichtet, damit es näher an der früheren kompakten Darstellung liegt.
- Die Wetter-/Bewölkungskästchen im Temperatur-Ensemble wurden nochmals schmaler gemacht und stärker nach oben versetzt.
- Die X-Achsenreserve des Temperaturdiagramms sowie der Bereich für den Achsentitel „Vorhersagetag“ wurden vergrößert, damit Datumslabels und Achsentitel nicht mehr verdeckt werden.
- Für rechts liegende Datenpunkte wurde die Tooltip-Verschiebung weiter verstärkt, um abgeschnittene rechte Spalten zu vermeiden.

### Betroffene Dateien
- `src/EnsemblePanel.tsx`
- `src/styles.css`
- Versionssynchronisation in Frontend und Worker

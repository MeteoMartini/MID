# MID v0.9.60.7 – Zeitpfeil-Sichtbarkeit und Orts-Pfeilspitze

- Für den Zeitpfeil wurde eine eigene Vektor-Pane `mid-motion-vectors` oberhalb der Kartenbasis eingeführt, damit Schaft, Tick-Marken und Label-Verbindungen im Kompositbild zuverlässig sichtbar bleiben.
- Zusätzlich besitzt die Pfeilspitze selbst nun einen integrierten kurzen Schaft, sodass die Bewegungsrichtung direkt am gewählten Ort auch dann klar erkennbar bleibt, wenn der Ort nicht der aktuelle Standort ist.
- Ergänzend wird am Ort ein kurzer Vorwärts-Schaft in Bewegungsrichtung gezeichnet, damit die Pfeilspitze sichtbar vom ausgewählten Ort ausgeht.
- Die zyklische Umschaltung des Zeitpfeils (absolute Zeiten → relative Zeiten → aus) bleibt unverändert erhalten.

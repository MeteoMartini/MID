# MID v0.9.60.5 – Kompositbild Zeitpfeil (sichtbare Linie + Zyklus)

- Der Zeitpfeil-Schaft und seine Tick-/Label-Verbinder werden jetzt im regulären `overlayPane` gezeichnet statt in einem separaten Vektor-Pane. Dadurch bleibt die Linie im Kartenbild zuverlässig sichtbar und verschwindet nicht mehr scheinbar vollständig.
- Der Zeitpfeil-Schalter arbeitet nun zyklisch in genau drei Stufen: **absolute Zeiten → relative Zeiten → aus**. Beim erneuten Einschalten startet er wieder mit absoluten Zeiten.
- `motionTimeMode` wird nicht mehr versehentlich hart auf `absolute` fest verdrahtet, sondern korrekt aus den gespeicherten Einstellungen initialisiert und als React-State fortgeführt.
- Die Detailzeile des Schalters zeigt jetzt den aktuellen Zustand (`absolute Zeiten`, `relative Zeiten`, `aus`) zusammen mit Zugrichtung und Geschwindigkeit an.
- Die bestehende Korrektur, dass sich die Zeitlabels auf den tatsächlich angezeigten Film-/Kompositzeitpunkt beziehen, bleibt erhalten.

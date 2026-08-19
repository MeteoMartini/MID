# MID v0.9.60.6 – Regression-/Aggregate-Konsolidierung

- Drei Regressionen, die noch den alten Canvas-/Custom-Pane-Zeitpfeil erwarteten, wurden auf den aktuellen Polyline-/OverlayPane-Vertrag migriert.
- Die kanonische Worker-Teilquelle trägt nun ebenfalls v0.9.60.6, sodass `maintain:aggregates` den erzeugten Worker nicht mehr auf v0.9.60.2 zurücksetzt.
- Dadurch bleiben Radarphase, Wetterkartenmodul und Radar-/Wetterkarten-Interaktion nach dem CI-Vorlauf versionssynchron.
- Keine fachliche Änderung an Radarphase, Wetterkarten, Flugkorridor oder Schwerpunktströmung.

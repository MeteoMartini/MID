# MID v0.9.32.17

## Nachhaltige Speicher-/Quota-Sicherung

- Neue zentrale `storageSafety`-Schicht initialisiert vor React, Persistenz und Gerätesync.
- `QuotaExceededError` führt ausschließlich zur Bereinigung rekonstruierbarer Wetter-/Modell-/Diagnose-Caches und anschließendem automatischem Schreib-Retry.
- Dauerhafte MID-Daten werden zusätzlich schlüsselweise in IndexedDB gespiegelt. Scheitert ein nativer `localStorage`-Schreibvorgang trotz Cache-Bereinigung, bleibt der neuere Wert im IndexedDB-/Memory-Fallback erhalten und wird beim nächsten Start wiederhergestellt.
- Persistenz-Snapshot und Gerätesync berücksichtigen auch Fallback-Werte, damit insbesondere Favoriten nicht mehr wegen einer vollen `localStorage`-Partition verloren gehen.
- 64-KiB-Sicherheitsreserve schafft nach erfolgreicher Bereinigung zusätzlichen Spielraum für kritische Nutzeraktionen.
- Wetterzwilling: vollständiger Langzeitbestand bleibt in IndexedDB und Gerätesync erhalten; die redundante `localStorage`-Schnellstartkopie wird auf 72 Captures, 60 Referenzen und 192 Beobachtungen je Standort begrenzt. Bestehende größere lokale Kopien werden erst nach erfolgreicher Spiegelung nach IndexedDB verkleinert.
- Favoriten, Einstellungen, Standortprofile und andere dauerhafte Nutzerdaten werden von der Quota-Bereinigung ausdrücklich nicht entfernt.

# MID v0.9.85.193

- Der Installer prüft Core und Heavy-Regressionen parallel auf getrennten Runnern, ohne Tests auszulassen.
- Alle 24 Karten-Browserfälle werden verlustfrei auf drei isolierte Gruppen verteilt.
- Event-SHA, Manifest-, Archiv- und Datei-Hashes binden sämtliche Jobs an dasselbe validierte Release-Paket. Commit und Deployment bleiben bis zum Erfolg aller Prüfungen gesperrt.
- Laufzeitberichte je Test und Kartenfall machen Verzögerungen messbar. Keine Testergebnisse werden zwischen Releases wiederverwendet; sämtliche bestehenden Deployment-/Stable-Gates bleiben erhalten.

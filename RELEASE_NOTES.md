# MID v0.9.85.249 · RUC-Speicheroptimierung sicher vorbereiten und CSS-Startlast messen

- MID prüft neue verlustfreie RUC-Kompressionsverfahren jetzt mit einem zusätzlichen Sicherheitscheck. Dabei bleiben sämtliche 16-Bit-Werte einschließlich fehlender Wetterdaten unverändert; beschädigte und zu große Datenpakete werden im Test erkannt.
- Der Qualitätscheck misst nun die beim App-Start direkt eingebundenen CSS-Dateien auch in gzip- und Brotli-Größe. Das schafft eine Grundlage für gezielte Ladezeitverbesserungen ohne Layoutverlust.
- Noch keine Änderung der tatsächlich ausgelieferten RUC-Datenformate oder des Wetterkartenangebots: Eine produktive Kompressionsumstellung erfolgt erst nach Web-, Worker-, iOS- und Frischeprüfung.
- Prognosen, Warnungen und das gewohnte App-Design bleiben unverändert.

# MID v0.9.85.263 · Begrenzte parallele RUC-Dekodierung und Offline-Nachweis

- Gleichzeitige Abrufe desselben komprimierten RUC-Chunks teilen jetzt einen einzigen geprüften Ladevorgang. Höchstens zwei unterschiedliche Codec-Vorgänge laufen gleichzeitig; weitere Abrufe nutzen den verifizierten Rohfallback.
- Zusätzliche Prüfungen decken parallele Abrufe, Fehler und Wiederanlauf sowie den Original-Service-Worker von .257 und den aktuellen Service-Worker im Browser ab. Offline dürfen keine alten oder beschädigten Cacheeinträge als aktuelle Wetterwerte erscheinen.
- Der bestehende verlustfreie Pilot und die Rohkopien bleiben erhalten. Dieser Schritt begrenzt Decoderarbeit und verbessert die geprüfte Kompatibilität; eine vollständige Rohdatenablösung oder Netto-Speicherreduktion wird damit nicht freigegeben.

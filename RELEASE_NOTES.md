# MID v0.9.85.266 · RUC-Vollkompression im Worker sicher vorbereiten

- Der MID-Datenworker kann künftig einzelne Datensätze aus einem vollständig verlustfrei komprimierten RUC-Paket lesen. Größen, SHA-256-Prüfsummen und unveränderte Wetterwerte einschließlich fehlender Werte bleiben geschützt.
- Das neue Ersatzformat wird nur akzeptiert, wenn das Manifest ausdrücklich als produktives, versioniertes Format gekennzeichnet ist. Ein vorbereiteter Kandidat wird weiterhin abgewiesen.
- Der bisherige Rohdatenpfad und der bereits geprüfte Kompressionspilot bleiben erhalten. Die laufenden RUC-Modellläufe und Modellkarten werden durch dieses Update noch nicht umgestellt.
- Vor der endgültigen Speicherfreigabe folgen eigenständige Worker-/Browser-/Altclient-, Frische-, Budget- und Rollbackprüfungen. Die Speichergrenze bleibt unverändert.

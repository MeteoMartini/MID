# MID v0.9.85.322

- RUC: Isolierte native DWD-/RADOLAN-/Synoptik-Seitenschritte trennen native Bibliothekslebenszyklen im Pages-Packer; die Crash-Behebung muss im echten Datenlauf bestätigt werden.
- Native Prozessabstürze, fehlgeschlagene Metadaten-/Integritätsprüfungen und Codec-Fehler bleiben fatal. Die vollständige verlustfreie Migration, der gesicherte Raw-Rollback und der 900-MB-Grenzwert bleiben unverändert.
- Die tatsächliche Wiederherstellung erfordert separate RUC-, Pages-, Worker-, Fusion- und Stable-Live-Nachweise; ein grünes Source-Gate allein genügt nicht.

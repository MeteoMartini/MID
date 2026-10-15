# MID v0.9.85.264 · Vollständige RUC-Inventur und begrenzter Kompressionsnachweis

- Die vollständige Speicherprüfung verifiziert jetzt auch JSON-Dateien, bereits komprimierte Karten und Dateien außerhalb der Codec-Grenze gegen Größe und SHA-256. Beschädigte Bestände gelten nicht als erfolgreich geprüfte Inventur.
- Ein neuer separater Offline-Prüfer untersucht den gesamten materialisierten RUC-Bestand. Er zerlegt deklarierte 16-Bit-Datensätze verlustfrei an Datensatzgrenzen in höchstens 512 KiB große Teile und prüft die Rückwandlung unabhängig in Python und JavaScript.
- Der Nachweis bilanziert Originale, deduplizierte Codec-Dateien und Deskriptoren getrennt. Er zeigt sowohl einen hypothetischen Ersatzbestand als auch den zusätzlichen Platzbedarf bei erhaltenen Rohkopien. Die Quelldateien bleiben unverändert.
- Die vollständige Rohdatenablösung ist damit noch nicht aktiviert: Der Offline-Nachweis ersetzt weder ein produktives Migrationsformat noch den rückfallfähigen Rollout oder CPU-/RAM-Nachweise. Der aktive Pilot und das Speicherbudget bleiben erhalten.

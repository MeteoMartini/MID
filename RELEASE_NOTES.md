# MID v0.9.85.377

- Veröffentlichungsabläufe werden nach erfolgreichen Installationen automatisch und mit ihren tatsächlichen Wiederholungen ausgewertet. Fehlende Zeitwerte bleiben erkennbar.
- Ein getrennter Prüfablauf vergleicht zwei unabhängig erzeugte Web-Builds vollständig. Das bereitet sichere weitere Optimierungen vor; sämtliche bisherigen Releaseprüfungen bleiben erhalten.
- Wartende Source-Release-Aufträge werden seriell abgearbeitet, ohne durch einen späteren wartenden Auftrag verdrängt zu werden.

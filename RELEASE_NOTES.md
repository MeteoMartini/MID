# MID v0.9.85.383 – RUC-Lauf und Vollständigkeit exakt prüfen

- MID prüft bei RUC-Veröffentlichungen nun die vollständige Vorhersagezeitachse, Modellgitter und Ensembleanzahl anhand eines vorab verifizierten Snapshots.
- GitHub Pages und der produktive Worker müssen exakt dieselbe Run-ID und die erwarteten 28 Stunden, 20 Ensemblemitglieder und Rasterpunktanzahl melden. Unvollständige Felder oder verkürzte Daten dürfen nicht nur wegen eines erfolgreichen Workflows als betriebsbereit gelten.
- Bei verzögerter Veröffentlichung bleiben begrenzte Wiederholungsprüfungen und der vorherige gültige Datenstand erhalten. Der getrennte, vollständig geprüfte 14-Stunden-Rohrollback bleibt bei einem Codec-Ausfall ausdrücklich verfügbar. Fehlende Wetterwerte werden nicht als Nullwerte ersetzt.
- Die originalen DWD-Werte, amtliche Warnungen, Benutzeroberfläche und der sichere Releasepfad bleiben unverändert.


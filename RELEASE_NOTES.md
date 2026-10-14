# MID v0.9.85.257 · RUC-Kompression mit isolierter Transportprüfung

- Ein getrenntes Diagnoseprodukt prüft die verlustfreie RUC-Kompression über die tatsächlich verwendete Dateiauslieferung. Rohdaten und drei Codecvarianten müssen alle 65.536 möglichen 16-Bit-Muster exakt erhalten.
- Browser und Worker verwenden dafür denselben geprüften Decoder. Dateigröße, Prüfsummen, HTTP-Auslieferung und ein getrennter Browser-Cache werden kontrolliert; beschädigte Antworten werden zurückgewiesen.
- Die Tests unterscheiden automatische HTTP-Entpackung von einer komprimierten Codec-Datei. Das verhindert eine falsche Bestätigung ungeeigneter Transportformate.
- Die Diagnose arbeitet ausschließlich mit synthetischen Testdateien. Die produktiven RUC-Daten, ihre Genauigkeit, Zeitschritte, Speichergrenze und bestehenden App-Caches bleiben bis zur gesonderten Migrationsabnahme unverändert.

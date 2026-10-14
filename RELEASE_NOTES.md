# MID v0.9.85.256 · RUC-Kompression sicher für Browser und Worker vorbereiten

- Der neue Prüfschritt kann künftig verlustfrei komprimierte RUC-Wetterdaten in JavaScript wieder exakt in ihre ursprünglichen Werte umwandeln. Dabei werden auch fehlende Werte korrekt erhalten.
- Ein zusätzlicher automatisierter Test prüft alle 65.536 möglichen 16-Bit-Muster und echte Python-Kompressionsdateien. Beschädigte, verkürzte oder unerwartete Daten werden zurückgewiesen.
- Die Messung eines vollständigen RUC-Laufs zeigt für Byteplane-gzip rund 70,8 Prozent theoretisches Einsparpotenzial beim bisher veröffentlichten Datenbestand. Das ist eine Messung, noch keine aktivierte Speicherreduktion.
- Die bisherige RUC-Veröffentlichung, Wetterberechnungen, Karten und das bestehende Datenformat bleiben unverändert, bis Web-/Worker-Dual-Read, echte Leistungsprüfungen und die alten App-Caches sicher getestet sind.

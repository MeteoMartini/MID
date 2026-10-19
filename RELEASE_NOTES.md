# MID v0.9.85.299

- Die Buildprüfung erkennt jetzt fehlende Haupt-CSS- oder JavaScript-Dateien in einem bereits angelegten Produktions-Build zuverlässig als Fehler. Ein unvollständiges Bundle wird nicht mehr als erfolgreiche Null-Byte-Messung ausgegeben.
- Bestehende Größenbudgets, CSS-Kaskade, Layout und Wetterberechnungen bleiben unverändert; die gezielte CSS-Verkleinerung erfordert weiterhin separate Browser-Paritätsmessungen.

# MID v0.9.85.258 · Begrenzter RUC-Dual-Read-Pilot mit Rohdaten-Rückfall

- Die RUC-Aufbereitung kann erstmals eine kleine verlustfrei komprimierte Kopie eines tatsächlichen Chunks ergänzen. Alle Rohdateien bleiben erhalten; die Kopie wird nur bei ausreichendem freiem Speicher veröffentlicht.
- Der neue Worker kann sie im deterministischen Punktadapter lesen. Schlüssel, Chunk-Geometrie, Größen und Prüfsummen müssen stimmen. Andere Produkte und alte Worker behalten ihren bisherigen Datenweg.
- Eine defekte Kopie führt zum diagnostizierten Rohdaten-Rückfall. Der Datenweg kann auf Rohdaten zurückgestellt werden; Wetterwerte, Missing und Zeitauflösung bleiben gleich.
- Noch keine vollständige Speicherumstellung: keine Rohdatenentfernung, keine App-Cache-Löschung und keine Erhöhung des 900-MB-RUC-Budgets.

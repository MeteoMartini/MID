# MID v0.9.85.265 · Vollständige RUC-Kompression als geprüften Kandidaten vorbereiten

- Ein separates Werkzeug erstellt jetzt ein vollständiges verlustfrei komprimiertes RUC-Ersatzpaket mit eigenem Profil, geprüften Datensatzbereichen und exakter Bytebilanz einschließlich des endgültigen Manifests. Der Originalbestand bleibt als Rückfallreferenz unverändert.
- Ein vorbereiteter JavaScript-Reader liest die benötigten Datensätze mit begrenzter Parallelität, Warteschlange, Deadline und geprüften SHA-Werten. Er ist standardmäßig deaktiviert und wird noch nicht vom produktiven Worker geladen.
- Ein unabhängiger Nachweis prüft alle Kandidatendateien und jeden dekodierten Teil gegen die Originalbytes. Zusätzliche Vergleiche nutzen den tatsächlichen meteorologischen Record-Decoder für deterministische, EPS- und Rapid-Produkte.
- Die laufende RUC-Veröffentlichung bleibt beim bisherigen Profil mit Pilot. Die Aktivierung des vollständigen Ersatzformats erfordert noch die produktive Reader-Integration, Betriebsnachweise und einen gemeinsam geprüften Daten-/Worker-Rückfall.

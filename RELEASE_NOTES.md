# MID v0.9.85.111

- Die automatische MID-Revision behandelt kurzzeitige Netzwerk- und Providerfehler robuster, ohne den fachlichen Fail-Closed-Schutz zu lockern.
- Kritische API-Verträge erhalten höchstens drei begrenzte Abrufversuche bei Transportfehlern, HTTP 408/425/429 oder 5xx.
- Inhaltlich ungültige Antworten und nicht-transiente 4xx bleiben sofort echte Vertragsfehler; nach dem letzten erfolglosen Versuch bleibt die Revision rot.
- Die Änderung betrifft ausschließlich die Prüfautomatik. Wetterlogik, Berg-/Wintersportdaten, Worker-Fachlogik und sichtbare App-Funktionen bleiben unverändert.

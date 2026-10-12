# MID v0.9.85.244 · Temperaturspanne und verlässliche Radar-Basis

- Aktuelles zeigt Minimum und Maximum aller angezeigten 12-h-Stundenwerte statt einer Differenz zwischen Anfang und Ende. Fehlende Werte werden ausgewiesen.
- Prognose-Radar speichert Best-Match-Eingänge unabhängig vom Aufklappen. Favoriten werden bei sichtbarer, verbundener App alle 30 Minuten mit höchstens zwei parallelen Abrufen geprüft. Keine Hintergrund-Aufzeichnung bei geschlossener App.
- Anzahl gespeicherter Stände, letzter Stand und letzte Prüfung machen unveränderte Eingänge, Datenlücken und Fehler sichtbar. Fehlende Ensemble-Werte werden nicht als Nullen verglichen.
- Doppelte Kartenbeschreibungen konsolidiert hinter zugänglichem Info-Button; Legende, Quellen, Lauf, Termin und Fehlermeldungen bleiben erreichbar bzw. sichtbar. Auch Ortsvergleich, Radar-Methode und Prognosehinweis verwenden das gemeinsame Info-Popover.

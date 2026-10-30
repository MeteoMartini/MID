# MID v0.9.85.370

## Aufbereitete RUC-Daten nach App-Releases wiederverwenden
- Der RUC-Watchdog kann bei Datenrückstand einen bereits vollständig aufbereiteten Datensatz über seinen exakten Ursprungslauf erneut prüfen lassen. Ein App-Release muss dadurch keine erneute Wetterdatenberechnung auslösen.
- Herkunft, unveränderliche Artefakte, aktueller Datenvertrag, Frische, vollständige Datenbytes und JS-Decoder bleiben verpflichtend geprüft. Eine erfolgte Wiederaufnahme wird nicht fortlaufend erneut angefordert.
- Laufende Verarbeitungen, Wartefristen, Release-Schutz und Pages-/Worker-Gates bleiben unverändert. Ohne geeigneten Kandidaten bleibt der bisherige Berechnungspfad erhalten.

# MID v0.9.85.403 – Robustere RUC-Datenbeobachtung und messbare Ensemble-Verarbeitung

- **RUC-Datenbeobachtung zuverlässiger:** Die ausschließlich lesende DWD-Verfügbarkeitsprüfung wird auch nach einem erfolgreichen vertrauenswürdigen Release-Watchdog wieder ausgeführt. Ausgefallene oder übersprungene Beobachtungen gelten ausdrücklich nicht als gültige Wetterdaten.
- **RUC-Performance transparent messen:** Die vorhandene Verarbeitung des DWD-RUC-Ensembles erfasst getrennte Laufzeiten für Mitgliederdaten-Packing, Ensemble-Zusammenfassung und Binär-Packing. Das dient gezielter Beschleunigung ohne Änderung der Wetterwerte.
- **Vorhersagedaten unverändert:** Gemeinsamer vollständiger DWD-Lauf mit bis zu 27 Stunden und 20 Ensemblemitgliedern, korrekte Datenlücken, Zeit-/Einheitensemantik und amtliche Warnungen bleiben erhalten. Eine eigenständige produktive 0–6-h-Fast-Lane und die alternative EPS-Quantilberechnung sind weiterhin nicht freigeschaltet.

**Nachweisgrenzen:** Weder ein repräsentativer 168-h-DWD-Echtwert-Zeitraum noch ein 60-Minuten-P95 bis zu realen App-/Widget-/Export-Nutzern oder ein belastbarer EPS20-Produktions-Speedup sind mit dieser Version bewiesen.


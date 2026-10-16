# MID v0.9.85.274 · Modellstand: Einzelne ältere Läufe nicht pauschal rot

- Die Modellstand-Pillen der Kurzfrist-, 7-Tage- und 14-Tage-Prognosen bewerten nun den tatsächlich berücksichtigten Modellverbund statt automatisch das älteste Einzelmodell. Ein einzelner überfälliger Lauf unter sonst aktuellen Modellen wird gelb gemeldet und im Detail ausdrücklich als überfällig aufgeführt.
- Rot wird weiterhin angezeigt, wenn mindestens zwei Drittel der berücksichtigten Modellläufe überfällig sind oder der einzige verwendete Modelllauf überfällig ist. Grau kennzeichnet unverändert fehlende belastbare Modellmetadaten; vollständig aktuelle, verifizierte Läufe bleiben grün.
- Ausdrücklich nicht verwendete, lediglich geladene Kandidaten beeinflussen die Pille nicht mehr. Ein tatsächlich eingesetzter Ensemble-Fallback wird dagegen berücksichtigt. Grenzwerte der einzelnen RUC-, MOSMIX- und übrigen Modelle, Wetterwerte, amtliche Warnungen und die RUC-Kompression bleiben unverändert.

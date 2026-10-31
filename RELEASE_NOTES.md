# MID v0.9.85.387 – 7-Tage-Tagesdetails: Datenlücken meteorologisch korrekt darstellen

- Die 3-Stunden-Auflösung fasst Niederschlagsmengen und -wahrscheinlichkeiten nur bei gültigen, lückenlosen Beiträgen zusammen. Fehlende Werte werden nicht mehr als 0 mm oder 0 % ausgegeben.
- Die Wahrscheinlichkeitskurve der Tagesdetails unterbricht an fehlenden Daten und verbindet nur tatsächlich gültige, benachbarte Werte. Vorwärtsintervall-Zeitanker bleiben erhalten.
- Tooltip, Stundenliste, ausgewählter Kurvenpunkt und Tageskennzahlen verwenden dieselbe geprüfte PoP-Verfügbarkeit. Ungültige Zahlen erscheinen nicht als „NaN %“.
- Eine Ersatz-Tagesmenge aus Stundenwerten wird nur bei nachgewiesener lückenloser Abdeckung des lokalen Kalendertags gebildet – einschließlich 23-/25-Stunden-Tagen. Kanonische Tageswerte bleiben vorrangig.
- Gemeinsame NoData-Fachhelfer und verpflichtender adversarieller Regressionstest. Amtliche Warnungen, Modellfusion, RUC, Karten, Wetterpiktogramme und Nutzereinstellungen bleiben unverändert.
- Die vollständige appweite Browser-/iOS-/VoiceOver-Designabnahme #523 bleibt offen. Veröffentlichung ausschließlich nach Source-PR-Gate, SHA-Bot, serverseitigem ZIP, Installer, Worker-/Pages- und Stable-Promotion.

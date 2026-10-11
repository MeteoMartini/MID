# MID v0.9.85.238 · Adaptive Konturen und klare Ortsanzeige

- Numerische Isobaren/Isohypsen werden beim Zoomen mit 16/8/4 hPa bzw. dam sichtbar; veröffentlichte Daten bleiben unverändert. Isobaren unter 1013 hPa sind gestrichelt, auch im ICON-D2-Export.
- T/H erscheinen ausschließlich in reinen Bodendruckkarten, nicht im Synoptik-Komposit.
- Die Ortszeile erhält eine deckende, isolierte und untransformierte Darstellung; responsive Browserprüfungen berücksichtigen Bottom-Tabs und Nachkomma-Scrollpositionen.
- RUC-Speicheraudit ergänzt einen verlustfreien Delta-/Byteplane-Kandidaten mit vollständiger Byte-Rückprüfung. Keine produktive Codec-Aktivierung, Genauigkeitsreduktion oder Budgetänderung.

Details: docs/implementation/MID_C28_ADAPTIVE_CONTOURS_0.9.85.238.md. Echte iOS-/WKWebView-Abnahme bleibt offen.


# MID v0.9.85.237 · Karten merken sich die Auswahl, mehr ICON-D2-Stunden und Druckzentren

- Die gespeicherte Modellwahl bleibt auch erhalten, wenn ein Modell vorübergehend nicht im Katalog verfügbar ist. Radar-/Satelliten-Layer werden beim erneuten Öffnen wiederhergestellt; die gemeinsame Karte überschreibt keine alte Synoptik-Auswahl.
- Native ICON-D2-Karten erhalten echte Termine für jede Stunde von +1 bis +6. Zusätzliche Synoptik-Termine werden aus demselben Lauf geprüft und im Speicherbudget vor verzichtbarer späterer Dichte erhalten.
- Bodendruckkarten und Synoptik-Komposit zeigen modellgestützte Hoch-/Tiefzentren mit H/T und Druckwert. Markierungen werden nur aus passenden numerischen Druckdaten desselben Laufs und Termins erzeugt. ICON-D2-Exporte enthalten dieselben Zentren.
- Speichergrenzen, Prüfsummen, Mess-/Prognoseunterscheidung und fehlende Daten bleiben verbindlich. Tatsächlich verfügbare Termine richten sich nach Quelle und erfolgreicher RUC-Veröffentlichung.

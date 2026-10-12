# MID v0.9.85.240 · Orte vergleichen und Prognoseänderungen verstehen

- Neuer gemeinsamer Bereich „Orte & Prognose“ unter Aktuell: Mehrort-Übersicht, Ortsvergleich 2.0 und MID Prognose-Radar.
- Alle Favoriten im gleichen kommenden 6-/12-/24-Stunden-Fenster, Trockenfenster, Regenrisiko, Temperatur und Böen; Profile und 30-/100-km-Filter werden gespeichert. Fehlende oder veraltete Daten erhalten keinen Spitzenplatz.
- Mehrort-Übersicht priorisiert amtliche Warnungen, Datenlücken und relevante Wetterlagen. Ensemble-P25/P75-Spannen werden gezielt ergänzt und nur für vollständig abgedeckte Stunden ausgewiesen.
- Prognose-Radar nutzt den vorhandenen Drei-Tage-Modellvergleich: Bisher/Jetzt, Relevanzfilter, Datenkontext und bis zu sechs Prognosestände für denselben Gültigkeitstag. Derselbe Renderer wird im Ensemblebereich verwendet.
- Regenbeginn wird mit absoluten Zeitstempeln abgesichert; abgelaufene Ereignisse und neu ins rollende Fenster kommende Termine werden nicht als Prognoseänderung ausgegeben. Ursachen ohne archivierte Eingangsevidenz bleiben ausdrücklich unbestimmt.
- Daten laden erst beim Öffnen, mit begrenzter Parallelität und Abbruch bei Orts-/Ansichtswechsel. Keine zusätzlichen kostenpflichtigen Quellen.

# MID v0.9.85.239 · Beobachtungen merken und kompakte Wetterphasen

- Beobachtungen lassen sich gemeinsam aus-/einschalten; die gewählten Einzellayer bleiben gespeichert. Direkte Bedienaktionen speichern sofort, unveränderte alte Karteninstanzen überschreiben keine neuere Auswahl.
- Höhenkonturen: 8/4 gpdm. Druckkonturen: 5/2/1 hPa nach Zoom und numerischem Gradienten; neue 1-hPa-Geometrie wird aus dem Modellfeld erzeugt. Ältere unveränderliche Dateien behalten ihre vorhandenen Linien bis zum nächsten passenden Datenlauf.
- Feinere ICON-D2-Isobaren werden einmal im Bodendruckfeld gespeichert; andere native Karten und Exporte nutzen die exakt lauf-/terminpassende Druckgeometrie. T/H bleiben ausschließlich in reinen Bodendruckkarten.
- Der Wetterphasenbereich wird im aktiven Stylesheet kompakt dargestellt: drei kurze Zeilen auf Smartphones, drei Spalten auf größeren Bildschirmen. Werte, Ensemble-Spannen und Quellen bleiben unverändert.

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

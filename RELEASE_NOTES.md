# MID v0.9.85.254 · Veröffentlichte Modellkarten wieder vollständig erreichbar

- Ein Fehler im Kartenkatalog wurde behoben: Gültige zusätzliche ICON-D2-Wolken-/Wettertermine bei +13, +14, +16 und +17 Stunden führten bisher dazu, dass die App den gesamten Synoptik-Katalog ablehnte. Die bereits veröffentlichten Karten von ICON-D2, ICON-EU, ICON, GFS und IFS sind dadurch wieder auswählbar.
- Die Prüfung bleibt streng: Zusatzstunden gelten ausschließlich für ICON-D2. Lauf, Gültigkeitszeit, Modellhorizont, Größe, Datenformat und Prüfsummen müssen weiterhin stimmen. Fehlende Karten werden nicht geschätzt oder künstlich ergänzt.
- Automatische Kartenprüfungen verwenden auch beim vollständigen Revisionslauf die bestehenden vollständigen Teilgruppen. Alle 24 Größen-/Theme-/Designfälle bleiben erhalten; die Zeitgrenze pro Teilgruppe wird nicht erhöht.
- Neue Regressionen prüfen den tatsächlich veröffentlichten Katalog und zusätzliche Kartenstunden. Wetterberechnungen, Darstellung, Speicherbudget und das RUC-Datenformat bleiben unverändert.

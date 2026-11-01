# MID v0.9.85.401 – RUC-Datenherkunft und Datenlücken besser nachvollziehen

- **RUC-Beobachtungen transparent prüfen:** Ein ausschließlich lesender Archivbericht sammelt vorhandene GitHub-Originalbelege zu DWD-Verzeichnisständen und öffentlichen Pages-/Worker-Rückmeldungen. Fehlende oder übersprungene Messungen werden ausdrücklich als unbekannt ausgewiesen – niemals als Null.
- **Sicherere Prüfkette:** Ein ergänzender lesender Beobachtungsanlass kann ausgefallene GitHub-Zeitpläne teilweise abfedern. SHA-Abgleich, begrenzte Artefakte und ursprüngliche Zeitstempel schützen die Herkunft der Daten; die bestehende vollständige RUC-/EPS20-Vorhersage bleibt unverändert.
- **Performance fachlich vorbereitet:** Die alternative Berechnung der EPS20-Niederschlagsquantile wurde mit Original-Quellcode und identischen Binärdaten gegen die bisherige Methode geprüft. Sie ist noch **nicht für die produktive Berechnung aktiviert**; eine allgemeine RUC-Beschleunigung wird nicht behauptet.

**Nachweisgrenzen:** Die neue Auswertung ermittelt weder den exakten ersten DWD-GRIB-Veröffentlichungszeitpunkt noch eine bestätigte 60-Minuten-Endgeräte-Frische. Die unabhängige 0–6h-Fast-Lane bleibt deaktiviert. Amtliche DWD-Warnungen und die bestehenden Prognose-/NoData-Verträge bleiben unverändert.

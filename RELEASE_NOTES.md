# MID v0.9.85.251 · Zuverlässigere RUC-Veröffentlichungsprüfung

- MID prüft nach dem Hochladen neuer RUC-Wetterdaten etwas länger, ob der neue Modelllauf tatsächlich an der öffentlichen Adresse angekommen ist. Dadurch führen verzögerte Pages-Aktualisierungen seltener zu unnötigen Fehlalarmen.
- Die Überprüfung bleibt streng: Ein älterer oder ungültiger Modelllauf wird weiterhin nicht als erfolgreich bestätigt. Auch der Worker muss den richtigen Lauf und vollständige Daten melden.
- Zusätzliche automatisierte Tests simulieren sowohl eine verspätete Aktualisierung als auch dauerhaft veraltete oder ungültige Daten. Der Kontrolllauf dokumentiert jetzt die einzelnen Wiederholungsversuche verständlicher.
- Das Wettermodellangebot, die Berechnungen, das Datenspeicherbudget und die App-Oberfläche bleiben unverändert.

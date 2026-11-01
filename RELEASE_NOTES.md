# MID v0.9.85.394 – RUC-Downloads mit Wiederverwendung und begrenzter Parallelisierung

- MID verarbeitet zusätzliche optionale DWD-RUC-Modellfelder jetzt in zwei begrenzten Gruppen, statt sämtliche Felder nacheinander herunterzuladen. Die bisherige Obergrenze gleichzeitiger DWD-Downloads bleibt unverändert.
- Die RUC-Aufbereitung nutzt HTTP-Verbindungen pro Download-Thread erneut und schließt sie auch nach Fehlern zuverlässig. Fehlgeschlagene optionale Dateien werden vollständig aus dem Zwischenstand entfernt.
- Die Laufzeit von Download, optionalen Feldern und nativer Aufbereitung wird getrennt protokolliert, damit echte Leistungsverbesserungen überprüfbar werden. Die vollständige 27-Stunden-RUC-Prognose, 20 Ensemblemitglieder, NoData- und Messwertprüfung, amtliche Warnungen sowie bestehende Verbraucher bleiben unverändert.
- Eine eigene 0–6h-Fast-Lane und eine garantierte RUC-Aktualität innerhalb einer Stunde sind damit noch nicht freigegeben.

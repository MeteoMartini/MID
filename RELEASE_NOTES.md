# MID v0.9.85.253 · Sicherheitsprüfungen mit eindeutigem Datenstatus

- Die Prüfung der Produktionsabhängigkeiten unterscheidet jetzt ein geprüftes Ergebnis von einem unbekannten Zustand bei ausgefallenen Prüfdiensten. Ein unbekannter Zustand wird nicht mehr als „keine hohen Sicherheitsbefunde“ bezeichnet.
- Prüfzeit, geprüfter Paketstand und verwendete Quelle werden nachvollziehbar dokumentiert. Bei Dienstausfällen wird eine notwendige Nachprüfung ausgewiesen.
- Unvollständige oder ungültige Antworten gelten nicht als erfolgreiche Prüfung. Bestätigte hohe und kritische Befunde blockieren weiterhin die Freigabe.
- Wetterdaten, Modellkarten und Darstellung bleiben unverändert. Die bestehende Regel für reine externe Dienstausfälle und die unabhängigen Release-Prüfungen bleiben erhalten.

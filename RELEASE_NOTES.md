# MID v0.9.85.515

- **Reiseplaner (mitgeführter, bislang unveröffentlichter .514-Quellstand):** GEFS-24h-Originalintervalle und EC46-Wochenanomalien erhalten korrekte UTC-Gültigkeit und vollständige Belegschwellen. Missing Data werden nicht zu 0 und Wochenregen nicht zu Tageswahrscheinlichkeiten umgerechnet.
- **Karten (mitgeführter .514-Quellstand):** der lesende WMS-Audit prüft Original-Lauf-, Zeit- und Akkumulationsfenster sowie vollständige PNG-Transporte; ein gültiges PNG allein ist keine meteorologische Freigabe.
- **Berg- und Wintersport:** Sommer-, Winter- und Automatikansicht verwenden denselben gültigen Höhenwetter-Originaldatensatz, statt beim reinen Profilwechsel einen identischen Core-Abruf zu wiederholen. Später eintreffende Bergdiagnostik wird in die jeweils aktive Saisonansicht projiziert; vorhandene Schnee-, UTC-, NoData-, Höhen- und Quellenverträge bleiben erhalten.
- **Qualität:** unveränderte 60-Sekunden-Akzeptanz für die tatsächliche Bergwetter-Ansicht, zusätzliche Profil-/ARIA- und unnötige-Core-Request-Prüfung sowie begrenzte Browserdiagnose. Keine abgeschwächten Release- oder meteorologischen Gates.
- **Governance (mitgeführter .514-Quellstand):** dynamische Auswahl bestehender Plugins ohne neue autonome Agenten, Abonnements oder Release-Berechtigungen.
- **Status:** Source-Recovery-Kandidat aus dem Original-.514-Source-Merge mit nachweisbar fehlgeschlagenem Installer; Veröffentlichung erst nach regulärem Source-PR-Gate, Review, kontrolliertem Bot-ZIP, Installer, Worker/Pages und Stable-Promotion.

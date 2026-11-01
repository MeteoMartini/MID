# MID v0.9.85.406 – verlässlichere RUC-Datenfreigabe und Beobachtungsarchiv

- RUC-Datenaktualisierung robuster: Bereits verifizierte und unveränderte DWD-Daten können über reine Test- und Log-Audit-Updates hinweg sicher wiederverwendet werden, ohne die Originaldatenprüfung zu lockern.
- 7-Tage-Verfügbarkeitsarchiv vollständiger: Auch nach mehr als 6.400 GitHub-Artefakten findet MID die echten RUC-Originalbelege über exakt zugeordnete, SHA-geprüfte Workflow-Artefakte; ausbleibende Beobachtungen bleiben unbekannt statt Null.
- RUC-Pages und MID-App-Deployment behalten die gemeinsame Veröffentlichungssperre. Neue Negativtests überwachen Source-SHA, Rollback-Prüfung, unveränderliche Artefakte und Publish-Reihenfolge.
- Keine Änderung an Wetterwerten, amtlichen Warnungen, Modellgewichtung, +27h-RUC/20-EPS-Produkt oder fehlenden Daten. Eine separate 0–6h-Fast-Lane bleibt bis zur echten Abnahme deaktiviert.

**Messgrenzen:** Die vollständige 168-Stunden-DWD-Messung, eine aktivierte Fast-Lane, echter A/B-Produktiv-Speedup, globales CAS/Fencing sowie reale 60-Minuten-P95-Frische bis zu App, Widgets und Export sind mit diesem Release nicht belegt.

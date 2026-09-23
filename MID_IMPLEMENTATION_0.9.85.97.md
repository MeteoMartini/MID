# MID 0.9.85.97 · MID 18.2.10 · Replit-Audit-Fixes

## Anlass
Der Replit-Audit aus MID 18.2.9 ließ drei technische Restpunkte offen: dimensionslose Kernforecast-Caches, uneinheitliche Fokusführung von Overlays sowie UTC-gebundene Tages-/Lead-Zeitlogik.

## Umsetzung
- Forecast-Core-Cache im Frontend auf v4 und im Worker auf v3 angehoben. Koordinaten, gerundete Höhe und effektive Zeitzone sind Teil des Vertrags; alte dimensionslose Einträge werden nicht als frischer Kandidat migriert.
- Direkt- und Worker-Abruf verwenden dieselbe gewünschte Höhe und Zeitzone; auch der explizite Request-Cache-Key ist entsprechend dimensioniert.
- Forecast-Fusion-Cache auf v10 angehoben und nach Höhe getrennt.
- Tagesbezogene Niederschlags-/Lead-Time-Abstimmung verwendet reale lokale Stunden-Epochen. Die Folgenacht nutzt zivile gregorianische Datumsarithmetik ohne UTC-Date-Mutation.
- Gemeinsamer verschachtelbarer Fokusstack für Dialoge, Popover und Fullscreen-Sheets: Initialfokus, Tab/Shift-Tab-Fang, Escape nur für die oberste Ebene und Fokus-Rückgabe.
- Mehr-Drawer, Event-Center, Impressum und Einstellungen sind an denselben Fokusvertrag angeschlossen.

## Prüfung
Die neue Regression `scripts/test-mid-18-2-10-replit-audit-098597.mjs` schützt die drei Auditblöcke einschließlich CET/CEST-, Schaltjahr-, Jahresgrenzen- und IANA-Zeitzonenfällen. Die kanonische Vollprüfung erfolgt zusätzlich im MID Source-PR Gate und anschließend nochmals im Installer.

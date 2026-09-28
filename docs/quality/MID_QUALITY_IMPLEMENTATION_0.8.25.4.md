## MID v0.8.25.4 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.25.3**, da die vorhandene Gezeitendarstellung im Wasserwetter-Verlauf fachlich korrigiert und vervollständigt wurde.

### Wasserwetter-Verlauf

- Die Gezeitenzeile wird jetzt je angezeigtem Prognosetag aus dem **vollständigen Kalendertag von 00:00 bis 23:59 Uhr** gebildet.
- Hoch- und Tiefpunkte werden unabhängig vom dargestellten Wetterzeitfenster berücksichtigt, also auch:
  - vor Sonnenaufgang,
  - nach Sonnenuntergang,
  - vor der aktuellen Uhrzeit,
  - außerhalb des gewählten Aktivitätszeitraums.
- Ist die hochaufgelöste 15-Minuten-Wasserstandsreihe für einen Tag nur teilweise vorhanden, verwendet MID automatisch die vollständigere stündliche Reihe.
- Die allgemeine Gezeitenkachel oberhalb des Verlaufs zeigt weiterhin nur die kommenden Wendepunkte; die Tageszeile zeigt dagegen sämtliche Fälle des jeweiligen Kalendertags.

### Prüfung

- `node scripts/test-water-tide-matrix-081815.mjs`
- `node scripts/test-water-tides-full-calendar-day-08254.mjs`
- `node --check worker/metar-proxy.js`
- Versionssynchronisation auf **v0.8.25.4**

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker nur auf **v0.8.25.4** versionssynchronisiert

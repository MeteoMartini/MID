## MID v0.8.22.2 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.22.1**, weil die bestehende Radar-Nowcast-Ausgabe fachlich präzisiert und das Ereignisende korrigiert wurde.

### Fachliche Einordnung

Die bisherige Angabe „Radarecho erreicht den Standort voraussichtlich in 40–80 Minuten (19:50–20:30 Uhr)“ war kein sauber formulierter Niederschlagszeitraum. Sie vermischte den Beginn des ersten prognostizierten Standortintervalls mit dessen technischem Zeitfenster. Zusammen mit „voraussichtlich bis 19:50 Uhr“ entstand dadurch ein Widerspruch.

### Umsetzung

- Sichere Standortprognose: **„Niederschlag am Standort voraussichtlich von HH:MM bis HH:MM Uhr“**
- Nur Beginn bekannt: **„Niederschlag am Standort voraussichtlich ab HH:MM Uhr“**
- Unsicheres Umgebungsecho: **„Möglicher Standorttreffer zwischen HH:MM und HH:MM Uhr; noch unsicher“**
- Das Worker-Ereignisende wird auf das Ende des letzten nassen Radarintervalls gesetzt.

### Prüfung

- `node scripts/test-radar-period-wording-08222.mjs`
- `node scripts/test-short-term-modules-qr-sync-08220.mjs`
- `node scripts/test-short-term-rounding-wind-layout-08221.mjs`
- `node scripts/test-radar.mjs`
- `node scripts/test-versioning.mjs`
- `node --check worker/metar-proxy.js`

### Worker

- **Worker-Upload erforderlich: Ja**
- Grund: funktionale Korrektur der Radarereignis-Endzeit im Worker

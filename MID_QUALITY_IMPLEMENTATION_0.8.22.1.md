## MID v0.8.22.1 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.22.0**, da die Kurzfristvorhersage fachlich und visuell korrigiert wurde, ohne neue eigenständige Hauptfunktion einzuführen.

### Umgesetzte Punkte

1. **Kurzfristvorhersage – Zeitschritte gerundet**
   - Die nächsten Zeitpunkte rasten jetzt auf die **nächste volle Viertelstunde** ein.
   - Es werden **vier 15-Minuten-Schritte** angezeigt.
   - Danach folgen **volle Stunden** bis +24 h.

2. **Kurzfristvorhersage – Windpfeile fachlich korrigiert**
   - Die textliche Himmelsrichtung benennt weiterhin die Richtung, **aus der** der Wind kommt.
   - Die Pfeile zeigen nun konsistent in die Richtung, **in die** der Wind weht.

3. **Kurzfristvorhersage – keine Überdeckungen auf schmalen Karten**
   - Gewitter-Badges erhalten eine eigene Zeile.
   - Temperatur, Badge und Wettersymbol überdecken sich nicht mehr.

### Prüfung

- `node scripts/test-short-term-modules-qr-sync-08220.mjs`
- `node scripts/test-short-term-rounding-wind-layout-08221.mjs`
- `node scripts/test-responsiveness-071003.mjs`
- `node scripts/test-versioning.mjs`
- `node --check worker/metar-proxy.js`

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker lediglich auf **v0.8.22.1** versionssynchronisiert

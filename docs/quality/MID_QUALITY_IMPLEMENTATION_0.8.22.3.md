## MID v0.8.22.3 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.22.2**, da die Kurzfristvorhersage in Darstellung und Beschriftung korrigiert wurde, ohne neue Hauptlogik einzuführen.

### Umgesetzte Punkte

1. **Kurzfristvorhersage – Kartenkopf bereinigt**
   - Die oberste Zeile zeigt jetzt direkt die **Uhrzeit**.
   - Die relative `+xx min`-Angabe wurde aus der Kartenansicht entfernt.
   - Die relative Verschiebung bleibt weiterhin in der Detailansicht verfügbar.

2. **Kurzfristvorhersage – Winddarstellung erneut fachlich geprüft**
   - Die textliche Himmelsrichtung bleibt die Richtung, **aus der** der Wind kommt.
   - Die Kartenpfeile berücksichtigen nun zusätzlich die Grundausrichtung des Navigationssymbols und zeigen konsistent in die Richtung, **in die** der Wind weht.

3. **Kurzfristvorhersage – Headertext bereinigt**
   - Rechts oben steht nur noch **„Best Match“**.
   - Der informelle Zusatz **„ohne zusätzlichen Abruf“** wurde entfernt.

### Prüfung

- `node scripts/test-short-term-modules-qr-sync-08220.mjs`
- `node scripts/test-short-term-rounding-wind-layout-08221.mjs`
- `node scripts/test-short-term-card-labels-08223.mjs`
- `node scripts/test-responsiveness-071003.mjs`
- `node scripts/test-versioning.mjs`
- `node --check worker/metar-proxy.js`

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker nur auf **v0.8.22.3** versionssynchronisiert

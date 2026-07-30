## MID v0.8.24.0 umgesetzt

**Automatische Versionsbewertung:** Funktionsversion ab **v0.8.23.0**, da das Modul „Aktuelles Wetter“ eine neue, dauerhaft gespeicherte Interaktion erhält.

### Aktuelles Wetter

- Kompakte Schaltfläche direkt neben der Überschrift **„Aktuelles Wetter“** ergänzt.
- Die darunterliegenden Messwertkacheln lassen sich vollständig ein- und ausklappen.
- Die Beschriftung wechselt eindeutig zwischen **„Kacheln ausblenden“** und **„Kacheln einblenden“**.
- Der Zustand wird lokal gespeichert und nach einem erneuten Öffnen wiederhergestellt.
- Zugängliche Steuerung mit `aria-expanded` und `aria-controls`.
- Responsive Darstellung für Desktop, Tablet und Smartphone.

### Prüfung

- `node scripts/test-current-metrics-collapse-08240.mjs`
- `node scripts/test-current-layout-module-controls-071080.mjs`
- `node scripts/test-current-cards-favorites-navigation-08152.mjs`
- vollständige MID-Regressionssuite
- Worker-Syntaxprüfung

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker lediglich auf **v0.8.24.0** versionssynchronisiert

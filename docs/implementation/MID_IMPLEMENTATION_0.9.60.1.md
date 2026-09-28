# MID v0.9.60.1 – Build- und CodeQL-Hardening

- TypeScript-Buildfix: ungenutzten CrossSection-Parameter entfernt und Ensemble-Frischecallback explizit typisiert.
- OPERA-XML: Ampersand wird beim Unescaping zuletzt dekodiert, damit keine doppelte Entity-Dekodierung entsteht.
- WMS-Proxy: interne Upstream-/AggregateError-Texte werden nicht mehr an Clients gespiegelt; Antworten verwenden generische Fehlermeldungen.
- Kurzlebiger Analyse-Warmcache: keine persistente Klartextablage mehr in localStorage; nur noch flüchtiger In-Memory-Cache.
- Netzwerk-Mocktests: URL-Ziele werden über geparste URL, exakten Host/Origin und Pfad geprüft statt über Substring-Suche.
- Live-API-Vertragstest: schreibt keine Netzwerkdaten mehr in lokale Artifact-Dateien.
- PoP-Regression auf den gültigen daily-wet-derived/hourly-max-fallback-Vertrag synchronisiert.

# MID v0.9.54.1

## Audit-Nachtrag v0.9.53.57 auf Open-Meteo-Stand v0.9.54.0

Dieser Stand führt die Open-Meteo-Auditänderungen aus v0.9.54.0 unverändert fort und ergänzt die in v0.9.53.57 vorgesehenen Stable-/Build-Hardening-Maßnahmen.

### Übernommene Punkte aus v0.9.53.57

- React sowie Recharts/D3 werden über eine explizite, kontrollierte Vite-Vendor-Chunk-Funktion aus dem großen Hauptbundle getrennt.
- MapLibre bleibt außerhalb der manuellen Vendor-Aufteilung, damit die bestehende dynamische Lazy-Grenze erhalten bleibt.
- Der wöchentliche Dependency-Audit erzeugt zusätzlich einen vollständigen JSON-Auditbericht und sichert ihn auch bei einem Befund 30 Tage als GitHub-Artefakt.
- Das bestehende `npm run audit:all` bleibt danach als hartes Release-Gate aktiv.
- Nach erfolgreichem Pages-Deployment wird geprüft, dass `mid-stable` exakt auf den veröffentlichten Release-SHA zeigt. Nur dieser SHA erhält den Status `MID / stable-release-quality`.
- Der Recharts-Wartungsvertrag verlangt weiterhin einen exakt übereinstimmenden Package-/Lockfile-Stand innerhalb Recharts 3.x, ist aber nicht länger künstlich auf den historischen Literal 3.8.1 festgelegt.
- `scripts/test-stable-release-hardening-095357.mjs` schützt diese Verträge dauerhaft.
- Der ältere Buildstabilitätstest wurde mit dem neuen Auditvertrag abgeglichen: nur die explizite React-/Charts-Aufteilung ist zulässig; generisches Vendor-Chunking sowie erzwungenes MapLibre-Chunking bleiben verboten.

### Weiterhin enthalten aus v0.9.54.0

- ECMWF AIFS Europe Ensemble: Cloud-/Niederschlags-Plausibilitätsgate.
- Météo-France AROME/ARPEGE/Seamless inklusive relevanter Niederschlags-, Wind-, Bewölkungs- und Sonnenscheinverträge.
- JMA MSM/GSM/Seamless inklusive japanischem Best-Match-, Höhen- und Druckniveaupfad.
- EU-AQI Gesamt-/Teilindizes und stündliche PM-/AQI-Reihen mit Konzentrationsfallback.
- getrennte 6-h-Min/Max-Aggregationsverträge, Mondfelder und DWD-ICON-Begleitregressionen.

### Worker

Die Ergänzungen aus v0.9.53.57 ändern keine Worker-Funktion. Der Worker wird nur auf v0.9.54.1 versionssynchronisiert; sämtliche funktionalen Worker-Erweiterungen aus v0.9.54.0 bleiben erhalten.

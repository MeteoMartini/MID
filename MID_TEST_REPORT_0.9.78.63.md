# MID Test Report v0.9.78.63

Geprüft wurden die neue exklusive Sonne-/Wolkenklassifikation sowie die angrenzenden Skybar-Verträge.

- neue Regression `scripts/test-skybar-sun-cloud-exclusive-097863.mjs`
- bestehender Skybar-/Pillenvertrag `scripts/test-weather-profile-skybar-pills-097723.mjs` auf den neuen >50-%-Sonnenvertrag migriert
- TS6133-Schutz des Niederschlags-Overlay-Helfers bleibt unverändert
- vier bestehende Dickenstufen bleiben erhalten
- Tagesdetail, 24-h-Profil, 7-Tage-Kurve und Tageskarten verwenden weiterhin dieselbe Skybar-Engine
- fehlende Sonnenscheindauer bleibt von realen 0 s unterscheidbar
- 3-h-Aggregate verwenden die tatsächliche Intervalllänge statt einer künstlichen 1-h-Obergrenze

Worker-Fachlogik wurde nicht geändert.

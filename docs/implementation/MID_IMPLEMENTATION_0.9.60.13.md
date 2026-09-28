# MID v0.9.60.13 – CI-/Aggregate-Konsolidierung nach Zeitpfeil-Geometrievertrag

- Alle noch auf `geometry.trackMid` zielenden Regressionen wurden auf den gültigen v0.9.60.12+-Vertrag migriert: Das zusammenhängende Zeitpfeil-SVG ist direkt am ausgewählten `site` verankert, damit seine Pfeilspitze exakt auf Standort/Favoritenort endet.
- Die kanonische Worker-Teilquelle wurde auf v0.9.60.13 synchronisiert, sodass `maintain:aggregates` den Worker nicht mehr auf einen älteren Stand zurücksetzt.
- Neue Pflichtregression `test-aggregate-version-contract-09613.mjs` schützt package-, Baseline-, Worker-Fragment- und generierte Worker-Version vor erneuter Divergenz.
- Keine fachliche Änderung an Schwerpunktströmung, Layerpersistenz oder der Zeitpfeilgeometrie.

# MID v0.9.85.116 · deutlichere Nachtstunden im Dark-Design

## Ausgangsbasis

Verifizierte Source-of-Truth-Basis ist `mid-stable = main = 218e6d40960c78672dd975159f9eb49973f65ddc` (v0.9.85.115).

## Änderung

Die bestehende gemeinsame Nachtgeometrie bleibt unverändert. Sonnenuntergang und Sonnenaufgang, stündliche Skybar-Fachlogik, Wetterfarben und meteorologische Daten werden nicht verändert.

Für das obligatorische MID-Next-Design gilt nun eine gemeinsame Theme-Variable für die Nachtflächen:

- Light-Design: Deckkraft weiterhin **0,20**.
- Dark-Design: Deckkraft **0,32**.
- Die Übergänge an Sonnenuntergang und Sonnenaufgang bleiben weich.
- Betroffen sind die zusammengehörigen Nachtflächen des 12-h-Temperaturtrends mit Skybar, der Kurzfrist-/Now90-Skybar und des 24-h-Wetterprofils.
- Es werden keine zusätzlichen Labels, Icons oder Flächen eingeführt.

Damit bleibt Light visuell stabil, während Nachtstunden im Dark-Design schneller erkennbar sind, ohne Temperaturkurve oder Wetterstreifen zu überdecken.

## Responsive Vertrag

Die bestehende Zielmatrix bleibt verbindlich: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900. Die Änderung ist Theme-basiert und erzeugt keine neue Geometrie oder Dokumentbreite.

Required Regression: `scripts/test-mid-18-2-24-dark-night-band-0985116.mjs`.

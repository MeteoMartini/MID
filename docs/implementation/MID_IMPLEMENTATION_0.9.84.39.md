# MID v0.9.84.39 – Implementierungsnotiz

## Ausgangspunkt
GitHub Release #992 für v0.9.84.38 bestand ZIP-Installation, npm ci, TypeScript 7 und den Vite-Produktionsbuild. Der Lauf stoppte erst bei 4 von 739 Regressionen.

## Korrektur
- Kohärentes Wetterbündel bleibt im Produktionscode ausdrücklich dokumentiert und funktional erhalten.
- MOSMIX-Regression schützt die seit v0.9.84.38 kontinuierliche Lead-Time-Gewichtung statt der alten harten +6-h-Stufe.
- 24-h-Profil-Regression schützt die gemeinsame kanonische Stundenbasis für Temperaturkurve und Druckskala.
- Keine Rücknahme der meteorologischen Kontinuitätsverbesserungen aus v0.9.84.38.

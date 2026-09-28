# MID-C9 Smartphone-Gate · v0.9.85.48

## Umfang

Die in Replit auf 360 × 800 und 430 × 932 Pixeln in Light und Dark abgenommene grafische Korrektur wurde auf den kanonischen MID-Quellstand übertragen. Vorschau-Datensätze und Demo-Integrationen wurden ausdrücklich nicht übernommen.

## Umsetzung

- einspaltige äußere Standort-/Nowcast-Komposition auf Smartphones;
- stabiler zweispaltiger Ortskopf ab 371 px, vollständige einspaltige Fassung darunter;
- horizontale Ortsnamen ohne erzwungenen Buchstabenumbruch;
- vollständig erreichbare Favoriten mit dauerhaft sichtbarem Verwaltungszugang;
- echte Reservierung für Bottom-Bar und Safe Area;
- Taupunkt als Primärwert, relative Feuchte als Sekundärtext;
- ausschließlich bestehende Light-/Dark-Designtokens und kanonische MID-Datenreihen.

## Abnahmevertrag

Der Regressionstest `scripts/test-mid-c9-smartphone-gate-098548.mjs` schützt die Responsive-Regeln, die Datenisolation, die Lade-Reihenfolge des finalen Design-Overrides sowie die Versions-/Baseline-Kopplung.

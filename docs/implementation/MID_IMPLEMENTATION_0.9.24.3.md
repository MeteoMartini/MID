# MID v0.9.24.3

## Wolken + Niederschlagsart: Projektionsraster und Quellzeitstände

- Die Standortbestimmung verwendet nicht mehr gerade Rasterlinien bzw. eine ortsbezogene Kalibrierung, sondern **gekrümmte DWD-Gradnetzkurven** für 6/8/10/12° E und 49/50/51/52° N.
- Vorwärts- und Rücktransformation nutzen dieselben projizierten Rasterkurven; Ortsnamen und DWD-Stadtmarker bleiben ausdrücklich von der Georeferenzierung ausgeschlossen.
- Die Regression prüft die Transformation **deutschlandweit** an mehreren, nicht als Kalibrieranker verwendeten Orten.
- Radar- und Satellitenzeit werden als **UTC-Quellzeitstände** aus den offiziellen DWD-OpenData-Eingangsprodukten bestimmt:
  - Radar: HG Deutschlandkomposit Niederschlagsart in 2 m
  - Satellit: NWCSAF TS / Wolkenprodukt
- Die Quellzeit wird auf den Veröffentlichungsstand des jeweiligen DWD-Kombinationsbildes begrenzt, damit keine später veröffentlichten Rohdaten fälschlich angezeigt werden.
- Die Metadatenabfrage wurde beschleunigt und robuster gemacht (Index-Cache, unabhängige Quellabfragen, kein unnötiges PNG-Decoding).
- Anzeige kompakt als **Radar HH:MM UTC** und **Sat HH:MM UTC**.

# MID v0.9.79.11 – Wetterregime fachlich und farblich appweit gekoppelt

- Neue kanonische Regimeklassifikation `src/forecastRegime.ts`.
- 7-Tage- und 14-Tage-Cockpit verwenden dieselbe `forecastDayRegime(...)`-Logik.
- Die kompakte 7-Tage-Kurzform behält ihre kurzen Texte, leitet die Regimeklasse aber ebenfalls zentral ab.
- Die klassische 7-Tage-Ansicht übernimmt die passende Regime-Akzentfarbe für die sichtbare Wetterpille.
- Historische Phase-Line, Mini-Ribbons und Legende verwenden die zentralen Wetterregime-Farbvariablen; lokale Regime-Hexwerte wurden aus diesen Pfaden entfernt.
- Neue Regression `test-weather-regime-shared-contract-097911.mjs` schützt Fachlogik, klassische 7d-Pille und Farbableitung.

# MID v0.9.60.8 – Standort-/Favoritenmarker-Vertrag

- Aktueller Gerätestandort: Standortmarker mit optionaler Blickrichtung/Kompasspfeil.
- Favoriten/manuell gewählte Orte: ausschließlich neutrale Ortsmarkierung ohne Richtungsinformation.
- Der meteorologische Komposit-Zeitpfeil bleibt separat und darf weiterhin am gewählten Ort enden.
- `useDeviceHeading` wird weiterhin nur für `actualLocation` aktiviert.
- Pflichtregression: `test-location-heading-favorites-09608.mjs`.

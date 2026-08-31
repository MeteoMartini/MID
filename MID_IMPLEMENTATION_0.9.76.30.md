# MID v0.9.76.30 – Regression-Gate für das 24-h-Nachtprofil

## Anlass
GitHub-Installerlauf #802 scheiterte trotz erfolgreichem TypeScript- und Vite-Produktionsbuild an zwei historischen visuellen Regressionstests. Beide Tests erwarteten noch die frühere harte bzw. schraffierte Nachtmarkierung des 24-h-Wetterprofils.

## Korrektur
- `test-weather-profile-mobile-compact-097612.mjs` schützt nun den aktuellen Vertrag: dezente Nacht-Hintergrundfläche, nicht interaktiv, mit weichem Fade an Sonnenuntergang und Sonnenaufgang.
- `test-weather-profile-modern-dayview-097610.mjs` prüft nun die aktuelle `nightBands`-/Gradienten-Implementierung und die einzige 24/00-Uhr-Tagesgrenze statt der entfernten historischen `chartPoints.reduce`-/Pattern-Struktur.
- Die in v0.9.76.28 eingeführte Darstellung bleibt unverändert: keine Rückkehr zur Schraffur und keine zweite hervorgehobene Tagesgrenze.

## Release-Vertrag
Dies ist ein Regressionstest-/Release-Hotfix. Die meteorologische Fachlogik und die sichtbare 24-h-Darstellung werden nicht zurückgerollt.

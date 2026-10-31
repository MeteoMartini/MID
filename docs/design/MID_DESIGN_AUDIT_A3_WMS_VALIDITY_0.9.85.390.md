# Designaudit A3 v0.9.85.390 – Modellkarten: WMS-Produkt-/Modelllauf-/Gültigkeit-/Höhenniveau-Parität

## Quelle und Fehlerbild
Stable v0.9.85.389 `6e449be3baf13e9c33ec206864189dd4b580d482`. Das Legacy-`WeatherMapsPanel` prüft vor WMS-Rendering mit `weatherMapFrameReady(product,metadata,time,reference,level)`, ob der konkrete Layer bestätigt ist und der Termin zum Modelllauf sowie zur gewählten Höhenfläche passt. Das Unified-`UnifiedWeatherMap` prüfte bisher nur den nichtleeren Lauf, nächstgelegenen Terminslot, Produktlayer und Proxy-URL. Insbesondere Metadatenfehler oder ungültige Druck-/Höhenniveaus konnten deshalb zu unbestätigten WMS-Abfragen führen.

## Maßnahme
Der bestehende `weatherMapFrameReady`-Vertrag wird im zentralen Unified-Render-Gate wiederverwendet. Dieser verlangt gelistete Referenzzeit und ValidTime, die verfügbaren Niveaus und die korrekte Akkumulations-Mindestlaufzeit und unterscheidet fehlende Karten von bestätigten Werten. Eine ungültige Zeit wird niemals auf einen vermeintlich passenden Wert interpoliert. Keine Änderungen an amtlichen Warnungen, Radar, RUC oder Darstellung bestätigter Felder.

## QA und Restpunkte
Die bereits obligatorische Regression `scripts/test-unified-map-layers-0985167.mjs` prüft direkt transpilierten Validator und die Unified-Verkabelung. Adversarielle Fälle: falscher Layer, Katalogfehler, nicht gelisteter Lauf, fehlende ValidTime, fehlende Niveauverfügbarkeit, unzulässige 6h-Akkumulation und gültiger Positivfall. Die 1059 Pflichtregressionen und die bisherige 24-Fälle-Browsermatrix bleiben vollständig erhalten. Reale Geräte/VoiceOver/Touch-/Viewport- und Exportparität im Master-Issue #523 weiter offen.

## Release
Nicht aus Source-Tests veröffentlichen: erst vollständiger MID-Gate-Pfad und bestätigter Stable-SHA.

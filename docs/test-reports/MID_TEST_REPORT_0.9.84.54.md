# MID Test Report 0.9.84.54

Grün:
- test-current-weather-intensity-design-098451.mjs
- test-current-cloud-widget-export-098454.mjs
- test-widget-svg-export-paints-098441.mjs
- test-widget-curve-overview-09845.mjs
- test-widget-wind-temperature-export-098419.mjs
- test-appwide-precipitation-and-daily-heat.mjs
- node --check worker.js

Nicht lokal vollständig ausführbar:
- Hyperlokale Laufzeit-Harnesses, die `typescript-strada` aus node_modules benötigen; das Professional-ZIP enthält absichtlich kein node_modules. Der GitHub-Installer installiert die reproduzierbaren Abhängigkeiten vor der vollständigen Regression.

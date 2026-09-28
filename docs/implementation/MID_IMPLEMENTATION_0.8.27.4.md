## MID v0.8.27.4

### Build-Stabilisierung
- Vite wird über einen expliziten Node-Prozess mit `--max-old-space-size=4096` gestartet.
- React, Recharts, Leaflet, Export- und HDF5-Abhängigkeiten werden in deterministische Vendor-Chunks getrennt.
- JavaScript und CSS verwenden ausdrücklich den schnellen esbuild-Minifier.
- Der in v0.8.27.3 neu ergänzte dynamische `:has()`-Selektor wurde durch eine statische Ebenenreihenfolge ersetzt.

### Funktionsstand
Die Tooltip-, Bewölkungskästchen- und Niederschlags-/Gewittersymbol-Fixes aus v0.8.27.3 bleiben unverändert enthalten.

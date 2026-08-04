# MID v0.9.14.2 – Piktogramm-Feinschärfung Tag/Nacht und Wolkenstockwerke

## Umgesetzt

1. **Tag-/Nacht-Hintergründe**
   - Alle Wetterpiktogramme erhalten eine dezente semitransparente Hintergrundfläche.
   - Tagsüber heller, nachts dunkler, damit die Unterscheidung auch in kleinen Icons und auf wechselnden Kartenfarben stabil sichtbar bleibt.

2. **Feinschärfung der Wolkenformen**
   - **Hohe Bewölkung** stärker als federige/geschichtete Struktur gezeichnet.
   - **Mehrschichtige Bewölkung** klarer als Kombination aus hohen und mittleren Wolken.
   - **Konvektive Bewölkung** durch steilere, quellendere Form besser von Schichtbewölkung getrennt.

3. **Nachtpiktogramme**
   - Stilistisch appweit einheitlich weitergeführt.
   - Durch dunkleren Plate-Hintergrund und angepasste Mondplatzierung besser lesbar.

## Betroffene Datei
- `src/WeatherPictogram.tsx`

## Release
- Versionsfortschreibung auf `0.9.14.2` inkl. Metadaten und Baseline-Dateien.

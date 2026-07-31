## MID v0.8.26.8 umgesetzt

**Versionsbewertung:** Wartungsrelease ab v0.8.26.7. Die bestehende Ensemble-Funktion wurde unter Recharts 3 sichtbar und layoutstabil repariert; es wurde keine Funktion entfernt oder eingeschränkt.

### Änderungen

1. **Sonne-/Wolken-Kästchen je Vorhersagetag**
   - Eigene Recharts-3-Koordinatenebene mit `useCartesianScale`.
   - Darstellung über `ZIndexLayer`, damit Kästchen nicht mehr hinter Flächen oder Linien verschwinden.
   - Sonne, Wolke oder Mischsymbol werden je Tagescharakter kompakt im Kästchen dargestellt.

2. **Niederschlagssymbolik**
   - Regen, Schnee, Mischform und Gewitter werden innerhalb des jeweiligen Tageskästchens dargestellt.
   - Skalierung passt sich der verfügbaren Tagesbreite an.

3. **Hazardmarker**
   - Warnmarker werden auf derselben hoch priorisierten Ebene oberhalb der Tageskästchen gerendert.
   - Vollständige Warninformation bleibt als SVG-Titel erhalten.

4. **Temperatur-Tooltip**
   - Matrixwerte, Zeilenbezeichnungen und Metadaten bleiben einzeilig.
   - Lange Texte werden kompakt gekürzt und nicht mehr unkontrolliert umgebrochen.
   - Vollständige Niederschlags- und Hazardtexte bleiben über Titelinformationen verfügbar.

5. **Gemeinsame Tagesgeometrie**
   - Tagesdomäne, Tickfolge, Achsenreserven und Exportbreiten der drei Ensemble-Diagramme bleiben unverändert synchron.

### Prüfungen

- `scripts/test-ensemble-legacy-functionality-alignment-08267.mjs`
- `scripts/test-ensemble-weather-overlay-tooltip-08268.mjs`
- vollständige MID-Regressionssuite: 191 von 191 Tests bestanden
- 67 TypeScript-/TSX-Dateien parsergeprüft
- 197 JavaScript-/MJS-Dateien syntaktisch geprüft
- Worker-Syntaxprüfung bestanden

### Worker

- Keine funktionale Worker-Änderung.
- Worker nur auf v0.8.26.8 versionssynchronisiert.

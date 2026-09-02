# MID v0.9.77.16 – 24-h-Lesbarkeit und scrollfreie Langfristdiagramme

## Anlass

Der iPhone-Screenshot im Hellmodus zeigt drei konkrete UI-Probleme: Die ausgewählten Wert-Pills im 24-h-Wetterprofil fallen wegen einer ungültigen SVG-Hintergrundvariable auf Schwarz zurück und sind dadurch nur schlecht lesbar; die Tmin/Tmax-Marker dominieren die Temperaturkurve; außerdem wiederholt der Witterungstrend den Modellstand zusätzlich zu den vorhandenen Modell-Pills. Die Langfristdiagramme erzwingen auf schmalen Viewports feste Mindestbreiten und damit horizontales Scrollen.

## Umsetzung

### 24-h-Wetterprofil

- Die SVG-Wert-Pills verwenden jetzt `--mg-tooltip` und `--mg-tooltip-border`, die in Hell- und Dunkeldesign explizit definiert sind.
- Damit ist der Hintergrund im Hellmodus hell und im Dunkelmodus dunkel; die Parameterfarbe des Textes bleibt erhalten.
- Die nicht definierte `--mg-bg`-Referenz im Windpfeil-Halo wurde im selben Profil auf den vorhandenen Plot-Hintergrund `--mg-plot` umgestellt.
- Tmin/Tmax-Kreismarker wurden von Radius `6.2` auf `3.4` reduziert.
- Der aktive Temperatur-Fokuspunkt wurde von Radius `4.5` auf `3.0` reduziert, damit er einen gleichzeitigen Extremwert nicht optisch zu einem großen schwarzen Punkt aufbläht.

### Witterungstrend

- Die zusätzliche Header-Zeile `Modellstand:` wurde entfernt.
- Der tatsächliche Modelllauf bleibt unverändert in den Familien-/Modell-Pills als `Lauf … UTC` sichtbar.
- `Datenabruf … UTC` und der Cache-/Fallback-Status bleiben im Header erhalten.
- Die dadurch ungenutzte Funktion `modelRunSummary()` wurde entfernt.

### Langfristdiagramme

- Saisonale Temperatur-/Niederschlags-Rauchfahnen skalieren jetzt vollständig in die verfügbare Containerbreite (`width:100%`, `max-width:100%`, `min-width:0`).
- Die Diagrammcontainer erzwingen keinen horizontalen Scroll mehr (`overflow-x:hidden`).
- Frühere mobile Mindestbreiten von 520/500/470 px wurden entfernt.
- Auch das Langfrist-Schneelinien-Diagramm verwendet denselben responsiven Vertrag; frühere 560/520-px-Mindestbreiten entfallen.
- Horizontales Scrollen bleibt nur dort erhalten, wo es ein bewusstes Bedienelement ist, insbesondere im Modellselektor – nicht bei den Diagrammen selbst.

## Responsive Vertrag

Die Änderungen gelten einheitlich für Desktop sowie mobile Hoch-/Querformate. Auf schmalen iPhone-Viewports wird die gesamte Zeitachse in die verfügbare Breite skaliert, statt Teile des Diagramms außerhalb des sichtbaren Bereichs zu platzieren.

## Regression

Neue Regression: `scripts/test-weather-profile-longrange-ui-097716.mjs`.

Sie schützt:

- theme-adaptive 24-h-Wert-Pills ohne undefinierte SVG-Hintergrundvariablen,
- reduzierte Tmin/Tmax- und Fokusmarker,
- fehlenden redundanten Modellstand im Witterungstrend bei weiterhin sichtbaren Modellläufen in den Pills,
- scrollfreie, vollständig responsive Langfrist- und Schneelinien-Diagramme,
- Synchronität des Styles-Aggregats.

## Architektur / Worker

Es wurden ausschließlich React-/CSS-UI- und Metadaten-Darstellungsregeln geändert. Wetterdaten, Modellfusion, Worker-Requests und meteorologische Worker-Fachlogik bleiben unverändert.

**Manueller Worker-Upload erforderlich: nein.**

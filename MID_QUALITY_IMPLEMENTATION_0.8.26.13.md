## MID v0.8.26.13 umgesetzt

**Automatische Versionsbewertung:** Wartungsrelease ab **v0.8.26.12**, da die bestehende Ensemble-Darstellung im Hochformat auf den geschützten optischen Stand von v0.8.25.4 zurückgeführt wurde, ohne neue Hauptfunktion einzuführen.

### Umgesetzte Punkte

1. **Temperatur-Tooltip wie v0.8.25.4**
   - Aufbau und Inhalte entsprechen wieder dem kompakten Referenzstand.
   - Desktopbreite maximal 336 px, mobile Breite maximal 286 px, sehr schmale Displays maximal 272 px.
   - Temperaturmatrix, Sonne, Niederschlag, Modelle und Hazards bleiben vollständig und lesbar.
   - Der Tooltip wird nicht mehr nahezu bildschirmbreit dargestellt.

2. **Sonne-/Wolkenfelder wieder am unteren Plotrand**
   - Wetterfelder werden aus der tatsächlichen Diagrammgröße, den Achsenbreiten und der gemeinsamen Tagesdomäne berechnet.
   - Position exakt im unteren 6,5-%-Bereich der Plotfläche, nicht mehr auf Höhe der Temperaturkurven.
   - Niederschlagssymbolik bleibt tagesgenau innerhalb der jeweiligen Felder sichtbar.

3. **Hazardmarker**
   - Marker werden tagesgenau bei 11 % oberhalb des unteren Plotrands positioniert.
   - Sie liegen oberhalb der Temperaturkurven und bleiben sichtbar.

4. **Gemeinsame Tagesausrichtung**
   - Temperatur, Niederschlag sowie Wind/Böen verwenden dieselbe Tagesdomäne, identische linke und rechte Achsenreserven und dieselben X-Achsenhöhen.
   - Derselbe Vorhersagetag liegt in allen drei Diagrammen vertikal übereinander.

5. **Scroll-Performance**
   - Wetterebene ist eine leichte, nicht interaktive SVG-Ebene.
   - Recharts-Animationen bleiben deaktiviert.
   - ResizeObserver aktualisiert nur bei tatsächlicher Größenänderung; vertikales Touch-Scrollen bleibt priorisiert.

### Prüfung

- 196 von 196 automatisch erkannten Regressionstests bestanden
- 202 JavaScript-/MJS-Dateien syntaktisch geprüft
- 68 TypeScript-/TSX-Dateien parsergeprüft
- Worker syntaktisch geprüft
- Versionsstände in Paket, Lockfile, Baseline, Frontend, Service Workern und Worker synchronisiert

Der vollständige lokale TypeScript-/Vite-Build konnte in der isolierten Umgebung nicht abgeschlossen werden, weil die Projektabhängigkeiten dort nicht installiert sind. Der GitHub-Installationslauf führt den vollständigen Produktionsbuild mit den installierten Abhängigkeiten aus.

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker ausschließlich auf **v0.8.26.13** versionssynchronisiert

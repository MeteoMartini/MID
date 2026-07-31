## MID v0.8.26.13 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.12**, da die vorhandenen Ensemble-Diagramme optisch und responsiv auf den bewährten Stand von v0.8.25.4 zurückgeführt wurden, ohne neue Hauptfunktion einzuführen.

### Umgesetzte Punkte

1. **Temperatur-Ensemble – Wetterband im Hochformat korrigiert**
   - Sonne-/Wolken-Kästchen liegen wieder am unteren Rand der eigentlichen Plotfläche.
   - Die Position wird aus der realen Diagrammgeometrie berechnet und nicht mehr aus der Temperaturskala abgeleitet.
   - Niederschlags- und Gewittersymbole bleiben innerhalb der zugehörigen Tageskästchen.
   - Hazardmarker liegen oberhalb des Wetterbands und verdecken weder Temperaturkurven noch Tooltips.

2. **Temperatur-Tooltip auf v0.8.25.4 zurückgeführt**
   - Größe, Tabellenaufbau und Informationsumfang entsprechen wieder der bewährten kompakten Darstellung.
   - Mobile Maximalbreiten verhindern ein Abschneiden am rechten Rand.
   - Werte, Bezeichnungen und Metadaten bleiben einzeilig; ein unkontrollierter Umbruch wird verhindert.

3. **Gemeinsame Tagesausrichtung geschützt**
   - Temperatur-, Niederschlags- und Winddiagramm behalten dieselbe Tagesdomäne, Tickfolge sowie linke und rechte Achsenreserve.
   - Derselbe Vorhersagetag bleibt vertikal in allen drei Diagrammen ausgerichtet.

### Prüfung

- 196 automatisch erkannte MID-Regressionstests bestanden
- 67 TypeScript-/TSX-Dateien parsergeprüft
- alle JavaScript-/MJS-Dateien syntaktisch geprüft
- Worker syntaktisch geprüft
- Versionsstände in Paket, Lockfile, Baseline, Frontend, beiden Service Workern und Worker synchronisiert

### Buildhinweis

Der vollständige lokale TypeScript-/Vite-Build konnte in der isolierten Umgebung nicht abgeschlossen werden, weil keine Projektabhängigkeiten installiert sind. Der Buildversuch scheiterte ausschließlich an fehlenden Modulen wie React, Lucide und Vite; die geänderten Dateien sind parser-, syntax- und regressionsgeprüft. Der vollständige Produktionsbuild erfolgt im GitHub-Installationslauf.

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker nur auf **v0.8.26.13** versionssynchronisiert

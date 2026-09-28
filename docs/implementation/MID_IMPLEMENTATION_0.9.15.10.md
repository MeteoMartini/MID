# MID v0.9.15.10 – K3D-Kartenbindung und Geometrieplausibilität

## Ausgangsbasis

- MID v0.9.15.9
- maßgebliche Arbeitsbasis: `mid-stable`
- Änderungsebene: Wartungsrelease

## Fehlerbild

KONRAD3D-Markierungen lagen am aktuellen Zellzentrum, während Prognosespuren, Zeitmarken und Unsicherheitsgeometrien teilweise erst nach dem Verschieben der Karte weit entfernt erschienen. Dadurch entstanden grafische K3D-Elemente ohne sichtbare aktuelle Zelle beziehungsweise ohne räumlich passenden Radarecho-Kontext.

## Ursachen

1. Sämtliche vom Worker für den Bezugsort gelieferten `nearbyCells` wurden unabhängig vom sichtbaren Kartenausschnitt gezeichnet. Eine Zelle konnte deshalb außerhalb der Karte liegen, während ihre lange Prognosespur innerhalb der Karte sichtbar wurde.
2. K3D war nicht an den aktuell gewählten Radarzeitstand gebunden.
3. Explizite Prognosekoordinaten wurden nicht gegen Vorlauf und Zellgeschwindigkeit plausibilisiert.
4. Der DWD verwendet in KONRAD3D-Längenfeldern auch das XML-Attribut `unit`. Der Worker wertete bislang ausschließlich `units` aus. Kleine Meterwerte konnten dadurch im Fallback als Kilometer interpretiert werden.
5. Bis zu acht Zellen erhielten gleichzeitig vollständige Zugbahnen, Ellipsen und zahlreiche permanente Zeitbeschriftungen.

## Umsetzung

### Sichtfensterbindung

`KonradNowcastObjects` reagiert nun auf `moveend`, `zoomend` und `resize`. Marker und Vektorgeometrien werden nur für Zellen verarbeitet, deren aktuelles Zellzentrum innerhalb des leicht gepufferten sichtbaren Kartenausschnitts liegt.

### Zeitbindung

K3D-Zellen werden nur eingeblendet, wenn der ausgewählte Radarzeitpunkt höchstens zehn Minuten vom KONRAD3D-Produktstand entfernt liegt. Historische oder zukünftige Radarframes erhalten dadurch keine zeitlich fremden Zellobjekte.

### Relevanzbegrenzung

- höchstens sechs sichtbare aktuelle Zellmarker/-flächen
- vollständige Zugbahn und Unsicherheitsgeometrie nur für die zwei relevantesten sichtbaren Zellen
- Relevanz aus Schweregrad, Reflektivität, Blitzaktivität, Starkregen, Hagel und Zellfläche

### Geometrieplausibilität

Amtliche Prognosepunkte werden gegen eine aus Zellgeschwindigkeit und Vorlauf abgeleitete maximale Verschiebung geprüft. Stark versetzte Koordinaten werden verworfen. Falls danach keine belastbaren Punkte verbleiben, darf weiterhin eine transparent gekennzeichnete Spur aus dem Zugvektor entstehen.

Unsicherheitsradien werden vor der Darstellung zeitabhängig begrenzt. Dauerhafte Zeitlabels erscheinen nur noch bei +30 Minuten, +60 Minuten beziehungsweise am letzten verfügbaren Punkt; alle Zwischenpunkte bleiben per Tooltip erreichbar.

### DWD-Einheiten

Der Worker verarbeitet nun sowohl `unit="m|km"` als auch `units="m|km"`. Dadurch werden die Achsen der Unsicherheitsellipse korrekt in Kilometer normiert.

## Regression

- neuer Test `test-k3d-viewport-plausibility-091510.mjs`
- alle 290 automatisch erkannten MID-Regressionstests bestanden
- Worker-Syntaxprüfung bestanden
- gezielte TypeScript-Prüfung von `RadarPanel.tsx`: keine neuen lokalen Typfehler; der Gesamtbuild kann ohne installierte React-/Leaflet-Abhängigkeiten in der isolierten Umgebung nicht abgeschlossen werden

## Deployment

- Frontend-Upload erforderlich: ja
- Worker-Upload erforderlich: ja
- zusätzliche Cloudflare-Variablen, Secrets, Bindings oder Routen: nein

# MID v0.9.15.6 – Desktop-Ensemble und Kompositbild

## Ausgangsbasis

Verifizierter lokaler Release-Stand v0.9.15.5. Patch-Release, da drei bestehende Darstellungen funktional korrigiert werden.

## 1. Desktop-Ensemble

Die Recharts-eigene Tooltip-Aktivierung bleibt für Touch/Coarse Pointer erhalten. Für Desktopgeräte mit `hover: hover` und `pointer: fine` liegt über jedem der drei Diagramme eine eigene Interaktionsschicht. Sie berechnet den nächstgelegenen Tages-Tick aus den realen SVG-Tickpositionen, zeigt eine Führungslinie und rendert den Tooltip per `createPortal` außerhalb aller Clipping-Container. Klick fixiert den Wert, erneuter Klick, Außenklick oder Escape schließt ihn; Pfeiltasten/Home/Ende navigieren barrierearm.

## 2. 250-m-Radar

Für deutsche Standorte wird zuerst das nationale DWD-HX-HDF5-Komposit angefordert. Einzelne PX250-Standortradare dienen nur als Fallback. Das Frontend dekodiert DBZH und rechnet die Reflektivität mit `Z = 200 · R^1,6` in eine äquivalente Regenrate um. 1-km- und 250-m-Ansicht verwenden dadurch dieselben mm/h-Schwellen und sind visuell vergleichbar, ohne HX als geeichte Niederschlagsmessung auszugeben.

## 3. KONRAD3D

Der Worker verarbeitet das amtliche Schema `forecast > centroid_forecasts > centroid_forecast` einschließlich `forecast_time`, `geodetic_coordinate` und `uncertainty_ellipse` mit `major_axis`, `minor_axis` und `angle`. Der bisherige dynamische RegExp enthielt nicht doppelt escapte Regex-Sequenzen; außerdem konnte das generische Elternelement `forecast` den ersten Prognosepunkt verschlucken. Beide Fehler sind beseitigt.

Das Frontend zeichnet:

- aktuelle Zellfläche,
- sämtliche amtlichen 5-Minuten-Prognosepunkte,
- gestrichelte Zugbahn mit weißem Kontrasthalo,
- Unsicherheitsellipsen und zusammenhängenden 1σ-Korridor,
- Tooltip je Prognosepunkt.

Fehlen amtliche Einzelpunkte, erzeugt MID nur bei vorhandener Zugrichtung und Geschwindigkeit eine klar als abgeleitet bezeichnete 5-Minuten-Spur bis +60 Minuten.

## Regression

- `scripts/test-ensemble-desktop-composite-k3d-09156.mjs`
- funktionaler VM-Test des amtlichen KONRAD3D-XML-Aufbaus
- vollständige automatisch erkannte MID-Regressionssuite

## Prüfstand

- 286 automatisch erkannte Regressionstests einzeln bestanden.
- Funktionaler XML-Test bestätigt vier amtliche Prognosepositionen einschließlich +5 Minuten; damit ist der frühere Verlust des ersten Prognosepunkts explizit geschützt.
- 79 TypeScript-/TSX-Dateien ohne Parserfehler geprüft.
- Worker und beide Service Worker syntaktisch geprüft.
- Ein vollständiger Vite-/TypeScript-Produktionsbuild war in der isolierten Umgebung ohne installierte Projektabhängigkeiten nicht möglich.

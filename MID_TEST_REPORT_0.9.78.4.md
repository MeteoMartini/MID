# MID Test Report v0.9.78.4

Datum: 2026-09-03

## Ziel der Prüfung

Geprüft wurde der UI-Hotfix für:

1. deckungsgleiche Tagesbreiten zwischen oberem 7-Tage-Kopf und stündlichem Diagramm,
2. kompaktere Tmin/Tmax-Badges mit schwächeren Hintergründen,
3. Entfernung der "Min"/"Max"-Texte im 7-Tage-Modus.

## Durchgeführte Prüfungen

- Quellprüfung `src/ForecastCockpit.tsx`: Tageskopf erhält dieselben relativen Plotränder wie das 7-Tage-SVG.
- Quellprüfung `src/styles.css` und `src/styles-src/30-modern.css`: oberes 7-Tage-Raster nutzt die übergebenen Plotrand-Variablen responsiv.
- Quellprüfung `src/temperatureTone.ts`: reduzierte Hintergrundintensität für `ecmwfTemperatureTone()` und `dailyTemperatureTone()`.
- Quellprüfung `src/ForecastCockpit.tsx` und `src/App.tsx`: 7-Tage-Tmin/Tmax ohne "Min"/"Max"-Labels.
- Produktionsbuild via Vite/TypeScript.

## Fachlicher Zustand

Keine Änderung an Wetterdaten, Modellfusion, Worker- oder RUC-Logik. Der Hotfix betrifft ausschließlich die visuelle Darstellung der 7-/14-Tage-Prognose.

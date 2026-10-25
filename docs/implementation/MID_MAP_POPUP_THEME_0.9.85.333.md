# MID-C44 · Karten-Popup-Kontrast · v0.9.85.333 Source-Kandidat

## Ausgangsbasis und Befund

Ausgangsbasis ist der am 25.10.2026 bestätigte Stable-Commit `3887ebc31dc93fc33b51ad87b55284671e4d4224` (v0.9.85.332); `main` und `mid-stable` waren vor der Änderung identisch. Installer `40218239133` ist erfolgreich durchgelaufen.

Das Screenshot-Popup ist ein React-Leaflet-Popup für DWD KONRAD3D. Sein Inhalt erbt die helle MID-Textfarbe `--text` (`#eef6ff` im Dark-Theme), während Leaflet standardmäßig eine weiße Popupfläche zeichnet. Der geringe Kontrast betrifft die gemeinsame Bibliotheksfläche und damit ebenso Blitz-, NowCastMIX- und Standort-Popups. Generische MapLibre-Popups besitzen denselben möglichen Inherit-Farbkonflikt. Ihre bisher unthematisierte Defaultfläche kann daher ebenfalls helle App-Textfarben auf weiß zeigen.

## Umsetzung

- Gemeinsame Leaflet-Popupfläche, -Spitze und -Text verwenden `--surface` und `--text`.
- Die zentral in `MapLibreCore` erstellten MapLibre-Popups erhalten `mid-themed-popup` und nutzen dieselben Themevariablen. Andere MapLibre-Sonderkarten erhalten die Regel nicht.
- Schließen-Schaltflächen sind farblich sichtbar, fokussierbar und erhalten auf Touch-Geräten eine 44-px-Zielfläche.
- Die `.extreme-map`-Popups bleiben bewusst weiß mit dunklem Text, da sie nicht mit der Themeklasse versehen sind.
- `src/mapPopupTheme.css` wird nur mit `RadarPanel` und `MapLibreCore` geladen; die initiale CSS-Datei bleibt unverändert und innerhalb ihres harten Budgets.
- Es wurden keine Overlay-Inhalte, Geometrien, Datenquellen oder Layer-Reihenfolgen verändert.

## Regression und Grenzen

`scripts/test-map-popup-theme-0985333.mjs` schützt Themefarben, Leaflet-/MapLibre-Selektoren, Kartenmodul-Imports, Touch-Zielgröße, alle Radar-`<Popup>`-Verbraucher und die unveränderte initiale CSS-Datei.

Die Regression ist ein CSS-/Source-Vertragstest. Ein physischer iPhone-/WKWebView-/VoiceOver-Nachweis liegt nicht vor; produktive Pixelabnahme erfolgt durch das MID Browser-/Heavy-Gate. Die .333-Version bleibt bis zur regulären Source-PR-, Installer-, Pages- und Stable-Freigabe ein Kandidat.

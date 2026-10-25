# MID v0.9.85.333 · Lesbare Karten-Popups in Light und Dark

Leaflet- und MapLibre-Karten-Popups verwenden jetzt die MID-Flächen- und Textfarben ihres aktiven Themes. Dadurch bleiben KONRAD3D-Informationen und weitere Radar-Overlays auch im dunklen Kartenmodus lesbar. Schließen-Schaltflächen erhalten sichtbaren Fokus und auf Touch-Geräten eine 44-px-Zielfläche. Die bewusst helle Extremwetter-Popupgestaltung bleibt unverändert.

## Prüfstand

Der Änderungskandidat basiert auf Stable `3887ebc31dc93fc33b51ad87b55284671e4d4224`. Gemeinsame Leaflet- und MapLibre-Popupverträge sowie deren generierte CSS-Aggregate sind regressionsgeprüft. Der reguläre MID Source-Gate-, Installer-, Pages- und Stable-Pfad ist für diesen Kandidaten noch erforderlich.

- Vite wird von 8.2.4 auf 8.3.5 aktualisiert; @vitejs/plugin-react 6.1.2 bleibt unverändert und ist mit Vite 8 kompatibel.
- React 19.2.8 und MapLibre GL JS 6.7.0 bleiben auf dem bereits qualifizierten Stand.
- Die Kandidaten React 19.3.1 und MapLibre GL JS 6.15.0 überschritten bei gemeinsamer lokaler Regression die bestehenden harten Feature-Chunk-Budgets. Sie sind nicht Bestandteil dieses Releases; die Budgets wurden nicht angehoben.
- Capacitor 8.5.3, PostCSS 8.5.31 und Pako 2.2.0 bleiben unverändert.

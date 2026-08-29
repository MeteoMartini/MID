# MID v0.9.67.5 – MapLibre-6-Flächenrendering-Hotfix

## Ursache

Mit v0.9.67.3 wurde MapLibre GL JS von 5.24.0 auf 6.5.0 angehoben. MapLibre 6
liefert den internen Worker als ESM-Modul aus und verlangt bei Vite-Builds eine
explizite Worker-URL. Diese Vite-Workergrenze fehlte. Dadurch konnte die Karte
einschließlich Rastergrundlage und HTML-Markern erscheinen, während die im
Worker verarbeiteten GeoJSON-Flächen im Produktionsbuild leer blieben. Der
Fehler wurde zusätzlich durch leere Fehlerbehandlung beim Layeraufbau optisch
verschleiert.

## Korrektur

- `MapLibreCore` importiert den MapLibre-Worker über Vites verbindlichen
  `?worker&url`-Pfad und setzt ihn vor der ersten Karteninstanz.
- Vite erzeugt dadurch einen eigenständigen, gehashten Worker-Chunk; dessen
  internes Shared-Modul geht im Produktionsbuild nicht verloren.
- Browser/PWA und Capacitor-iOS-WebView nutzen denselben korrigierten
  React-/Vite-/MapLibre-Kern. Es gibt keinen iOS-Fork.
- Die meteorologische Flächenbildung, Schwellen, Regionszuordnung,
  Beschriftungen, Kartenreihenfolge und Worker-Fachlogik bleiben unverändert.

## Regression

`scripts/test-maplibre-v6-worker-runtime-096675.mjs` schützt die
Vite-Workergrenze, ihre Reihenfolge vor der ersten Karte und – nach dem
Produktionsbuild – den tatsächlich selbstständig emittierten Worker-Chunk. Die
bisherigen Extremflächen-, GeoJSON-, Kontur-, Karten- und
Layerreihenfolgeprüfungen bleiben zusätzlich verbindlich.

## Worker

Keine fachliche Cloudflare-Worker-Änderung. Das Worker-Artefakt wird lediglich
auf das gemeinsame Release v0.9.67.5 synchronisiert.

## Abschlussvalidierung

- TypeScript und Vite-Produktionsbuild bestanden.
- Der Produktionsbuild enthält genau einen selbstständigen MapLibre-Worker mit
  475.043 Byte; derselbe Worker wurde in das Capacitor-iOS-WebView-Bundle
  synchronisiert.
- Worker-Syntax für kanonisches Aggregat und Release-Einstieg bestanden.
- Relevante Flächen-, Multipolygon-, Geodaten-, Regions- und
  MapLibre-6-Worker-Einzeltests bestanden.
- Vollständige MID-Regressionssuite: **553 von 553 bestanden**.
- Capacitor-Sync und iOS-Projektstruktur bestanden; Apple-SDK-Build bleibt bis
  zu einer verfügbaren macOS-/Xcode-Laufzeit offen.
- Der Hochrisiko-Abhängigkeitsgate ist grün. `npm audit` meldet drei moderate
  Befunde in der ausschließlich zur lokalen iOS-Projekterzeugung verwendeten
  Capacitor-CLI-Unterkette `xcode → uuid`; npm bietet nur einen erzwungenen
  CLI-Wechsel an, der nicht Teil dieses Karten-Hotfixes ist.

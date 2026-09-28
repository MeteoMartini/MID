# MID v0.9.34.0

## Schwerpunkt
- Langfrist: Multi-Modell-fähige saisonale Darstellung mit Rauchfahnen-/Unsicherheitsband vorbereitet und für numerisch verfügbare Open-Meteo-ECMWF-Varianten parallel angebunden.
- Langfrist: Farbskalen für Temperatur sowie trockener/feuchter fachlich sinnvoller abgestuft.
- Langfrist: Monatsbeschriftungen im Diagramm von der Y-Achse abgesetzt, damit die erste Monatsachse nicht mehr überdeckt wird.
- Berg-/Wintersport: neue Schnellübersicht zur Schneefallgrenze mit zeitlichem Verlauf, Unsicherheitsband und eingezeichneten Höhenstufen.

## Technische Umsetzung
- `src/seasonalForecast.ts`
  - Mehrere saisonale Fetch-Profile für ECMWF Seasonal Seamless, SEAS5 und EC46 ergänzt.
  - Deduplizierung identischer Antworten sowie robustes Fallback beibehalten.
  - Ensemblegröße robuster auf 51 synchronisiert, wenn die API die Memberzahl nicht sauber ausweist.
- `src/LongRangePanel.tsx`
  - Neue Multi-Modell-Logik und Rauchfahnen-Diagramme für Temperatur und Niederschlag.
  - Einzelmodellansicht weiterhin vorhanden, inklusive 10–90-%-Whiskern.
  - Diagramm-X-Geometrie so angepasst, dass die erste Monatsbeschriftung nicht auf der Y-Achse liegt.
- `src/App.tsx`
  - Neue Komponente `MountainSnowLineTrend` eingebaut.
  - Integration direkt im Berg-/Wintersport-Modul zwischen Zonenanalyse und Höhenmatrix.
- `src/styles.css`
  - Zusätzliche Styles für Multi-Modell-Langfristdiagramme und Schneefallgrenzen-Schnellübersicht.
- Versionssynchronisierung auf `0.9.34.0` (`package.json`, `MID_BASELINE.json`, `src/version.ts`, `public/version.json`, `index.html`, Service Worker, Cloudflare Worker).

## Worker-Upload erforderlich
- **Ja** – ausschließlich zur Versionssynchronisierung auf `0.9.34.0`.

## Zusätzliche Cloudflare-Schritte
- Gewohnten Worker-Upload/Deploy ausführen.
- Danach Frontend neu deployen, damit Frontend- und Worker-Version wieder identisch sind.

## Prüfung
- `npm run sync-version` erfolgreich ausgeführt.
- Ein vollständiger lokaler Produktionsbuild konnte in dieser Arbeitsumgebung nicht gefahren werden, weil `node_modules` im bereitgestellten Paket nicht installiert waren (`vite: not found`).

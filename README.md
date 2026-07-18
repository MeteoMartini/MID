# MID v2.2.0

Meteorological Information Dashboard.

# Open-Meteo Wetterzentrum

GitHub-Pages-fähige React-/TypeScript-App mit Best Match, Ortssuche, aktuellen Wetterkarten, DWD-Stationsprüfung, Gefahrenindikatoren, 7-Tage-Detailansicht, 14-Tage-Ensembles, RainViewer-Radar, Dark Mode und Widget-PNG-Export.

## Start

```bash
npm install
npm run dev
```

## GitHub Pages

Repository nach GitHub pushen, unter **Settings → Pages → Source** „GitHub Actions“ wählen und auf `main` pushen. Der Workflow baut und veröffentlicht automatisch.

## Quellen

- Open-Meteo: Wetter, Geocoding, Luftqualität und Ensembles
- RainViewer: Radarkacheln; Attribution und Nutzungsbedingungen beachten
- Bright Sky: DWD-Stationsdaten in Deutschland

Die Hazard-Anzeigen sind automatisch berechnete Indikatoren und keine amtlichen Warnungen.

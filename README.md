# MID – Meteorological Information Dashboard

**Aktuelle Version: v0.3.9**

MID ist ein GitHub-Pages-fähiges Wetterdashboard auf Basis von React und TypeScript. Es verbindet Open-Meteo Best Match mit Ensemble-Prognosen, Stationsmessungen, Radar, Luftqualität, Gefahrenindikatoren und exportierbaren Wetterwidgets.

## Funktionen

- aktuelles Wetter einschließlich gefühlter Temperatur
- Abgleich mit der passendsten verfügbaren WMO-/METAR- oder DWD-WMO-Station
- kompakte 7-Tage-Übersicht mit Temperaturbereich, Wind, Böen, Niederschlag und Tages-Hazards
- interaktive stündliche Detailansicht: Diagramm und Stundenkacheln sind anklickbar
- sichtbare 14-Tage-Ensemble-Übersicht mit Best Match, P10–P90 und Prognosekonsistenz
- gewichtete Nutzung der am Standort verfügbaren Open-Meteo-Ensemblemodelle
- OpenStreetMap-Grundkarte mit RainViewer-Radar
- Luftqualität, Dark Mode und Widget-PNG-Export
- responsive Darstellung für Smartphone, Tablet und Desktop

## Entwicklung

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
```

## GitHub Pages

Unter **Settings → Pages → Source** muss **GitHub Actions** ausgewählt sein. Der vorhandene Deployment-Workflow baut den Vite-Stand aus dem Branch `main`.

## Weltweiter WMO-/METAR-Abgleich

AviationWeather.gov erlaubt derzeit keine direkten Cross-Origin-Abfragen aus einer GitHub-Pages-Webseite. Deshalb enthält MID unter `worker/metar-proxy.js` einen kleinen Cloudflare-Worker-Proxy.

Nach dessen Bereitstellung wird die öffentliche Worker-Adresse beim Build als Variable gesetzt:

```text
VITE_METAR_PROXY_URL=https://DEIN-WORKER.workers.dev/
```

MID vergleicht dann weltweit nahe Flugplatz-, METAR- und WMO-Messstationen anhand von Entfernung, Höhenunterschied und Aktualität. In Deutschland wird zusätzlich Bright Sky/DWD-WMO geprüft.

## Datenquellen

- Open-Meteo: Best Match, Ensemblemodelle, Luftqualität und Geocoding
- RainViewer: Radar
- OpenStreetMap: Kartenbasis
- Bright Sky: DWD-/WMO-Beobachtungen
- NOAA AviationWeather: weltweite METAR-/Flugplatzbeobachtungen über den mitgelieferten Proxy

Die Hazard-Anzeigen sind automatisch berechnete Indikatoren und keine amtlichen Warnungen.

## Changelog

### v0.3.9

- 14-Tage-Ensemblebereich wird immer angezeigt, auch während des Ladens oder bei einer vorübergehenden API-Störung
- fehlerhafte Open-Meteo-Modellkennungen korrigiert
- standortabhängige Abfrage aller passenden globalen und regionalen Ensemblemodelle
- Gewichtung nach räumlicher Auflösung, Aktualisierungsintervall, Vorhersagehorizont und Modellfamilie
- robuster P10–P90-Filter gegen fehlende Werte und einzelne unplausible Mitglieder
- zusätzlicher Rückfall auf verfügbare Ensemble-Modellmittel, falls Mitgliederdaten nicht ausreichend vollständig sind
- Tagesdiagramm direkt anklickbar; Niederschlagswahrscheinlichkeit wird separat angezeigt
- gefühlte Temperatur in die Hitze-Hazards einbezogen
- Karten und Kacheln auf kleinen Displays kompakter
- METAR-/WMO-Abgleich erweitert und Worker aktualisiert
- README und Changelog aktualisiert

### v0.3.8

- eigenständige 14-Tage-Ensemble-Kachelübersicht ergänzt
- farbige Konsistenzpunkte und Temperaturbalken ergänzt

### v0.3.7

- Verarbeitung einzelner Ensemblemitglieder eingeführt
- Schutz vor `null`-Werten, die zuvor fälschlich als 0 °C erscheinen konnten
- optionaler METAR-/WMO-Proxy ergänzt

### v0.3.6

- interaktive stündliche Detailwerte eingeführt
- Taupunkt auf ganze Grad gerundet

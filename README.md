# MID – Meteorological Information Dashboard

**Aktuelle Version: v0.4.8**

MID ist ein GitHub-Pages-fähiges Wetterdashboard auf Basis von React und TypeScript. Es verbindet Open-Meteo Best Match mit Ensemble-Prognosen, Stationsmessungen, Radar, Luftqualität, Gefahrenindikatoren und exportierbaren Wetterwidgets.

## Funktionen

- aktuelles Wetter einschließlich gefühlter Temperatur
- Abgleich mit der passendsten verfügbaren WMO-/METAR- oder DWD-WMO-Station
- kompakte 7-Tage-Übersicht mit Temperaturbereich, Wind, Böen, Niederschlag und Tages-Hazards
- interaktive stündliche Detailansicht: Diagramm und Stundenkacheln sind anklickbar
- stündliche Wetterpiktogramme in der Detailansicht, sofern sinnvoll ohne Überlappung darstellbar
- standardmäßig vorausgewählte aktuelle Stunde in der Detailansicht
- sichtbare 14-Tage-Ensemble-Übersicht mit Best Match, P10–P90 und Prognosekonsistenz
- gewichtete Nutzung der am Standort verfügbaren Open-Meteo-Ensemblemodelle
- OpenStreetMap-Grundkarte mit RainViewer-Radar
- Luftqualität, Dark Mode sowie Widget-/PNG-Export im MID-Design
- optional einblendbare Hazards im Widget und PNG-Export
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

### v0.4.4

- Header bereinigt: neben dem Logo wird nur noch die Versionsangabe angezeigt, damit „MID“ nicht doppelt erscheint
- Detailansicht erweitert: zusätzliche Linie für die Niederschlagswahrscheinlichkeit sowie kompakte Legende für Temperatur, gefühlte Temperatur, Niederschlag und Regenwahrscheinlichkeit
- Hazard-System auf vier Stufen erweitert (gelb, orange, rot, violett) und an gebräuchliche nationale/internationale Schwellen für UV, Wind/Böen, Starkregen, Hitze, Frost und Gewitter angelehnt
- tägliche Hazard-Pills in 7-Tage-Ansicht und Widget entsprechend erweitert
- README und Changelog aktualisiert

### v0.4.3

- Seiten-Titel auf „MID - Meteorological Information Dashboard“ vereinheitlicht
- neues MID-Logo als Seitenlogo, Header-Logo und Favicon eingebunden
- Versionsnummer nun auch in der kompakten Kopfzeile sichtbar
- 14-Tage-Niederschlagsdiagramm nutzt für die Mengen-Balken jetzt den Best-Match-Niederschlag des Ortes statt des ENS-Mittels
- mobile Kopfzeile überarbeitet; Reload- und Lokalisierungs-Schaltflächen in der Hochformat-Ansicht sauber ausgerichtet
- README und Changelog aktualisiert

### v0.4.2

- Autolokalisierung benennt den Standort nach Geodatenbank und kennzeichnet dies deutlich
- helle Layout-Umschaltung auch im mobilen Handy-Layout sichtbar
- Niederschlagswahrscheinlichkeit im 14-Tage-Niederschlag per Legendeneintrag ein-/ausblendbar
- Widgets nochmals kompakter gestaltet
- Tooltip im 14-Tage-Temperaturtrend zeigt für Best Match Min-/Max-Werte

### v0.4.1

- Changelog unauffällig im Footer verlinkt
- beim allerersten Aufruf keine vorgegebene Wetteransicht; zuletzt gewählter Ort wird lokal gespeichert und beim nächsten Besuch automatisch geladen
- Wind und Windrichtung in den aktuellen Daten zu einer gemeinsamen Kachel zusammengefasst
- mobile Messwert- und Forecast-Kacheln nochmals kompakter gestaltet
- 14-Tage-Ensemble-Kacheln verdichtet und um Niederschlagswahrscheinlichkeit ergänzt
- 14-Tage-Niederschlagstrend um eine eigene Wahrscheinlichkeitsachse erweitert
- Widget-/PNG-Größe passt sich automatisch an Anzahl und Inhalt an; Tage bleiben nebeneinander
- README und Changelog aktualisiert

### v0.4.0

- Suchfeld ist beim ersten Aufruf leer und dient nur der gezielten Orts-/Standortsuche
- stündliche Wetterpiktogramme in der Detailansicht ergänzt; aktuelle Stunde wird standardmäßig vorausgewählt
- stündliche Kacheln in der Detailansicht um Windrichtung und Wind erweitert
- Detaildiagramm größer und besser lesbar skaliert
- Widget-/PNG-Generator gestalterisch an das übrige MID-Design angepasst
- neue Option zum Ein-/Ausblenden von Hazards im Widget und PNG-Export
- README und Changelog aktualisiert

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

### v0.3.8

- eigenständige 14-Tage-Ensemble-Kachelübersicht ergänzt
- farbige Konsistenzpunkte und Temperaturbalken ergänzt


## Stand v0.4.6

- Hazard-Schwellen an DWD-, Meteoalarm- und NWS-Logik angenähert und in den automatischen Warnindikatoren farblich abgestuft
- Niederschlagsformen in der 7-Tage-Detailansicht erweitert: Regen, Schauer, Schnee, Schneeschauer, Schneeregen und Schneeregenschauer (nur bei Datensignal)
- Detail-Legende dynamisch und mobil umbruchfähig
- Hochformat-Layout für lange Bezeichnungen verbessert


## Stand v0.4.7

- Tooltip im 14-Tage-Temperaturtrend sprachlich und fachlich präzisiert
- Best Match nun als Tmin/Tmax benannt
- ENS-Mittel im Tooltip getrennt für Tmin und Tmax ausgewiesen


## Stand v0.4.8

- UV-Index wird nun als effektiver, bewölkungs- und wetterkorrigierter UVI dargestellt
- 14-Tage-Tooltip nutzt die gewünschte Reihenfolge: Best Match, ENS-Mittel, P10–P90, Niederschlag, Prognosekonsistenz

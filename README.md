# MID – Meteorological Information Dashboard

**Aktuelle Version: v0.5.5**

MID ist ein GitHub-Pages-fähiges Wetterdashboard auf Basis von React und TypeScript. Es verbindet Open-Meteo Best Match mit Ensemble-Prognosen, Stationsmessungen, Radar, Luftqualität, Gefahrenindikatoren und exportierbaren Wetterwidgets.

## Funktionen

- aktuelles Wetter einschließlich gefühlter Temperatur und Bewölkung in Achteln (n/8)
- Abgleich mit der passendsten verfügbaren WMO-/METAR- oder DWD-WMO-Station
- kompakte 7-Tage-Übersicht mit gewichtetem Tagescharakter, Temperaturbereich, Wind, Böen, Niederschlag und Tages-Hazards
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

### v0.5.4

- Bewölkung in den aktuellen Daten und im Stunden-Tooltip auf Achtel (n/8) umgestellt
- Tageswettercharakter aus den stündlichen Best-Match-Daten neu gewichtet
- kurze oder niedrig wahrscheinliche Niederschlagsereignisse bestimmen nicht mehr automatisch das Symbol und den Haupttext des gesamten Tages
- Tagescharakter berücksichtigt Dauer, Niederschlagsmenge, Wahrscheinlichkeit, Tageszeit und Schwere des Wetterereignisses
- schwache Einzelereignisse werden nur als sekundärer Hinweis ausgegeben, beispielsweise „abends Sprühregen möglich (30 %)“

### v0.5.2

- Niederschlagsarten meteorologisch anhand der WMO-Wettercodes sowie der Open-Meteo-Komponenten `rain`, `showers` und `snowfall` neu klassifiziert
- Sprühregen wird nur noch bei den dafür vorgesehenen WMO-Codes 51, 53 und 55 verwendet
- gefrierender Sprühregen, gefrierender Regen, Schneegriesel, Schneeregen, Schneeregenschauer und Gewitterniederschlag ergänzt
- aktuelle Niederschlagswahrscheinlichkeit um 15-minütige Angabe von Niederschlagsart sowie voraussichtlichem Beginn und Ende erweitert
- für Deutschland und angrenzende DWD-Radarabdeckung ist die Radarzeitleiste bis +60 Minuten über das offene DWD-RV-Nowcast nutzbar
- außerhalb der DWD-Abdeckung werden RainViewer-Zukunftsframes genutzt, sofern die öffentliche Schnittstelle sie bereitstellt
- README und Changelog aktualisiert

### v0.5.1

- Stunden-Navigation in der Detailansicht über Tagesgrenzen erweitert: 23:00 → nächster Tag 00:00 und 00:00 → vorheriger Tag 23:00
- Bezeichnung der Niederschlagsart Drizzle projektweit auf „Sprühregen“ vereinheitlicht


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

- UV-Index verwendet den von Open-Meteo gelieferten, bewölkungsberücksichtigten `uv_index` ohne nachträgliche Eigenkorrektur
- 14-Tage-Tooltip nutzt die gewünschte Reihenfolge: Best Match, ENS-Mittel, P10–P90, Niederschlag, Prognosekonsistenz


## Versionsschema

MID bleibt bis zur stabilen Produktreife in der Reihe `0.x.y`.

- **Patch (`0.4.8` → `0.4.9`)**: gezielte Fehlerkorrekturen, fachliche Verfeinerungen und begrenzte UI-Änderungen ohne grundlegenden Umbau.
- **Minor (`0.4.x` → `0.5.0`)**: deutlich neuer Funktionsbereich, größere Datenarchitektur oder wesentlich veränderter Bedienablauf.
- **Major (`1.0.0`)**: stabiler, dokumentierter Funktionsumfang mit belastbarer Daten- und Deployment-Struktur.

Versionssprünge werden restriktiv vergeben. Dieses Release erhält **v0.5.0**, weil die stündliche Detailansicht strukturell neu bedient wird und die große Kachelmatrix vollständig entfällt.

## Stand v0.4.9

- 14-Tage-Tooltip nach Best Match, ENS-Mittel, P10–P90, Niederschlag und Prognosekonsistenz gruppiert
- stündliche Detailinformationen in ein Diagramm-Tooltip verlagert; die große Kartensektion unter dem Diagramm entfällt
- tatsächlicher, bewölkungsberücksichtigter Open-Meteo-UVI wurde als Primärwert eingeführt; ab v0.5.0 entfallen Klarhimmelvergleich und eigene Nachkorrekturen vollständig

## Stand v0.5.0

- stündliche Kachelmatrix aus der 7-Tage-Detailansicht entfernt
- dauerhaft sichtbare, kompakte Stunden-Detailanzeige direkt am Diagramm; Klick auf eine Stunde aktualisiert sie ohne Öffnen/Schließen
- Detailanzeige bündelt Wetter, Temperatur, gefühlte Temperatur, Niederschlagsart/-menge/-wahrscheinlichkeit, Wind/Böen, Feuchte/Taupunkt, Bewölkung und UVI
- UVI-Logik korrigiert: MID verwendet ausschließlich den tatsächlich erwarteten, bewölkungsberücksichtigten `uv_index`; Klarhimmelwerte und zusätzliche Eigenkorrekturen werden nicht mehr angezeigt oder angewendet
- Niederschlag aus dem Tooltip „Temperaturtrend und Prognoseunsicherheit“ entfernt
- Minor-Versionssprung, da die Bedienstruktur der stündlichen Detailansicht substanziell geändert wurde


## Stand v0.5.3

- Niederschlagsformen werden strikt über WMO-Wettercodes klassifiziert.
- Sprühregen wird nur noch für die Codes 51, 53 und 55 angezeigt; normaler Regen für 61, 63 und 65.
- Mischformen werden nur bei gleichzeitig messbaren flüssigen und festen Anteilen ausgewiesen.

## Stand v0.5.5

- Rechtschreibung in den ergänzenden Tageshinweisen korrigiert: meteorologische Substantive wie „Sprühregen“ bleiben großgeschrieben; nur vorangestellte Adjektive werden im Satzinneren kleingeschrieben.
- 7-Tage-Tageszeilen für Hoch- und Querformat neu angeordnet, damit Wetterbeschreibung, Tmin/Tmax und Temperaturbalken nicht mehr überlappen.
- Wetterbeschreibung wird innerhalb ihres eigenen Rasterbereichs umgebrochen; der Temperaturbereich erhält bei schmaleren Displays eine eigene Zeile.


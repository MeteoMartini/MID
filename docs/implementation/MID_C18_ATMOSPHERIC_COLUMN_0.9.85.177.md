# MID C18 · Atmosphärische Höhengrenzen · 0.9.85.177

Verifizierte Releasebasis: main = mid-stable = `eab656d060e6dc093db1f98195ffa7ff65d17c72` (0.9.85.176), Installer 37439901687 erfolgreich. Keine konkurrierenden Installer.

## Befund und fachlicher Vertrag

Bei gleichen geografischen Koordinaten, derselben atmosphärischen Modellsäule, Quelle und gültigen Zeit darf die Auswahl einer anderen Stationhöhe allein die Nullgrad- oder Schneefallgrenze über Meer nicht verändern. Temperatur, Feuchte, Oberflächenwind und Niederschlagsphase am jeweiligen Niveau dürfen sich ändern. Räumlich getrennte Stationen sind keine identische Säule: verschiedene Modellzellen, Luv/Lee, Kaltluftseen, Niederschlagskühlung und Frontgradienten erlauben Unterschiede. Inversionen können mehrere Nullgraddurchgänge erzeugen; eine einzelne Modell-Grenzhöhe beschreibt dies nur eingeschränkt. Keine neue pauschale Talabsenkung oder doppelte Schmelz-/Verdunstungskühlung.

Das lokale Hebungskondensationsniveau (LCL) eines Luftpakets ist keine beobachtete, für alle Wolken gültige Untergrenze. Mehrere Schichten können verschiedene Basen haben. Die unterste diagnostizierte Wolkenbasis wird von derjenigen Schicht getrennt, in der die gewählte Station liegt. Höhen über Grund (AGL) unterscheiden sich bei verändertem Gelände auch bei gleicher absoluter Basis. Anbieterhöhen über Meer werden wie im bestehenden UI als NHN bezeichnet; eine geodätisch genaue Umrechnung unterschiedlicher Höhendatums wird nicht behauptet.

## Reproduzierbarer Live-Vergleich

Abruf am 06.10.2026 gegen 09:05 UTC: Open-Meteo Best Match, 46.969°N / 11.010°E jeweils identisch, angeforderte Höhen 1352 / 2081 / 3340 m, gültige Stunden 09 / 10 / 11 UTC. Die fehlende `cell_selection` bedeutete die Anbieter-Voreinstellung `land`, die eine hinsichtlich Geländehöhe geeignete Zelle auswählt.

| Stationshöhe | Zurückgegebene Zelle mit `land` | Nullgradgrenze 09 UTC | Schneefallgrenze 09 UTC |
| --- | --- | --- | --- |
| 1352 m | 46.96 / 11.00 | 3150 m | 1560 m |
| 2081 m | 46.98 / 11.00 | 3140 m | 1770 m |
| 3340 m | 46.98 / 11.04 | 3140 m | 1960 m |

Mit `cell_selection=nearest`: alle drei Antworten 46.96 / 11.02, Nullgradgrenze 3110 / 3120 / 3160 m und Schneefallgrenze 1700 / 1690 / 1540 m für die drei gültigen Stunden, für alle Stationshöhen identisch. Dies belegt den Auswahlfehler, nicht die meteorologische Wahrheit der Modell-Schneefallgrenze. Gerade unterschiedliche Best-Match-Produkte können große Unterschiede zwischen Nullgrad- und Schneefallgrenze liefern; keine zusätzliche Kalibrierung aus diesem Einzelabruf.

Reproduktion: `https://api.open-meteo.com/v1/forecast?latitude=46.969,46.969,46.969&longitude=11.01,11.01,11.01&elevation=1352,2081,3340&hourly=freezing_level_height,snowfall_height&forecast_hours=3&models=best_match` mit/ohne `&cell_selection=nearest`. Daten sind laufend aktualisiert.

## Umsetzung

- Basis- und Regionalabrufe der Höhenprognose verwenden `nearest`; tatsächliche Oberflächenhöhen bleiben für das Downscaling erhalten. Tatsächlich verschiedene Koordinaten werden nicht zusammengelegt, Werte nicht künstlich gleichgesetzt.
- Freie Bergdiagnostik verwendet `nearest` und `elevation=nan`. Damit bleiben Druckflächen und Modellgelände unabhängig von der Stationshöhe; zurückgegebenes Modellterrain wird beim Ausschluss unterirdischer Wolkenprofilpunkte verwendet. Bestehende Zeitachsen werden weiter explizit ausgerichtet.
- Das gesamte oberirdische Wolkenprofil bleibt erhalten. Die unterste ausreichend bewölkte Schicht liefert die globale Basis, die lokale Schicht liefert Wolken-/Sichtrisiko. Der Berg darf oberhalb einer tiefen Wolkenschicht liegen, ohne dass deren Basis verschwindet. Grobe Druckflächen erlauben nur ungefähre Untergrenzen. Ohne bekannte Modellgeländehöhe wird keine unterste Profilbasis behauptet.
- Ohne diagnostizierte Basis erscheint ausdrücklich „Lokales Kondensationsniveau (NHN)“, nicht „Wolkenuntergrenze“. LCL-Fallback für lokale Sicherheitsprüfung bleibt eine Schätzung; keine erfundene Messung.
- Gemeinsame DWD-Näherung verwirft null/leer statt `Number(null)=0`; explizite echte 0-m-Grenzen bleiben gültig. Auch optionale Profilkoordinaten behandeln null/leer nicht als 0°.
- Älterer `mountainForecast`-Höhenvergleich erhält dieselbe feste geografische Zellwahl; kanonisches Weather-Fragment und erzeugtes Aggregat bleiben identisch.

## App-weite Prüfung

| Verbraucher | Vertrag / Ergebnis |
| --- | --- |
| Berg-Kennwerte, Stunden, Perioden, Tagessummaries | Alle beziehen gemeinsame Grenzhöhen aus den korrigierten Höhenabrufen; native Schneefallhöhe hat weiter Vorrang. |
| Berg-Schneefallgrenzen-Ensemble | Bereits `nearest` und `elevation=nan`; Methodik und Unsicherheitsbänder unverändert. Gemeinsamer Nullwertschutz greift auch hier. |
| Älterer Berg-Höhenvergleich in Weather | Fehlende feste Zellwahl korrigiert, keine weitere parallele Rechenlogik. |
| Event-Flugwetter / Worker-Meteogramm | Bereits `nearest`; Ceiling ausdrücklich ft AGL. Abzug der tatsächlichen Geländehöhe ist fachlich gewollt. |
| Flugroute / Querschnitt | Atmosphärisches Profil wird am gewählten Flugniveau ausgewertet; Terminal-Untergrenze ft AGL, kein Addieren der gewählten Flughöhe zur freien Wolkenbasis. Lokale Flughöhenrisiken sind keine gemeinsame Basis. |
| Hauptwetter / Stationswolken | Beobachtete METAR-Basis und Ceiling in AGL, Quellen und Beobachtung getrennt. Keine Verwendung des Berg-LCL-Helfers. |
| Karten-Niederschlagsphase / RUC / Modellfelder | Räumliche Gitterfelder dürfen variieren. Native Produkte werden nicht durch ein konstantes Höhenprofil ersetzt. |
| Forecast Fusion | Land-Zellwahl für einzelne Geländeorte ist gezielt; kein vertikaler Stationswahlschalter für dieselbe Säule. Daher keine pauschale Umstellung aller Abrufe. |

## Quellen

- Open-Meteo API-Dokumentation: https://open-meteo.com/en/docs (`cell_selection`, `elevation`, native Druckflächen und Grenzhöhen).
- Open-Meteo GFS-Dokumentation: https://open-meteo.com/en/docs/gfs-api (Geopotential und Nullgradgrenze über Meer).
- NOAA/NWS LCL-Erklärung: https://www.weather.gov/btv/profileLCL (Sättigungsniveau eines gehobenen Luftpakets, bedingte Wolkenbasisschätzung).
- NOAA/NWS Schichtwolken: https://www.weather.gov/media/zhu/ZHU_Training_Page/clouds/forecast_layer_clouds/Layer_Cloud_Forecasting.pdf (verschiedene Bildungsmechanismen und Geländeabhängigkeit).

## Validierung

Neue ausführbare Regression prüft echte Abrufparameter für Basis/Regional/Diagnostik, weiter unterschiedliche Oberflächenhöhen, fehlende Eingaben und echte Nullwerte, gemeinsame unterste Wolkenbasis sowie getrennte Risiken mehrerer Wolkenschichten. Golden-Fingerprint nur für absichtlich geänderte Bergdeklarationen aktualisiert. Lokal 918/918 vollständige Regressionen, Build/Typecheck, Worker-Syntax und Capacitor Copy/iOS-Shell grün. Die normalen SHA-gebundene Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben verbindlich. Live-Abruf ist ein Anbieterbeleg, Offline-Tests sind kein Live-RUC-Beleg.

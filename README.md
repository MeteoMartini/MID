# MID – Meteorological Information Dashboard

**Aktuelle Version: v0.7.8**

MID ist ein GitHub-Pages-fähiges Wetterdashboard auf Basis von React, TypeScript und Open-Meteo. Es verbindet Vorhersagen, Ensemblemodelle, aktuelle Stationsmessungen, amtliche Warnungen, Radar, Luftqualität und exportierbare Wetterwidgets.

## Neuerungen in v0.7.8

- konsequente Ortszeit in Stundenwahl, Diagrammen, Radar, Kurzfristniederschlag, Warnungen und Widget
- korrekte lokale Kalendertage auch bei weit entfernten Zielorten und großen Zeitzonenunterschieden
- Sonnenaufgang und Sonnenuntergang bleiben an der lokalen Uhrzeit des gewählten Standorts ausgerichtet
- Suche nach OpenStreetMap-POIs über Photon, darunter Berggipfel, Hotels, Hütten, Sehenswürdigkeiten, Gastronomie und weitere benannte Objekte
- kompakte Kennzeichnung von POI-Typ und OpenStreetMap-Datenquelle in der Trefferliste

## Neuerungen in v0.7.7

- Tagesdetaildiagramm markiert die Nachtstunden vor Sonnenaufgang und nach Sonnenuntergang mit einer dezenten diagonalen Schraffur.
- Sonnenauf- und Sonnenuntergangszeit werden direkt an den Übergängen im Diagramm klein und platzsparend eingeblendet.
- Die Zeiten stammen aus den orts- und tagesbezogenen Open-Meteo-Daten; die vorhandene Tag-/Nachtlogik der Sonnenschein- und Bewölkungsbalken bleibt unverändert.

## Neuerungen in v0.7.6

- fehlerhafte Jahresdarstellung wie „5026“ behoben; Versionsersetzung greift nur noch auf eindeutig mit `v` gekennzeichnete Versionsangaben zu
- Datumsangaben bei „Aktualisiert“, im Widget und in Update-Hinweisen bleiben unverändert und werden korrekt vierstellig dargestellt
- Sonnenschein-/Bewölkungsbalken strikt nach Tag und Nacht getrennt
- nachts kein Balken bei klarem Himmel und niemals ein gelber Sonnenscheinbalken
- nachts ausschließlich graue Balken ab relevanter Bewölkung; Stärke weiterhin in vier Stufen
- bei Tageslicht gelbe Balken unter 50 % Bewölkung und graue Balken ab 50 %, jeweils mit proportionaler Dickenabstufung

## Neuerungen in v0.7.5

- kompakte, aufklappbare Modellstand-Anzeige direkt in den Überschriften von Best Match und Ensembletrend
- Init-Zeitpunkt und Verfügbarkeit der tatsächlich abgefragten Modellläufe werden in UTC angezeigt
- Best Match wird transparent als automatische Open-Meteo-Modellkombination gekennzeichnet
- wahrscheinliche regionale-zu-globale Modellkette wird ausdrücklich als Schätzung ausgewiesen, da Open-Meteo die konkrete Quelle nicht stunden- und variablengenau zurückliefert
- die Zusatzinformationen beanspruchen im geschlossenen Zustand nur eine kleine Info-Schaltfläche und keine zusätzliche Inhaltszeile

## Neuerungen in v0.7.4

- Desktop-Tastatursteuerung für die stündliche Tagesdetailansicht ergänzt
- nach einem Klick in das Detaildiagramm wechseln die Pfeiltasten links und rechts zur vorherigen beziehungsweise nächsten Stunde
- die Navigation übernimmt an Tagesgrenzen automatisch den Wechsel zwischen 23:00 und 00:00 Uhr
- die Tastatursteuerung ist an den Diagrammfokus gebunden und beeinflusst keine Eingabefelder oder mobile Bedienung

## Neuerungen in v0.7.3

- Sonnenschein und Gesamtbewölkung erscheinen im Tagesdetail als abgerundete Balkenzeile direkt unter den Wetterpiktogrammen
- gelbe Balken kennzeichnen sonnige beziehungsweise überwiegend klare Phasen; je dicker, desto klarer
- graue Balken kennzeichnen Bewölkung; je dicker, desto stärker bewölkt
- beide Darstellungen verwenden vier eindeutig abgestufte Linienstärken; nachts wird kein Sonnenschein suggeriert

## Neuerungen in v0.7.2

- Verlauf der Gesamtbewölkung im Tagesdetail als eigener oberer Diagrammbereich über der Temperaturkurve angeordnet
- automatischer Versionscheck über `version.json` mit cache-freiem Abruf beim Start
- Update-Hinweis „MID wurde aktualisiert – jetzt neu laden“ mit optionaler automatischer Neuladung
- erneute Versionsprüfung bei Rückkehr aus dem Hintergrund, beim erneuten Anzeigen der Seite und regelmäßig während der Nutzung
- korrekte Höhenangabe im Widget auch bei Koordinatensuche durch Open-Meteo-Höhenabfrage und Vorhersage-Fallback
- Widget-Optionen werden beim nächsten Aufruf zuverlässig aus dem lokalen Speicher wiederhergestellt

## Neuerungen in v0.7.1

- GeoSphere-TAWES-Antworten werden wieder korrekt den Stationskennungen zugeordnet
- österreichische TAWES-Stationen werden zusätzlich über den gemeinsamen Worker abgerufen und mehrere geeignete Stationen robust gemittelt
- TAWES-Windwerte und METAR-Zeitstempel werden zuverlässig normalisiert; die Worker-Diagnose weist GeoSphere Austria separat aus
- alle wesentlichen Reihen der 14-Tage-Temperatur- und Niederschlagsdiagramme lassen sich einzeln ein- und ausblenden; die Auswahl wird lokal gespeichert
- Tagesdetaildiagramm um einen stündlichen Verlauf der Gesamtbewölkung ergänzt
- Abruf amtlicher Warnungen für Desktop-Browser durch HTTPS-Normalisierung, CORS-sicheren Neuversuch und Cache-Umgehung stabilisiert
- Ortssuche akzeptiert Dezimalkoordinaten, deutsche Dezimalkommas sowie N/S/E/W-Angaben
- Widget-/PNG-Generator speichert die letzte Konfiguration; der angezeigte Ortsname kann je Standort manuell angepasst werden

## Funktionen

- aktuelles Wetter einschließlich gefühlter Temperatur und Bewölkung in Achteln (n/8)
- Abgleich mit geeigneten amtlichen und optionalen hyperlokalen Messstationen
- kompakte 7-Tage-Übersicht mit gewichtetem Tagescharakter, Tmin/Tmax, Wind, Böen, Niederschlag und Hazards
- interaktive stündliche Detailansicht mit auswählbarer Stunde
- 14-Tage-Ensembleübersicht mit Best Match, P10–P90, ENS-Mittel, Konsistenz und Klimamittel
- amtliche Warnungen: Deutschland über DWD, international über CAP/MeteoAlarm beziehungsweise NWS
- OpenStreetMap-Karte mit DWD-/RainViewer-Radar
- Luftqualität, Dark Mode und Widget-/PNG-Export
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

Unter **Settings → Pages → Source** muss **GitHub Actions** ausgewählt sein. Der Workflow in `.github/workflows/deploy.yml` baut den Branch `main`.

Die öffentliche Worker-Adresse wird in GitHub unter **Settings → Secrets and variables → Actions → Variables** hinterlegt:

```text
VITE_METAR_PROXY_URL=https://DEIN-WORKER.workers.dev/
```

Eine separate Warnungsadresse ist nicht nötig. Optional kann dieselbe Adresse zusätzlich als `VITE_ALERT_PROXY_URL` gesetzt werden.

Die zusätzlichen UI-Funktionen der MID-Version 0.7.2 benötigen keine weitere Änderung des Worker-Codes; der mitgelieferte Worker v0.7.1 enthält weiterhin alle bisherigen Korrekturen für GeoSphere/TAWES und Stationsdaten.

### Automatische Versionsprüfung

MID lädt beim Start `version.json` mit `cache: no-store`. Ist dort eine höhere Version als die im JavaScript-Build enthaltene Version eingetragen, erscheint der Hinweis **„MID wurde aktualisiert – jetzt neu laden“**. Nutzer können die neue Version sofort laden oder die automatische Neuladung künftiger Updates aktivieren. Die Prüfung wird außerdem beim Zurückkehren aus dem Hintergrund, über `pageshow` und in regelmäßigen Abständen wiederholt.

## Ein gemeinsamer Cloudflare Worker

MID benötigt weiterhin nur **einen** Cloudflare Worker. `worker/metar-proxy.js` übernimmt:

- weltweite NOAA-AviationWeather-METAR-Daten
- österreichische GeoSphere-TAWES-Stationsdaten
- optionale hyperlokale Beobachtungsnetze
- deutsche DWD-Warnungen
- europäische MeteoAlarm-/CAP-Warnungen
- NWS-Warnungen für die USA

Nach einer Aktualisierung von `worker/metar-proxy.js` muss der Code im vorhandenen Cloudflare Worker ersetzt und erneut mit **Deploy** bereitgestellt werden.

Gesundheitstest:

```text
https://DEIN-WORKER.workers.dev/?mode=health
```

Die Antwort nennt Version und aktivierte optionale Anbieter, ohne Zugangsdaten offenzulegen.

## Aktuelle Stationsdaten und hyperlokale Netze

MID nutzt je nach Standort und Konfiguration folgende Quellen:

- **NOAA AviationWeather:** weltweite METAR-/Flugplatzbeobachtungen
- **Bright Sky/DWD-WMO:** zusätzliche amtliche Beobachtungen in Deutschland
- **GeoSphere Austria/TAWES:** aktuelle österreichische Stationsdaten
- **Weather Underground / The Weather Company:** optionale PWS-Daten mit berechtigtem API-Schlüssel
- **Netatmo:** optional öffentlich freigegebene Außenmodule über die offizielle API
- **Synoptic Data:** optional Stationen aus Mesonet-/MesoWest-/MADIS-nahen Netzen einschließlich API-QC
- **Xweather Observations:** optional globale Stations- und PWS-Beobachtungen mit QC-/Vertrauenswerten

Es werden keine Anbieter-Webseiten gescrapt. Geschützte Quellen werden ausschließlich über offizielle APIs und nur mit selbst hinterlegten, dafür berechtigten Zugangsdaten abgefragt.

### Robustes lokales Stationsmittel

Der Worker liefert die verfügbaren Einzelstationen an MID. MID bewertet diese anschließend anhand von:

- Entfernung zum Zielort
- Höhendifferenz, in Bergregionen mit strengeren Grenzen
- Alter der Messung
- Anbieter- und QC-Qualität
- Anzahl der zugrunde liegenden Stationen

Ausreißer werden je Messgröße über Median und robuste Abweichungsgrenzen entfernt. Erst danach entsteht ein gewichtetes Mittel für Temperatur, Feuchte, Taupunkt, Druck, Wind und – soweit vorhanden – Niederschlag. Die Windrichtung wird zirkulär gemittelt, damit beispielsweise 359° und 1° korrekt als Nord und nicht als Süd behandelt werden.

Sind zu wenige geeignete Stationen vorhanden, verwendet MID die bestgeeignete Einzelstation. Sind keine ausreichend aktuellen Messwerte verfügbar, bleibt Open-Meteo Best Match der Fallback.

### Optionale Cloudflare-Secrets

Alle folgenden Werte gehören in **Cloudflare → Worker → Settings → Variables and Secrets** und niemals in öffentliche `VITE_*`-Variablen:

```text
WEATHER_COM_API_KEY       # alternativ WU_API_KEY
NETATMO_ACCESS_TOKEN
SYNOPTIC_TOKEN
XWEATHER_CLIENT_ID
XWEATHER_CLIENT_SECRET
```

Ohne diese Secrets funktionieren METAR, Bright Sky/DWD und GeoSphere weiterhin. Die optionalen Netze werden dann einfach übersprungen.

**Netatmo-Hinweis:** Der aktuelle Worker akzeptiert einen gültigen OAuth-Access-Token. Netatmo-Access-Tokens sind nicht als dauerhaftes statisches Secret gedacht und müssen entsprechend dem OAuth-Verfahren erneuert werden. MID speichert oder erschleicht keine Zugangsdaten und greift nur auf öffentlich freigegebene Außenmessungen zu.

Stationsdiagnose, beispielsweise für Cagliari:

```text
https://DEIN-WORKER.workers.dev/?lat=39.2238&lon=9.1217&radius_km=140
```

Unter `diagnostics.sourceRows` ist sichtbar, welche Quellen Treffer geliefert haben. `providers` zeigt, welche optionalen Zugänge im Worker aktiviert sind.

## 14-Tage-Diagramm und Klimamittel

Im Diagramm **Temperaturtrend und Prognoseunsicherheit** sind folgende Darstellungen enthalten:

- Best-Match-Tmin und -Tmax
- gewichtete P10–P90-Spannen der Ensemblemodelle
- ENS-Mittel für Tmin und Tmax
- klimatologisches Mittel für Tmin und Tmax

Die Legendenpunkte sind Schaltflächen. Best Match, ENS-Spannen, ENS-Mittel und Klimamittel lassen sich einzeln ein- oder ausblenden; die Auswahl wird lokal gespeichert. Die Y-Achse berücksichtigt die sichtbaren Reihen.

Das Klimamittel wird standort- und höhenbezogen aus Open-Meteo ERA5-Land für die Referenzperiode **1991–2020** berechnet. Verwendet werden die Mittel der täglichen Höchst- und Tiefsttemperatur für den jeweiligen Kalendertag. Die auf 366 Kalendertage verdichteten Ergebnisse werden lokal für 180 Tage zwischengespeichert. Es handelt sich um Reanalyse-Klimatologie mit ungefähr 0,1° Rasterweite, nicht um ein Mittel einer einzelnen Ortsstation.

## Amtliche Wetterwarnungen

- **Deutschland:** DWD-WFS auf Gemeindeebene, DWD-CAP als Rückfallquelle
- **Europa:** MeteoAlarm-Atom-/CAP-Feeds der nationalen Wetterdienste
- **USA:** NOAA/National Weather Service Active Alerts

MID zeigt zunächst nur die Überschriften. Der vollständige Meldungstext und vorhandene Handlungshinweise öffnen sich per Klick.

Warnungstest für Niederkassel:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=50.82&lon=7.04&country=DE&name=Niederkassel&region=Nordrhein-Westfalen&language=de
```

Warnungstest für Cagliari:

```text
https://DEIN-WORKER.workers.dev/?mode=alerts&lat=39.2238&lon=9.1217&country=IT&name=Cagliari&region=Sardegna&language=de
```

Eine leere Liste `"alerts": []` kann korrekt sein, wenn aktuell keine standortbezogene amtliche Warnung aktiv ist. Fehler werden getrennt ausgewiesen.

## Datenquellen

- Open-Meteo: Best Match, Ensemblemodelle, Geocoding, Luftqualität und ERA5-Land-Historie
- Deutscher Wetterdienst: Warnungen, Radar/Nowcast und über Bright Sky zugängliche DWD-/WMO-Beobachtungen
- GeoSphere Austria: TAWES-Beobachtungen
- NOAA AviationWeather: METAR
- MeteoAlarm und nationale Wetterdienste: internationale CAP-Warnungen
- NOAA/NWS: US-Warnungen
- optional The Weather Company/Weather Underground, Netatmo, Synoptic Data und Xweather
- RainViewer: Radar außerhalb der DWD-Abdeckung
- OpenStreetMap: Kartenbasis
- BigDataCloud: Reverse-Geocoding-Fallback

## Lizenz- und Nutzungshinweise

Die jeweiligen Nutzungsbedingungen, Abruflimits und Lizenzanforderungen der Datenanbieter gelten zusätzlich. MID enthält keine API-Zugangsdaten. Für kommerzielle oder öffentliche Bereitstellungen müssen Betreiber selbst prüfen, ob ihre Tarife und Lizenzen die konkrete Nutzung und Weitergabe erlauben.

## Versionsschema

- Patch (`0.x.y`): gezielte Korrekturen und kleinere Verbesserungen
- Minor (`0.x.0`): neue wesentliche Funktion oder größere Daten-/UI-Architektur
- Major (`1.0.0`): stabiler, dokumentierter Funktionsumfang

v0.7.7 ergänzt im Tagesdetail dezente Nachtflächen sowie Sonnenauf- und Sonnenuntergangszeiten. v0.7.6 korrigierte die Datumsdarstellung und präzisierte die Tag-/Nachtlogik der Bewölkungsbalken. v0.7.5 ergänzte kompakte Modellstand-Informationen mit Init- und Verfügbarkeitszeiten, ohne die Ansichten im geschlossenen Zustand merklich zu vergrößern.


## Ortszeit und POI-Suche (v0.7.8)
- Vorhersage-, Radar-, Warnungs- und Widgetzeiten werden in der vom Forecast zurückgegebenen IANA-Zeitzone des gewählten Orts dargestellt.
- Die automatische Stundenwahl nutzt den tatsächlichen Zeitpunkt des Standorts statt der Geräte- oder UTC-Zeit.
- Sonnenaufgang, Sonnenuntergang, Tageswechsel und Datumsbeschriftungen bleiben auch bei entfernten Orten konsistent.
- Die Ortssuche kombiniert Open-Meteo-Orte/PLZ mit OpenStreetMap-POIs über Photon, darunter Berggipfel, Hotels, Hütten, Sehenswürdigkeiten, Gastronomie und weitere benannte Objekte.

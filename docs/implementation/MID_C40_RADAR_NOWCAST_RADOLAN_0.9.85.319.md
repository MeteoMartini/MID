# MID v0.9.85.319 · Radar-Nowcast-Intensität und RADOLAN-ODIM-H5

## Verifizierte Ausgangsbasis

Stand 24.10.2026: `main=mid-stable=1835fd4fda68916620f2518dbbab7d1b379bfb3c`, freigegebenes MID `v0.9.85.318`. PR #452 wurde gemergt; die unabhängigen Drafts #449 (Vollgebiet), #433 (ECMWF) und #425 (RUC-Canary) bleiben unberührt. Änderungsbranch `chatgpt/v0.9.85.319-radar-nowcast-radolan-odim`.

## Nutzerwunsch Aktuell → Radar-Nowcast

- Intensität wird ausschließlich aus den Standort-Raten **mm/h** kategorisiert: **leicht** bis einschließlich 0,5 mm/h, **mäßig** über 0,5 bis einschließlich 4 mm/h, **stark** über 4 mm/h (identisch mit dem bestehenden appweiten `precipitationIntensityDescriptor('rain', …)`-Vertrag). Farbtöne: Blau, Grün, Orange. Meteorologische Visualisierung, **keine DWD-Warnstufe** und keine implizite Warnung.
- Unsicherheit ist **orthogonal** zur Rate: Bei Prognosebalken mit tatsächlich gelieferten unkalibrierten `hitProbability`-Szenarioanteilen werden unter 35 %, 35–69 % und ab 70 % zunehmend durchgehende/dichtere Farbflächen verwendet. Unbekannte Werte zeigen immer Schraffur, **niemals** fiktive 0 %/100 %. Bestehende Beobachtungen bleiben solide; erwartete Treffer und Umfeld-Echos werden sichtbar geschraffiert. Fehlende Zeit-/Rasterwerte bleiben grau, werden nicht als trocken dargestellt.
- In Legende und zugänglicher Zeitscrubber-Beschreibung steht explizit „Szenarioanteil (unkalibriert)“. Das ist keine extern kalibrierte Eintrittswahrscheinlichkeit, wird nicht in amtliche Warnungen übertragen, und hat keinerlei Einfluss auf Regenmengen, Radar-Rohwerte oder Prognosefusion.
- Zielgeräte: kleine/große Smartphones, Tablet hoch/quer, Desktop, Light/Dark, Fokus und mindestens 44px Touchbedienung des vorhandenen Scrubbers. Neue Balken sind **keine** eigenständigen Buttons und bleiben nicht mit eigenen vergrößerten Hitboxes überlagert.

## Root-Cause: RADOLAN-Summen in Karten fehlen

**Harte Live-Log-Evidenz:** Erfolgreicher MID-DWD-RUC-Preprocess-Lauf 40061926315, Job 120777106167, meldete am 24.10.2026 04:33 UTC: `RADOLAN sums unavailable: no fresh aligned RW hour`. Der RW-Builder suchte ausschließlich `raa01-rw_10000-*-dwd---bin.bz2` auf **900×900 sphärischem** RADOLAN-Grid. Das aktuelle DWD Open-Data-Verzeichnis listet die **ODIM-H5 RW-Dateien**, einschließlich einer neuen **1200×1100 ellipsoidisch-georeferenzierten** Gitterdefinition. Die alte Regex fand daher kein kompatibles, aktuelles stündliches Produkt. Der RUC-Preparer entfernt optional fehlende Summendaten gezielt statt veraltete Daten als gültig auszugeben; deshalb wird `observedPrecipitation` in `latest.json` nicht veröffentlicht und die Karte bleibt ohne verifiziertes RW-Raster.

Quellen (extern, unabhängig):
- DWD Open Data RW Verzeichnis: https://opendata.dwd.de/weather/radar/radolan/rw/
- wradlib RADOLAN-Guide ODIM-H5 und RW Raster: https://docs.wradlib.org/projects/radolan/en/latest/notebooks/odim.html
- DWD Formatdokumentation: https://www.dwd.de/DE/leistungen/opendata/hilfe.html

## Präzise neue Datenverarbeitung

- ODIM-H5 wird aus DWD-Dateibytes in **CI** mit h5py gelesen; WGS84-polarstereographische 1-km-Raster werden über pyproj auf das vorhandene 0,04°-Darstellungsgitter abgebildet. Die Referenzzellzentren der veröffentlichten RW-ODIM-Beispielgeometrie werden kontrolliert; Gridgröße, Projektion, Skalen, Produktkennung **ACRR**, DWD-Dateiname und 60-min-Endzeit müssen vor Benutzung zusammenpassen. Der ältere binäre RW-Decoder bleibt für tatsächlich angebotene `.bz2`-Files separat verfügbar; die zwei Rastergeometrien werden niemals vermischt.
- Weiterhin nur Zeitstempel auf **hh:50**, genau 60 Minuten pro RW-Produkt; 1/6/12/24/48-h-Summen ausschließlich über lückenlos vollständige, nicht überlappende Stunden. Fehlt ein Quellzeitraum, bleibt die entsprechende Summenoption **unverfügbar**. Kein Missing→0, keine Glättung/Kappung extremer Messwerte; gültige `undetect`-Kennung = trocken, NoData bleibt -1 im quantisierten Ausgaberaster. Quelle, Zeit, Original-URLs und SHA256 bleiben rückverfolgbar.
- Neue Bibliotheken h5py und pyproj ausschließlich in der Python-CI-Dependencyliste; kein Import in Browser, iOS oder Cloudflare Worker. Der bestehende RUC-Workflow, die optionalen Produkt-/Budget-/Pages-/Worker-Gates bleiben unverändert.
- Synthetischer Offline-HDF5-Test `tools/ruc/test_observed_precipitation_odim.py` hängt am bestehenden verbindlichen `tools/ruc/test_prepare_ruc_pages.py`-Preflight. Zusätzlicher JS-Test `scripts/test-radar-intensity-scenario-0985319.mjs` kontrolliert Schwellen, Null/fehlende Wahrscheinlichkeit, alle fünf Zustände und die semantische Quellenanzeige.

## Release-Gates / noch nicht als bestanden behaupten

Der vollständige Source-PR-Gate muss die .319-Versionen/Changelogs, 1000+ Regressionen, Responsive/Browser, Python-Preflight einschließlich ODIM, PWA-/Bundle-/Security und Worker-Integrität belegen. Danach nur MID-Bot SHA-gebunden → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/RUC-Health und Stable-Promotion. Insbesondere die Pages-Free-Laufzeit-/Speicherbudgetgrenzen (bei der Rohprofile-Prognose zuletzt nahe 900 MB) müssen unter realen ODIM-Quellen nachgewiesen werden: bei Überschreitung keine stillschweigende Verdrängung vorhandener Produkte. Keine reale iOS-/VoiceOver-Abnahme ohne tatsächliches Gerät. Nicht grün ohne explizite Evidenz.

# MID-C22 · Synoptik-Komposit .202

Ausgangsbasis: main = mid-stable `f654bd172a7afc43f307f6dd0663e9ce00b625cb`, veröffentlichte .201. Keine Übernahme eines älteren Replit-Stands. Reversible Erweiterung auf der Codex-Integrationsbranch; regulärer Source-/Installer-/Pages-/Stable-Pfad.

## Anforderungen und Umsetzung

- I: Der vorhandene native Europa-Ausschnitt reicht bis 29,5–70,5° N und −23,5–62,5° E. Echte Modellgrenzen gelten weiterhin; ICON-D2 wird nicht künstlich erweitert. ICON-EU nutzt das native reguläre Raster, für die Übersicht auf 0,125° abgetastet; GFS/IFS 0,25°. Keine Auffüllung außerhalb der Modellabdeckung.
- II: Vorhandene diskrete Theta-E-Farbstufen im Abstand 6 °C, Konturen in neutralem Grau (#666666), dünn und transparent; dezente Labels (#4c4c4c) nur bei Vielfachen von 12 °C. Dieselbe Darstellung für Komposit und eigenständiges Theta-E.
- III: RH700 enthält ausschließlich die 60-%-Linie gestrichelt und 80-%-Linie durchgezogen. Kein Symbol-/Label-Layer und keine Hoverbeschriftung.
- IV: Bisher 13 vollständige Termine bis +48 h. Optional +60/+72 h für ICON-EU/GFS/IFS, maximal 15 Termine; ICON-D2 maximal 13 bis +48 h. Zusatzstunden werden einzeln mit streng gleichem Run ohne älteren Zyklus-Fallback dekodiert. Fehlende Zusatzstunden lassen die neun verbindlichen Kerntermine unangetastet. Mehrtagesschritte werden unter dem unveränderten 900-MB-Pages-Budget vor optionaler Verdichtung geschützt; bei Bedarf können auch sie entfallen. Ausgabe und Auswahl umfassen ausschließlich tatsächlich veröffentlichte, SHA-geprüfte Felder.
- V: Gemeinsamer RadarPanel-Kartenrahmen fokussierbar, ArrowLeft/ArrowRight wechseln echte Termine und stoppen Wiedergabe/Live-Follow. Begrenzung am Anfang/Ende. Eingabefelder, Regler, editierbare Inhalte und modifizierte Tastenkombinationen sind ausgenommen. Capture verhindert gleichzeitiges Kartenverschieben. Keine globale Tastaturübernahme außerhalb der Karte.

## Aufwand und Quellen

Nur zwei zusätzliche Felder je geeignetem Modell, keine Erweiterung von Pflichtstunden, Budget oder Worker-Dekodierung. Der Modellzyklus-Cache bleibt erhalten. Alle sieben Komponenten müssen verfügbar und fachlich validiert sein; IFS-Feuchte weiterhin aus T/q mit geprüftem Druckniveau. Herkunftshashes bleiben im Katalog.

Offizielle Dokumentation: DWD ICON-Datenbankbeschreibung https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon/icon_dbbeschr_aktuell.pdf und ICON-D2 https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf; ECMWF Open Data https://www.ecmwf.int/en/forecasts/datasets/open-data; NOAA GFS https://nomads.ncep.noaa.gov/. Die reale Verfügbarkeit wird pro Feld im Preprocessing geprüft.

## Prüfung

Python: echte GRIB-Identität, vollständiger Europa-Ausschnitt, unabhängige Theta-E-Referenzen, gleiche Komponenten/Masken, optionaler Horizont ohne Kernverlust und Budgetpriorisierung. JS: SHA-gebundener 15-Termine-Katalog, Pflichttermine, Duplikate und falsche Termine. Browser: reale MapLibre-Layer und Tastaturbedienung zusätzlich zur bestehenden vollständigen Geräte-/Theme-/Designmatrix. Vollständige Releasegates erforderlich.

RUC-Recovery .201 wird parallel beobachtet. Eine neue Veröffentlichung wird erst nach Prüfung des laufenden RUC-Nachholens angestoßen, damit der Stable-Wechsel keinen erneut vorbereiteten Datenstand überholt.

## Verifizierte Ergebnisse vor Source-PR

- 941/941 Core-Regressionen, Typprüfung und Produktionsbuild bestanden; 9/9 Python-Synoptiktests. Produktionsaudit: 0 Schwachstellen.
- 24/24 reale MapLibre-Fälle bestanden: 320/390/412/844/1024/1440 px, hell/dunkel und Next/Classic. In jedem Fall geprüft: echte +72-h-Datei, unveränderte native Reglerbedienung, Anfangs-/Endbegrenzung, graue Theta-E-Konturen und fehlender RH700-Symbol-Layer.
- RUC .201 Run 37762730007 vollständig erfolgreich. 09-UTC-Lauf veröffentlicht; Health um 10:37 UTC ready=true, fresh=true. Vorhersage-Fusion Niederkassel 50,82/7,04 mit refresh=1: icon_d2_ruc und icon_d2_ruc_eps successful=true und usedInCanonical=true; rucAppliedHours=13, rucEpsAppliedHours=13, 20 EPS-Mitglieder, 25 rapidMinutes15.
- Datenaufbereitung: 897623153/900000000 Bytes, 1178 Objekte, alle vier Modelle 13 vollständige Synoptiktermine. Optionale Solar-/Zustands-Rapidprodukte werden budgetbedingt nicht als vorhanden behauptet.
- Live-Synoptik nach Veröffentlichung: Algorithmus bolton-1980-lcl-v3-europe, ICON-EU 06 UTC, 13 Termine. Dekodierte erste SHA-gebundene Datei: 329 × 689 Punkte, 29,5–70,5° N / −23,5–62,5° E. Damit ist der große Europa-Ausschnitt tatsächlich veröffentlicht.

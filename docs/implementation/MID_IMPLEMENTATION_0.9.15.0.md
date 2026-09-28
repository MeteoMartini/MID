# MID v0.9.15.0 – Kurzfrist-Plausibilität, Stundenübersicht und Gewitterinformationen

## Ausgangsbasis

- Verbindliche Codebasis: `MeteoMartini/MID`, Branch `mid-stable`
- Verifizierter Ausgangsstand: v0.9.14.5
- Neue Version nach automatischer Umfangsbewertung: v0.9.15.0

## 1. Bereinigte Release-Historie

Die nutzerseitige Historie wurde um frühere Ankündigungen großer Funktionen bereinigt, die später vollständig entfernt oder stillgelegt wurden. Das betrifft insbesondere aktive Synoptik-, Routenwetter- und Cross-Section-Ankündigungen. Explizite Stilllegungshinweise bleiben als Statusinformation erhalten. Der externe Wetterstationsanbieter „Synoptic Data“ ist davon nicht betroffen.

## 2. Kurzfristige Temperatur-Plausibilisierung

Die kurzfristige Vorhersage prüft die ersten drei Stunden auf isolierte Temperatur- und Gefühlstemperatur-Ausreißer. Eine Korrektur erfolgt nur, wenn:

- der Wert ein lokales Einzelmaximum oder Einzelminimum zwischen zwei zeitlich nahen Nachbarwerten bildet,
- die Abweichung von der linearen Nachbarentwicklung mindestens 0,65 °C und höchstens 4 °C beträgt,
- die Nachbarabstände höchstens 75 Minuten betragen,
- kein plausibler meteorologischer Auslöser wie Niederschlag, Gewitter, markante Böen oder ein starker Bewölkungssprung vorliegt.

Der korrigierte Wert wird zeitlich interpoliert. Die Differenz zwischen Luft- und Gefühlstemperatur bleibt erhalten. In der Detailansicht erscheint die Kennzeichnung „Verlauf plausibilisiert“.

## 3. 7-Tage-Stundenübersicht

- Beim Öffnen eines Tages wird die aktuelle Ortsstunde beziehungsweise der nächstgelegene verfügbare Zeitschritt ausgewählt.
- Das 3-Stunden-Raster zeigt alle Zeitschritte des Tages.
- Das 1-Stunden-Raster zeigt zunächst sieben Stunden zentriert um den ausgewählten Zeitschritt.
- „Mehr anzeigen“ öffnet im 1-Stunden-Raster den vollständigen Tag; „Weniger anzeigen“ stellt das kompakte Zeitfenster wieder her.
- Der Wettertext steht nicht mehr dauerhaft in jeder Zeile. Er ist als Hover-, Fokus- und nativer Titeltext am vergrößerten Piktogramm verfügbar.
- Die Temperaturfelder verwenden eine kontinuierliche, ECMWF-orientierte 2-m-Temperaturfarbskala von Blau über helle und gelbe Töne bis Orange und Rot. Die Schriftfarbe passt sich dem Kontrast an.
- Die Stundenzeilen sind per Maus, Touch und Tastatur auswählbar.

## 4. Gewitterinformationen

Die Informationshierarchie orientiert sich an der kompakten Stormtracker-Darstellung: unmittelbare Auswirkungen und Zellbewegung stehen direkt in der Kachel, Profidaten werden gruppiert hinter dem Info-Button dargestellt.

### Direkt in der Kachel

Je nach Datenlage:

- Zellposition und Abstand zum Bezugsort
- Blitzaktivität je fünf Minuten
- Zugrichtung und Zuggeschwindigkeit
- Entwicklungstrend
- Starkregensignal und produktseitige Niederschlagsmenge
- Hagelsignal beziehungsweise radarbasierte Hagelgröße
- Böensignal beziehungsweise produktseitige Windangabe
- Echo-Top und Zellfläche
- DWD-Mesozyklonenerkennung mit Stufe 1 bis 5

### Hinter dem Info-Button

Die Daten sind in folgende Gruppen gegliedert:

1. Zugbahn & Standort
2. Radar & Zelle
3. Gefahrenmerkmale
4. Mesozyklone, sofern erkannt
5. Atmosphäre (NWP), sofern verfügbar
6. Quelle & Aktualität

Für KONRAD3D/HYMEC werden unter anderem Reflektivität, Echoober- und -unterkante, VIL, VIL-Dichte, Zellfläche, Erkennungszahl, Blitzaktivität, Starkregen, Hagel und Böen ausgewertet.

Zusätzlich liest der Worker das amtliche DWD-MCD-Ereignisschema aus `event` und `nowcast-parameters`. Verfügbar sind insbesondere:

- Mesozyklonenintensität 1–5
- Basis, Oberkante und Tiefe der Rotationssäule
- Durchmesser und äquivalenter Durchmesser
- MCD-Echo-Top und MCD-VIL
- mittlere und maximale Reflektivität
- mittlere und maximale Scherung
- mittlerer und maximaler Impulsparameter
- Zahl der Schervektoren und Merkmale
- maximale Geschwindigkeit sowie maximale, mittlere und bodennahe Rotationsgeschwindigkeit
- Verlagerungsgeschwindigkeit und Orientierung
- Abstand zwischen MCD-Erkennung und zugeordneter KONRAD3D-Zelle

Eine Tornadowahrscheinlichkeit wird nur angezeigt, wenn sie als direktes Feld im gelieferten Produkt enthalten ist. MID berechnet oder erfindet keine Prozentzahl. Unplausible Höhenbereiche, etwa identische Unter- und Obergrenzen, werden ausdrücklich als nicht belastbar gekennzeichnet.

## 5. Regression und Prüfung

- neuer Releasevertrag `test-mid-09150-shortterm-hourly-thunder-changelog.mjs`
- funktionaler Test des amtlichen DWD-MCD-XML-Schemas
- Worker- und Service-Worker-Syntaxprüfung
- TypeScript-/TSX-Parserprüfung aller Quelldateien
- vollständige automatische MID-Regressionssuite
- Versionssynchronisierung für Paket, Lockfile, Baseline, Frontend, Worker, Service Worker und HTML-Metadaten

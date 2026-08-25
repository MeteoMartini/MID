# MID 0.9.66.0 – Extremwetter-Ausblick DACH

## Ziel und fachliche Einordnung

MID erhält einen eigenständigen probabilistischen Extremwetter-Ausblick für Deutschland, Österreich und die Schweiz. Er ist eine eigene automatisierte MID-Prognose und ausdrücklich keine amtliche Warnung. Der Bereich steht deshalb direkt nach dem bestehenden Warnmodul; amtliche Meldungen von DWD, GeoSphere Austria und MeteoSchweiz werden weder ersetzt noch mit der Modellfläche vermischt.

Der Ausblick ist regional und für die schnelle Lageerfassung ausgelegt. Das DACH-Ausgaberaster liegt je nach Breite bei etwa 55 bis 90 km. Es darf nicht als gemeinde- oder straßengenaue Warnung interpretiert werden.

## Oberfläche

- neuer Dashboard-Bereich `extreme-outlook`, standardmäßig aktiv und über `mid:module:extreme-outlook:open` persistent;
- verzögertes Laden über `ViewportGate` und `Suspense`;
- Gefahrenfilter: Gesamt, Gewitter, Stark-/Dauerregen, Sturm, Schnee, Glätte/Eisregen;
- Gültigkeitsfenster: 0–6 h, +6–12 h, +12–24 h und +24–48 h;
- MapLibre-Flächen nach Intensität I1–I4, Wahrscheinlichkeitswerte auf der Karte und Textliste der stärksten Regionen;
- Detailkarte mit Modellparametern, Treibern und möglichen Teilgefahren;
- vollständige Textlegenden, Schwellentabellen, Standard-/Profiinformation, Lade-, Fehler- und Stale-Zustand;
- responsive Einspaltenansicht für schmale Geräte.

## Wahrscheinlichkeit

| Klasse | Bereich |
|---|---:|
| P0 | unter 10 % |
| P1 | 10–29 % |
| P2 | 30–59 % |
| P3 | 60–79 % |
| P4 | ab 80 % |

Die Gesamtansicht zeigt Signale ab 40 %, die einzelne Gefahrenansicht ab 10 %. Ein Signal der höchsten Wirkungsstufe I4 wird aus Vorsorge bereits ab 5 % angezeigt. Wahrscheinlichkeiten werden auf 5 Prozentpunkte gerundet.

Die Überschreitungswahrscheinlichkeit wird aus Mittelwert und Streuung des 20-gliedrigen ICON-D2-EPS abgeleitet. Zeitlich benachbarte Modellstunden werden konservativ als korreliert behandelt; dadurch wird die Wahrscheinlichkeit eines Ereignisses innerhalb eines Zeitfensters nicht wie bei unabhängigen Stunden überhöht.

## Intensitätsschwellen

### Stark- und Dauerregen

Mindestens eines der Zeitfenster muss erreicht werden.

| Stufe | 1 h | 6 h | 24 h |
|---|---:|---:|---:|
| I1 markant | 15 mm | 20 mm | 40 mm |
| I2 stark | 25 mm | 35 mm | 60 mm |
| I3 schwer | 40 mm | 60 mm | 90 mm |
| I4 extrem | 60 mm | 90 mm | 140 mm |

### Sturm/Böen

| Stufe | Tiefland | Mittelgebirge | Hochlagen |
|---|---:|---:|---:|
| I1 markant | 70 km/h | 80 km/h | 90 km/h |
| I2 stark | 90 km/h | 100 km/h | 110 km/h |
| I3 schwer | 110 km/h | 125 km/h | 140 km/h |
| I4 extrem | 140 km/h | 155 km/h | 170 km/h |

Die Oberfläche formatiert diese Werte mit der appweit gewählten Windeinheit und zeigt km/h nur als gemeinsame fachliche Referenz.

### Neuschnee im Tiefland

| Stufe | 6 h | 24 h |
|---|---:|---:|
| I1 markant | 5 cm | 10 cm |
| I2 stark | 10 cm | 20 cm |
| I3 schwer | 20 cm | 35 cm |
| I4 extrem | 30 cm | 50 cm |

Für Mittelgebirge gilt der Faktor 1,5, für Hochlagen der Faktor 2. Damit wird ein gewöhnliches alpines Schneefallereignis nicht allein aufgrund der Höhe als Extremereignis markiert.

### Eisregen/Glatteis

| Stufe | Glatteisäquivalent | Zusatzkriterium |
|---|---:|---|
| I1 markant | ab 0,1 mm | – |
| I2 stark | ab 0,5 mm | – |
| I3 schwer | ab 2 mm | alternativ mindestens 3 h deutliche Phasenwahrscheinlichkeit |
| I4 extrem | ab 5 mm | – |

Die Phase wird aus Niederschlagsverteilung, Temperatur-/Feuchttemperaturverteilung, ICON-D2-Wettercode und Dauer abgeleitet. Das Glatteisäquivalent ist ein Wirkungsindikator, keine gemessene Eisdicke.

### Gewitter, Hagel und konvektive Böen

| Stufe | CAPE-Referenz | 850–500-hPa-Gradient | Scherungsreferenz | Hagel-Umfeldklasse |
|---|---:|---:|---:|---:|
| I1 markant | 400 J/kg | 5,5 K/km | 5 m/s | 1 bis <2 cm |
| I2 stark | 800 J/kg | 6,0 K/km | 10 m/s | 2 bis <5 cm |
| I3 schwer | 1.500 J/kg | 6,5 K/km | 15 m/s | 5 bis <10 cm |
| I4 extrem | 2.500 J/kg | 7,0 K/km | 22 m/s | ab 10 cm |

Diese Werte sind keine Einzelparameter-Auslöser. Die Wahrscheinlichkeit wird aus dem gemeinsamen Umfeldsignal von CAPE und CIN, 850–500-hPa-Temperaturgradient, 700-hPa-Feuchte, vektorieller 850–500-hPa-Scherung, deterministischem Aufwind und Lightning Potential, Niederschlag sowie Gefrierhöhe gebildet. Hagelgröße ist eine Umwelt-/Wirkungsklasse und keine direkte Korngrößenprognose. Starkregen- und Downburstpotenzial werden separat als Teilgefahren ausgewiesen.

## Daten- und Einheitenvertrag

- Ensemble: DWD ICON-D2-EPS, 20 Mitglieder, etwa 2 km, über den Ensemble-Mittel-/Streuungsdatensatz;
- Diagnostik: deterministisches DWD ICON-D2 für Druckflächen, Aufwind, LPI, Feuchttemperatur, Niederschlagsart und Gefrierhöhe;
- technischer Abruf über die dokumentierten Open-Meteo-Endpunkte [Ensemble API](https://open-meteo.com/en/docs/ensemble-api) und [DWD ICON API](https://open-meteo.com/en/docs/dwd-api);
- Wind wird ausschließlich über den zentralen MID-Formatter in `kn/kt`, `km/h`, `m/s` oder `mph` ausgegeben;
- Niederschlag bleibt appweit in mm, Schnee in cm, Temperatur in °C und Höhe in m;
- alle Gültigkeits-, Modelllauf- und Aktualisierungszeiten verwenden `formatDisplayDateTime` und damit die globale Lokal-/Z-Zeit-Einstellung.

## Worker und Cache

Der Worker-Modus lautet `dach-extreme-outlook`. Er bündelt das DACH-Gitter in kleine Mehrpunktabfragen, cached ein erfolgreiches Ergebnis zehn Minuten und darf bei einem vorübergehenden Upstreamfehler einen höchstens zwei Stunden alten, klar als stale markierten Ausblick liefern. Die App besitzt zusätzlich den normalen abortierbaren Worker-Clientcache. Es werden keine KV-Schreibvorgänge erzeugt.

## Grenzen

- Das Regionalraster glättet kleinräumige Ereignisse und ersetzt keinen Nowcast.
- EPS-Mittel und -Streuung liefern eine kalibrierte Wahrscheinlichkeitsnäherung, keine direkte Zählung aller Member je Kartenpixel.
- Komplexes Alpenrelief kann auf dem Ausgaberaster nur über Höhenklassen berücksichtigt werden.
- Beobachtungen und amtliche Warnentscheidungen können kurzfristig von der Modellprognose abweichen.

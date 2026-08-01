# MID v0.8.32.0 – Adaptive Prioritätsfusion

## Ziel

Die vier priorisierten Datenebenen werden nicht pauschal gemittelt. MID verwendet sie nur dann als Korrektur des sofort verfügbaren Best-Match-Forecasts, wenn mehrere unabhängige Modellfamilien hinreichend übereinstimmen. Dadurch soll die Prognosegenauigkeit messbar steigen, ohne die Erstreaktion oder Bedienbarkeit der App zu verschlechtern.

## Priorität 1 – Beobachtung, Nowcasting und regionale Hochauflösung

- DWD-/europäische Radar-Nowcasts werden im sehr kurzen Vorhersagebereich vor den Tagesmodellen berücksichtigt.
- KONRAD3D-/Gewitterinformationen können kurzfristig Niederschlagswahrscheinlichkeit und Wetterzustand anheben, wenn sich eine relevante Zelle nähert.
- Für Deutschland und angrenzende Regionen werden verfügbare hochauflösende Modellfamilien bevorzugt: ICON-D2/ICON-EU, KNMI HARMONIE, ICON-CH, AROME/ARPEGE, UKV und weitere regionale Modelle.
- Nowcast-Korrekturen sind zeitlich eng begrenzt und ersetzen keine längerfristige Modellprognose.

## Priorität 2 – ECMWF

- ECMWF IFS und AIFS werden als getrennte Modellfamilien eingebunden.
- Ihre Gewichtung steigt mit der Vorlaufzeit; im unmittelbaren Kurzfristbereich dominieren weiterhin Beobachtung und regionale Modelle.

## Priorität 3 – zusätzliche europäische Modellfamilien

- Weitere unabhängige europäische Modelle erweitern die Stichprobe und reduzieren die Abhängigkeit von einer einzelnen Modellkette.
- Anbieter- und Modellfamilien werden gedeckelt, damit mehrere eng verwandte Varianten die Fusion nicht künstlich dominieren.

## Priorität 4 – weltweite Rückfallebene

- NOAA GFS dient als globale, überall verfügbare Rückfallebene.
- In Mitteleuropa erhält GFS im Kurzfristbereich bewusst ein geringeres Gewicht als regionale Modelle und ECMWF.

## Robuste Fusionslogik

- Best Match bleibt der unmittelbar angezeigte und stets verfügbare Anker.
- Auswahl von maximal acht sinnvollen Quellen; höchstens drei Abrufe gleichzeitig.
- Vorlaufzeit-, Region- und Modellfamilien-abhängige Gewichtung.
- Gewichtete Mediane und robuste Mittelwerte statt ungeschützter arithmetischer Mittelung.
- Niederschlag wird logarithmisch stabilisiert, damit einzelne Ausreißer die Fusion nicht dominieren.
- Eine Korrektur wird nur angewendet, wenn mindestens drei unabhängige Modellfamilien beitragen und die Konsistenzschwelle erreicht ist.
- Harte Korrekturgrenzen schützen vor unrealistischen Sprüngen bei Temperatur, Niederschlag, Wahrscheinlichkeit, Wind, Böen und Sonnenscheindauer.
- Bei unzureichender Datenlage, Fehlern oder Zeitüberschreitung bleibt Best Match unverändert.

## Lernen und Verifikation

- Die Prioritätsfusion wird als eigener Prognosekandidat archiviert.
- Der bestehende Wetterzwilling kann dadurch lokal prüfen, ob die Fusion für Standort, Parameter und Vorlaufzeit tatsächlich besser war.
- Ein bereits qualifizierter Wetterzwilling behält Vorrang; die Fusion ergänzt ihn und liefert eine weitere verifizierbare Kandidatenquelle.

## Responsivität

- Der erste Wetterstand wird weiterhin sofort aus Best Match aufgebaut.
- Die Fusion startet verzögert in einer Idle-Phase und wird bei Standortwechsel abgebrochen.
- Es werden nur kompakte Tagesdaten abgerufen; hochfrequente Stundenwerte werden daraus konservativ abgeleitet.
- Lokaler Cache: frischer Stand 35 Minuten, Stale-Fallback bis acht Stunden.
- Worker-Cache: 20 Minuten mit Stale-While-Revalidate-Fenster.
- Nutzerinteraktion und `isInputPending` werden vor Hintergrundarbeit berücksichtigt.

## Bewusste Grenzen

- Ein signifikanter Genauigkeitsgewinn wird durch unabhängige Quellen, robuste Konsenslogik und laufende Verifikation angestrebt, kann aber nicht für jeden Ort, Parameter und Wettertag garantiert werden.
- Satelliteninformationen bleiben im visuellen Komposit verfügbar; eine direkte numerische MTG-Wolkenassimilation wurde in diesem Release bewusst nicht in den Browser verlagert, weil sie erheblich mehr Daten, Rechenzeit und Latenz verursachen würde.
- OPERA-/Radarinformationen fließen über die bestehende Kurzfrist-Nowcast-Schicht ein, soweit die operative Quelle für den Standort verfügbar ist.

## Betroffene Kernmodule

- `src/forecastFusion.ts`
- `src/App.tsx`
- `src/forecastVerification.ts`
- `src/weather.ts`
- `worker/metar-proxy.js`
- `scripts/test-priority-forecast-fusion-08320.mjs`

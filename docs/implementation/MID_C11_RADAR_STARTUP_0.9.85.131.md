# MID v0.9.85.131 · C11-Kartensteuerung und Radar-Nowcast-Startpfad

## Basis
- Stable vor Umsetzung: `0daf09160c8f9de514d3fbb3d78c03df275604d1` / v0.9.85.130.
- Replit-Handoff: `replit/v0.9.85.131-map-timeline-Handoff@37e726c7be865402f4ee348c8b732233e98430fb`, gegenüber Stable 3 Commits voraus, 0 zurück.
- Integrationszweig: `chatgpt/v0.9.85.131-c11-radar-startup-speed`.

## Befund
Die in der Radar-Nowcast-Grafik sichtbaren regelmäßigen Trockenlücken waren kein meteorologisch bestätigtes Signal. Der schnelle DWD-Pfad verwendete eine ausgedünnte Reihe von Kartenzeitschritten. Die UI verlängerte jeden vorhandenen Wert höchstens 15 Minuten und füllte anschließend nicht vorhandene 5-Minuten-Buckets mit 0. Bei ungefähr 20-minütigem Sampling entstand dadurch deterministisch das Muster „drei 5-Minuten-Balken, eine trockene Lücke“.

Der vollständige Pfad ergänzt dagegen alle fehlenden DWD-Zeitpunkte über exakte `GetFeatureInfo`-Punktwerte. Nur explizit trockene Werte aus dieser vollständigen 5-Minuten-Serie dürfen als Trockenphase erscheinen.

## Umsetzung
1. Radar-Preload startet früher.
2. Fast-Path vermeidet zusätzliche punktgenaue Abfragen pro grobem Rasterzeitschritt und nutzt die bereits geladene Rasterprobe für die schnelle Echoentscheidung.
3. Fast-Antworten erhalten einen kurzen, standortgebundenen Cache.
4. Solange nur die ausgedünnte Fast-Serie vorliegt, wird keine scheinbar vollständige 5-Minuten-Balkengrafik mit künstlichen Nullwerten gezeichnet.
5. Die Vollanalyse startet unmittelbar danach und lädt exakte DWD-Punktwerte in größeren parallelen Paketen.
6. Das bestehende Echo-Gate bleibt unverändert: ohne relevantes Standort- oder Umfeldecho keine Radar-Nowcast-Grafik.

## Fachliche Abgrenzung
- Keine Änderung an DWD-Datenquelle.
- Keine Änderung an saisonalen Echo-Schwellen.
- Keine Änderung an Standort-/Umfelddefinition.
- Keine Interpolation erfundener Niederschlagswerte.
- Fehlender Fast-Zeitschritt ist künftig ausdrücklich „noch nicht vollständig geladen“ und nicht „trocken“.

## Regression
`scripts/test-radar-startup-fastpath-0985131.mjs` schützt Preload-Timing, Kurzcache, Fast-Rasterpfad, Echo-Gate, transparente Schnellansicht und schnelleren Vollpfad.

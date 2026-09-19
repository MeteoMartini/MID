# MID Design 2.0.1 · Heute / 24 h · v0.9.85.43

Basis: `main = mid-stable = a5530c460a4a29a2794c0a00db27ae22fb8379a6`, v0.9.85.42.

## Ziel

Schritt 3 der parallelen Design-2.0.1-Übernahme. Die bestehende fachlich umfangreiche Kurzfrist-/24-h-Ansicht wird grafisch als zusammenhängender Arbeitsraum ausgearbeitet. Klassisch bleibt unverändert.

## Stündlicher Skybar-Vertrag

Die Skybar wird von der graphischen 1-h/3-h-Dichte entkoppelt.

- Quelle ist immer die kanonische stündliche 24-h-Reihe `profileStateSource`.
- Die Skybarpunkte werden ausschließlich im gleitenden Fenster `profileNow … profileNow + 24 h` verwendet.
- X-Positionen werden direkt aus dem Stundenzeitpunkt über `profileXForEpoch()` abgeleitet.
- Der 3-h-Modus darf nur Kurven, Marker und Beschriftungen ausdünnen.
- Es gibt keine zeitliche Mittelung, Interpolation oder Verschiebung der Skybar.
- Die zentrale `detailSkyBarSegments`-/`SkyBarSegmentsSvg`-Logik und damit Wolken-/Sonne-/Niederschlagsprioritäten bleiben unverändert.

## Graphische Umsetzung

1. **90-Minuten-Kontext**
   - kompakte Instrumentleiste oberhalb des Profils
   - weiterhin reale Nowcast-/Kurzfristwerte

2. **24-h-Hauptinstrument**
   - breite wissenschaftliche Profilfläche statt zusätzlicher Kartenwand
   - gemeinsame Zeitachse, Nachtbereiche und Sonnenereignisse
   - Temperatur/gefühlt/Taupunkt, Niederschlag, Wind/Böen, Luftdruck, Bewölkung und Impact bleiben fachlich unverändert

3. **Steuerung**
   - 1 h / 3 h, Legende und Erklärung als kompakte Sekundärsteuerung
   - Einzeldaten/Zeitschritt unterhalb der Grafik, damit das Diagramm nicht durch dauerhafte Overlays verdeckt wird

4. **Responsive**
   - Smartphone: gestapelte Hierarchie und zusätzliche Bottom-Bar-Sicherheitszone
   - Tablet hoch: Signale 2-spaltig, Profil priorisiert
   - Querformat: reduzierte vertikale Nebenflächen
   - Desktop: maximale Profilbreite und ruhige Instrumentränder

5. **Typografie**
   - keine aggressiven negativen Laufweiten
   - Messwerte tabellarisch/ruhig, Überschriften mit nur minimaler optischer Korrektur

## Unverändert

- meteorologische Daten und Modelle
- RUC/Nowcast, hyperlokale Korrekturen
- Warnschwellen
- Skybar-Fachlogik und Niederschlagsphasenfarben
- klassische Oberfläche
- Original-MID-Logoassets

## Regression

`scripts/test-design-2-0-1-today-098543.mjs` schützt explizit, dass die Skybar nicht mehr aus der 1-h/3-h-ausgedünnten Diagrammreihe erzeugt wird, sondern immer aus der stündlichen 24-h-Quelle. Zusätzlich werden Scope, Responsive-Breakpoints und lesbare Laufweiten geprüft.

## Nächster Schritt

v0.9.85.44: 7-/14-Tage-Prognose im Design-2.0.1-Pfad, inklusive stündlicher 24-Segment-Skybar je Tag und kompakter Forecast-Zeilen.

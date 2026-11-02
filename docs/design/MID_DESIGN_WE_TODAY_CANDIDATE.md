# MID Design-WE · Heute/24-h-Wetterprofil · vorläufiger Integrationskandidat

**Stand:** 02.11.2026 · Ausgangsbasis `main=mid-stable` v0.9.85.411, Commit `9bf44c3354f98937fa058aac5d6dceb5895d29e5`.
**Status:** Entwurfs-/QA-Branch, **nicht veröffentlicht**. Diese Datei ist keine Releasefreigabe.

## Freigegebene Richtung

B (ruhiger Diagrammfokus) + A (sichtbare nächste 90 Minuten) + selektive tiefe Datensteuerung aus C. Der bestehende 24h-Fachrenderer bleibt maßgeblich. Besonders wichtig: **Skybar/Wetter und die getrennte Gesamt-/H/M/L-Wolkeninformation stehen über Temperatur/UTCI**. Reihenfolge der vertikalen Bänder: Wetter/Skybar → Bewölkung → Temperatur/UTCI/Taupunkt → Niederschlagsmenge/PoP → Wind/Böen → Luftdruck → Hazards. Keine meteorologischen Daten werden gefüllt, geglättet oder synthetisiert.

## Geänderte Oberflächen

- `ForecastCockpit.tsx`: vier semantische Diagramm-Fokusknöpfe (**alle Linien bleiben auch bei Fokus sichtbar**); ausgewählte Stunde mit Wettercode und kanonisch vorhandenen Temperatur-, UTCI-, Niederschlags-, PoP-, Wind- und Druckwerten; vollständige Einzeldaten mit Wolken, Taupunkt, Sichtweite, Thermik, Ereignissignalen und Kontext nach bewusstem Öffnen; stündliche Leiste als „Weitere Stunden“.
- `midDesignWeToday.css`: letzte deklarierte CSS-Präsentationsquelle; flachere Flächen, kompakte 90-Minuten-Kacheln auf kleinen Displays, kontrastreiche Stundenwahl, 44px-Touchziele, sichtbarer Fokus, mobile interne Diagramm-Scrollbarkeit, Light/Dark über MID-Themenvariablen, Reduced Motion.
- Unverändert: DWD-Originalbild-Disclosure, Skybar-/WMO-/DWD-Klassifikation, die 15-min-/1h-Zeitslots, UTCI-Berechnung, Warnfarben und -quellen, 24h-X-Geometrie, Sonnenereignisse, Wolken-NoData, Höhen, Modell-Run/ValidTime, bestehende Favoriten/Settings.
- Bereits vorhandene vollständige Zeitreihe und ihre 24 Stunden bleiben nutzbar; keine Stundendaten werden gelöscht. Die neue Auswahl ist eine reine visuelle Hervorhebung, **keine neue Forecastfusion**.
- Der Zustand „Alle Einzeldaten“ nutzt `useDisplayPreference` und bleibt gerätelokal; auf dem ersten schmalen Display geschlossen, auf Desktop grundsätzlich initial offen.

## Prüfnachweise und Gate-Grenzen

Neuer Pflichtregressionstest `scripts/test-design-we-today-compact-0985412.mjs` inventarisiert in `MID_BASELINE.json`. Zusätzlich sind bisherige C11/C15/C16-, 24h-Story-Axis-, NoData-, Farb-, Linien-, Warnings- und Viewport-Regressionen weiterhin verpflichtend.

**Noch nicht durch diesen Commit belegt:** Typecheck, Vite-Asset-Build, komplette 1.062er Regression, echte 320/375/390/430px-/Tablet-/Desktop-Light-/Dark-Screenshots, Keyboard-/Screenreader- und real iOS/VoiceOver-Tests, betroffene Exporte/Widgets, Source-PR-Gate sowie Installer Worker/Pages/Finalize. Keine dieser Prüfungen vor erfolgreicher Ausführung grün melden.

## Parallelarbeit und Veröffentlichung

Der derzeitige v0.9.85.412-Entwurf im RUC-/D2-/Pages-Sammel-PR #623 ist **Draft / nicht veröffentlichungsreif**. Die vorliegende UI-Änderung überschneidet dessen RUC-/Worker-/Kartenpfade nicht absichtlich. Vor gemeinsamer Integration jeweils volle SHAs, tatsächliche Dateiüberschneidungen, Regressionsinventare und Versionierung neu prüfen. Nur nach unabhängiger Validierung der gemeinsamen Source-PR-Gates und des normalen SHA-gebundenen Releasepfades ist Stable-Promotion zulässig. **Nie aus diesem Draft direkt veröffentlichen.**

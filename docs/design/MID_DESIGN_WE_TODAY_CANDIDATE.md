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


## MID-Design-WE 1.1 · Weiterarbeit 02.11.2026 (unveröffentlicht)

- Source-of-Truth erneuert: `main=mid-stable` bleibt bei v0.9.85.411 / `9bf44c3354f98937fa058aac5d6dceb5895d29e5`. Die fünf Rulesets bestehen weiter.
- Zwischenzeitliche Parallelarbeit berücksichtigt: RUC/D2/Pages-Sammel-PR #623 wurde bis `c2f5b627f88ecb5e1c3d122a039e7ae18bec4fb2` weiterentwickelt, weiterhin Draft. In der aktuellen Dateiliste #623 und Design-PR #624 keine gemeinsame Änderung; das ist kein Integrations-/Releasebeleg.
- Designverbesserung: Auf Mobilgeräten bleiben die sechs Wetterpiktogramme und der Skybar-Streifen kompakt. Beim gezielten Antippen eines 15-min-Punktes erscheint direkt darunter die zugehörige Menge, PoP und Wind/Böen, mit Missing-Daten als `n. v.`, nicht als 0. Die vollständigen Detailfelder bleiben erreichbar.
- Nachprüfung eines echten CSS-Cascade-Risikos: `midC27CompactProfile.css` erzwingt `width:max-content!important` mit höherer Spezifität. Eine gezielt spezifischere Regel in `midDesignWeToday.css` gibt dem mobilen Diagrammtoolbar wieder exakt die verfügbare Breite; Parameterchips dürfen nur intern horizontal scrollen. Kein globales Layout-Clipping.
- Neue Vitest-QA: Neben Bestandsvertrag/Node-Pflichtskript zusätzlich TypeScript-TSX-Parsing mittels `ts.createSourceFile` und PostCSS-Stylesheet-Parsing; keine Behauptung eines vollständigen Typechecks oder Vite-Builds. Tests für 15-Minuten-NoData-Werte und C27-Übersteuerung hinzugefügt.
- Die für #624 zuletzt belegten vorherigen Read-only-Läufe waren Vitest #41496813884 und RUC-QA #41496814196 erfolgreich. Neuere Runs müssen für ihren eigenen exakten HEAD erneut ausgewertet werden. Ausgelassene Draft-Gates nicht als Erfolg ausweisen.
- **Freigabe weiterhin gesperrt:** Der vollständige Build, alle inventarisierten Regressionen, echte Smartphone-/Tablet-/Desktop-Vergleiche gegen den Bildentwurf, Keyboard/Screenreader sowie der reguläre kontrollierte Build-/Releasepfad sind nachzuweisen. Kein vorgezogener Merge oder direkte Stable-Promotion.

**Chat-Handoff:** Bei Fortsetzung `MID-Design-WE 1.1` exakt die PR-HEAD-SHA live lesen und die parallel fortlaufenden #623/#622/anderen offenen PRs neu prüfen. Dieser Text ist ausdrücklich eine historische SHA-Referenz, keine statische neue Freigabebasis.

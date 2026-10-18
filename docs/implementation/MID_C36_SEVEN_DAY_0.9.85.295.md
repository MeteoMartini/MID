# MID-C36 · 7-Tage-Kurzinterpretation v0.9.85.295

**Verifizierte Basis:** `main=mid-stable=b0cf607c45746239ed6246ba1e473ee41877a96d`, v0.9.85.294 nach erfolgreichem Installer 39164220384. Integration ausschließlich über `chatgpt/v0.9.85.295-seven-day-brief`.

## Ausgangsproblem
Die bisherige Segmentauswahl priorisierte Wetterphasen, fügte modellierte Gefahren und die Folgenacht jedoch erst danach an. Dadurch konnten Sätze von einem späten Wochentag zeitlich zurückspringen. Ausführliche Floskeln wie „überwiegend trocken“ ließen markante Ereignisse untergehen und waren bei unvollständigen Niederschlagsdaten nicht immer gut gedeckt.

## Umsetzung
- `src/SevenDayForecastSummary.tsx`: meteorologisch bedeutsame Regime und Temperaturklassen erhalten Vorrang. Ein Regenabschnitt ist erst bei mindestens 2 mm im Prognosetag oder signifikanten Dauer-/Wahrscheinlichkeitssignalen ein erwähnenswertes Narrativ; Schnee, Gewitter und markante Gefahren bleiben gesondert gewichtet.
- Das gemeinsame `src/sevenDayNarrativeTimeline.ts` wählt höchstens drei datierte Aussagen nach Bedeutung und sortiert sie **vor Ausgabe** chronologisch nach Tagesindex und Tagesphase. Gefahren- und Folgenachtereignisse werden deshalb nicht mehr blind am Ende angehängt. Doppelte gleichzeitige Gewitterdarstellung wird vermieden.
- Gewöhnliche Trocken-/Sonnenschein-Phrasen ohne markante Entwicklung entfallen. Bei hinreichender Datenlage ohne relevante Ereignisse: neutraler kurzer Hinweis. Andernfalls wird eine unvollständige Datenlage genannt.
- Bestehende Tages-, Sturm-, Schnee-, Klimaanomalie- und Tropennachtklassifikationen, Intervall- und Warnquellenverträge bleiben erhalten. Die narrative Darstellung ist eine MID-Prognose, **keine amtliche Warnung**. Datenquellen, Modelllaufzeiten, Akkumulationen, Werte, NoData und Piktogramme werden nicht verändert.

## Geplante QA und Grenzen
- Eigenständiger dynamischer Test `scripts/test-seven-day-significant-timeline-0985295.mjs` für chronologisch unsortierte Ausgangsereignisse, Priorisierung, Terminfolge, Wiederholungen, leere/unvollständige Daten.
- Bestehende `test-seven-day-trend-weighting-071056` und `test-forecast-summary-landscape` werden **nur am gezielt veränderten Narrativvertrag** aktualisiert; meteorologische Tests bleiben unverändert verpflichtend. 320/390/430/834/1024/1440 sowie Light/Dark und lange Ortsnamen in Source-/Browserprüfungen einbeziehen.
- **Noch kein geprüfter Release:** vollständiger Typecheck, Build, CI-Regressionen, Review, Source-Gate, Release-ZIP, Installer, Worker/Pages und Stable-Promotion sind ausstehend. Keine physische iOS/WKWebView/VoiceOver-Abnahme. Gegebenenfalls bei CI-Befunden stoppen und gezielt nachbessern.

# MID v0.9.78.43

## Auftrag

1. Prüfen, welche Arbeiten beim Appstart bereits während des Splashscreens sinnvoll vorgezogen werden können, damit MID auf dem iPhone mit einem vollständigeren Datenstand erscheint, ohne zusätzliche Abrufbursts oder ein erhöhtes Rate-Limit-Risiko zu erzeugen.
2. Appweit prüfen, ob Wetterpiktogramme fachlich zum zusammengefassten Wetterverlauf passen. Besonderer Fokus: 7-Tage-Karten mit großem Tagespiktogramm und kleinerem Piktogramm für die darauffolgende Nacht.

## I. Splashscreen / Startpipeline

### Befund

`main.tsx` wartete bisher zunächst auf lokale Storage-/Persistenz-/Device-Sync-Schritte und startete den Dashboard-Preload erst danach. `startupPreload.ts` lud ursprünglich nur die Best-Match-Prognose. Gleichzeitig startete `App.tsx` nach dem Rendern Schnellstation und Ensemble separat. Damit blieb während des Splashscreens nutzbare Netzwerkzeit ungenutzt und es bestand die Gefahr, dass dieselbe frühe Arbeit nach dem Rendern erneut gestartet wird.

### Umsetzung

- `beginStartupDashboardPreload()` startet nun unmittelbar nach `markBootStart()` und läuft parallel zu Storage Safety, Forecast-Verification-Compaction, Persistent-State-Restore und Device-Sync-Restore.
- Der Preload umfasst gestaffelt:
  - Best-Match-Prognose sofort und mit Foreground-Priorität,
  - Schnellstation nach 120 ms,
  - nur den begrenzten Foreground-Ensemble-Schnellstart (Mean/Spread-first) nach 260 ms,
  - benötigte lazy UI-Chunks, insbesondere `EnsemblePanel`, wenn Ensemble/Wetterzwilling ohnehin benötigt werden.
- Der standardmäßig aktive Wetterzwilling wird berücksichtigt. Der Ensemble-Schnellstart ist deshalb keine zusätzliche Fachabfrage, sondern zieht den ohnehin nach dem Rendern erforderlichen Abruf lediglich vor.
- `App.tsx` übernimmt Forecast-, Stations- und Ensemble-Promises aus dem Splash-Preload, sofern Standort und Alter passen. Dadurch entstehen keine doppelten identischen Startrequests.
- Innerhalb des bereits vorhandenen kurzen Splash-Budgets dürfen Forecast, Station, Ensemble-Bootstrap und UI-Chunk noch fertig werden; nach spätestens 900 ms wird unabhängig davon gerendert.
- Die vollständige Member-/Mehrmodell-Ensemblefusion bleibt außerhalb des Splashscreens und startet nach erfolgreichem Bootstrap weiterhin nach 2 s.
- Radar-, Warn-, Air-Quality- und andere Sekundärabrufe werden bewusst nicht zusätzlich vorgezogen. Sie bleiben nach dem Forecast-Render im bestehenden gestaffelten App-Pfad. Das verhindert einen Startburst.
- Der globale `openMeteoGuard` bleibt unverändert auf maximal zwei aktive Open-Meteo-Abrufe und 220 ms Startabstand begrenzt.

## II. Appweiter Piktogramm-Audit

### Befund am Screenshot

In der 7-Tage-Karte konnte der Text-/Regimepfad einen Tag korrekt als „Sonnig“ klassifizieren, während der große Renderer aus einem separat repräsentativ gewählten Stunden-Code trotzdem eine geschlossene Wolke zeigte. Ursache war nicht `WeatherPictogram`, sondern ein konkurrierender lokaler Perioden-Selektor. Für die kleinere Folgenacht gab es ebenfalls eine lokale Auswahl, die einzelne ungünstige Stunden zu stark gewichten konnte.

### Zentraler Periodenvertrag

Neu ist `src/periodWeatherVisual.ts` als einziger Aggregator für zusammengefasste Tag-/Nacht-Piktogramme über dem bestehenden `WeatherPictogram`-Renderer.

**Tag:**
- Der bereits fachlich aus Tageslichtstunden, Bewölkung, Sonnenschein und Niederschlagsdominanz ermittelte `dayWeatherCharacter` ist für das Tagespiktogramm autoritativ.
- Damit gilt z. B. „Sonnig“ → entsprechendes sonniges/gering bewölktes Piktogramm und nicht mehr „Wolke“, nur weil eine einzelne Stunde stärker bewölkt war.
- Dominanter Niederschlag bleibt über `dayWeatherCharacter` phasenkohärent.

**Folgenacht:**
- Das kleine Nachtpiktogramm verwendet ausschließlich `followingNightHoursForDate(...)`.
- Es übernimmt weder das Tagespiktogramm noch den schlimmsten Einzelstunden-Code.
- Niederschlagsphänomene werden nach Dauer, Wahrscheinlichkeit, Menge und Gewitterrelevanz aggregiert.
- Kurze Einzelereignisse dominieren die ganze Nacht erst bei ausreichender Relevanz (Daueranteil, Menge, hohe PoP oder Gewitter).
- Nebel braucht eine relevante Periodendauer.
- Ohne dominantes Wetterereignis entscheidet die mittlere Bewölkung über klar / überwiegend klar / teilweise bewölkt / bedeckt.

### Geltungsbereich

Der zentrale Periodenaggregator wird jetzt in folgenden zusammengefassten Forecastdarstellungen verwendet:
- klassische 7-Tage-Tageskarten,
- Cockpit-7-Tage-Tageskarten,
- 7-Tage-Kurvenkopf,
- ausgewähltes Tagesdetail,
- Widget-/Exportvorschau.

Andere Piktogrammverwendungen wurden geprüft:
- Kurzfrist-/Stundenansichten verwenden konkrete Zeitpunkte bzw. Intervalle und bleiben beim kanonischen Stunden-Code.
- 14-Tage-Cockpit und Ensemble-Fallback beziehen ihren Tages-Code bereits aus `dayWeatherCharacter`.
- Eventdarstellungen verwenden den eigenen Eventzeitraum und dessen kanonische Event-Zusammenfassung; sie werden nicht künstlich auf einen ganzen Tagescharakter umgestellt.
- Reise-/Klimaansichten visualisieren Klimapunkte und besitzen keine Tages-Skybar-Semantik.
- Warn-/Astronomie-/Radar-Sondersymbole sind keine alternativen Wetterzustands-Piktogramme und bleiben vom Weather-Pictogramm-Vertrag getrennt.

## Schutz vor Regressionen

- `scripts/test-startup-splash-preload-097843.mjs`
- `scripts/test-period-pictogram-consistency-097843.mjs`
- der bestehende `scripts/test-weather-pictogram-ui-lock-09781.mjs` wurde auf den zentralen Periodenvertrag migriert.
- `MID_WEATHER_PICTOGRAM_STANDARD.md` enthält ab v0.9.78.43 die verbindliche Präzisierung „Periodenkohärenz für Tag und Folgenacht“.

## Worker

Keine fachliche Workeränderung. Worker und Professional-Release werden nur versionssynchron auf v0.9.78.43 ausgeliefert.

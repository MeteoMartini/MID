# MID Implementation v0.9.77.29

Datum: 2026-09-02

## Anlass

Drei zusammenhängende Punkte wurden umgesetzt:

1. Der Witterungstrend Tag 15–46 blieb im Produktivbild bei „Witterungstrend wird geladen …“ stehen, während der saisonale ECMWF-Bereich darunter bereits Daten zeigte.
2. Der Langfristvertrag sollte ausdrücklich auch geeignete Nicht-EPS-Quellen und weitere amtliche Wetterdienste zulassen, ohne abhängige Modellpfade doppelt zu gewichten.
3. Die vom Nutzer freigegebene kompakte 7-Tage-Kurvenübersicht mit Tagespiktogrammen, Tmin/Tmax, Temperaturverlauf und Niederschlagsbalken sollte in den gemeinsamen Appcode übernommen werden.

## I. Langfrist-/Quellenvertrag

`MID_LONG_RANGE_SOURCE_EXPANSION_0.9.77.29.md` erweitert den Methodenvertrag:

- EPS-Member sind keine Voraussetzung für eine Modellstimme.
- Ensemble-Rauchfahnen, Ensemble-Mittel und belastbare deterministische Modellmittel dürfen beitragen, wenn sie dieselbe Monats-/Anomalieachse verwenden und als unabhängige Modelllinie identifiziert sind.
- Eine Modelllinie erhält weiterhin genau eine Stimme. Memberzahl und Mehrfachanbieter erhöhen das Gewicht nicht.
- DWD GCFS2.2 / EPISODES ist ein eigenständiges saisonales DWD-System und bleibt als Deutschland-Perspektive erhalten.
- DWD Subseasonal EPISODES basiert auf ECMWF IFS ENS/Extended-Range und ist auf etwa 5 km über Deutschland/Nachbarländer heruntergerechnet. Dieser Pfad ist daher ein regionaler ECMWF-Downscaling-/Qualitätsanker und ausdrücklich **keine zweite unabhängige EC46-Stimme**.
- WMO-LRFMME/APCC/CanSIPS und weitere Wetterdienstquellen werden weiterhin nur numerisch eingebunden, wenn Maschinenzugriff, Zeitachse und Unabhängigkeit verifiziert sind. Login-/Katalog-/Bildprodukte erzeugen keine Scheinmodelle.

`LongRangePanel.tsx` und `seasonalForecast.ts` spiegeln diesen Vertrag. Einzelmodelle kennzeichnen jetzt 1 Member als `Einzellauf / deterministisch`; 0/aggregierte Eingänge als `Modell-/Ensemble-Mittel`.

## II. Witterungstrend – Ladeblockade

### Ursache

`SubseasonalTrendPanel.tsx` lud zunächst EC46 und GEFS und wartete anschließend synchron auf die ERA5-Klimatologie 1991–2020. Der Klimatologieabruf umfasst 30 Jahre Tagesdaten und kann bei Archive-API-Latenz/Rate-Limit lange blockieren. `loading=false` wurde erst nach Abschluss dieses Schritts gesetzt. Deshalb konnten bereits vorhandene Modellwerte unsichtbar bleiben.

### Korrektur

- ECMWF EC46 und NOAA GEFS erhalten jeweils ein hartes 12-s-Quellbudget mit eigenem AbortController.
- Die Klimatologie erhält ein separates 4,5-s-Budget.
- Nach Ablauf des Klimabudgets wird der vorhandene EC46/GEFS-Trend sofort ohne frische Klimakurve dargestellt; ein späterer/älterer Klimacache bleibt nutzbar.
- Der Witterungstrend-Stale-Fallback wurde auf 36 h verlängert, damit ein temporärer Upstream-Ausfall nicht wieder zu einer leeren Sektion führt.
- Der Hauptabruf bleibt abortierbar bei Standortwechsel/Unmount.

## III. 7-Tage-Kurvenübersicht

Im bestehenden `SevenDayBand` ist direkt unter dem 7-Tage-Brief und oberhalb der kompakten Tageskarten eine neue `SevenDayCurveOverview` integriert.

Sie zeigt ohne neuen Datenpfad:

- 7 Tage in einer gemeinsamen, scrollfreien Rasterbreite;
- Wochentag und Datum;
- die bestehenden zentralen MID-Wetterpiktogramme;
- Tmax in der appweiten roten Klimaton-Familie und Tmin in der blauen Klimaton-Familie;
- eine geglättete Kurve, die Tmin/Tmax innerhalb jedes Tages verbindet;
- tägliche Niederschlagsmengen als Balken mit durch PoP modulierter Deckkraft;
- antippbare Tagessegmente, die direkt die vorhandene Tages-/Stundenauswahl aktivieren;
- responsive Verdichtung für iPhone Hochformat bis 390 px sowie breitere mobile/desktop Layouts.

Die Implementierung verwendet ausschließlich vorhandene Tages-/Stundendaten, `dailyTemperatureTone`, `WeatherPictogram` und die zentralen Parameterfarben. Es entsteht kein paralleler Forecast- oder Farbpfad.

## Regression

Neu: `scripts/test-witterung-seven-day-curve-097729.mjs`.

Zusätzlich wurden zwei veraltete Regressionserwartungen auf den erweiterten Nicht-EPS-Vertrag migriert:

- `test-visible-app-internals-09751.mjs`
- `test-long-range-model-sources-09774.mjs`

Der v0.9.77.28-Test `test-climate-delta-badges-097728.mjs` wurde zusätzlich in beide Baseline-Testlisten aufgenommen; er war bereits als Pflichtdatei vorhanden.

## Worker

Keine funktionale Workeränderung gegenüber v0.9.77.28. Nach Versionsnormalisierung ist `worker.js` bytegleich. Ein Worker-Upload ist für v0.9.77.29 nicht erforderlich, sofern der fachlich geänderte Worker aus v0.9.77.27 bereits produktiv ist.

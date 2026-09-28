# MID Implementation v0.9.49.0

## Anlass

Fortschreibung von v0.9.48.1 mit zwei Konsistenzkorrekturen für Events und den lokalen Wetterzwilling.

## Eventbezogene Niederschlagswahrscheinlichkeit

- Events verwenden nicht mehr ausschließlich das Maximum der stündlichen Best-Match-PoP innerhalb des Terminfensters.
- Für den exakten Start-/Endzeitraum wird aus den verfügbaren Ensemble-Mitgliedern eine eigene Ereigniswahrscheinlichkeit berechnet.
- Es gelten dieselben DWD-nahen Schwellen wie im übrigen MID: >0,2 mm für ein Niederschlagsereignis sowie >5,0 mm für signifikanten Niederschlag.
- Stundenakkumulationen werden nur entsprechend ihrer zeitlichen Überdeckung mit dem Eventfenster berücksichtigt; Teilstunden werden anteilig behandelt.
- Modellfamilien werden über `independenceGroup` entkorreliert, sodass verwandte/duplizierte Ensembles keine zusätzliche Stimme vortäuschen. Die bestehende horizon-, Auflösungs- und Update-abhängige Modellgewichtung (`modelDayWeight`) bleibt erhalten.
- Die Ensembleauswertung wird nur verwendet, wenn mindestens zwei unabhängige Modellfamilien und genügend Mitglieder vorliegen. Andernfalls bleibt die höchste stündliche PoP als klar gekennzeichneter Fallback erhalten.
- Die Eventansicht weist zusätzlich die Wahrscheinlichkeit für >5 mm, Memberzahl und Quellenart intern/provenienzseitig aus.

## Wetterzwilling

- Die Prüfung bestätigt: Der Wetterzwilling wird bei freigegebenem, lokal validiertem Lernstand tatsächlich auf die operative Prognose angewendet.
- Er bleibt bewusst auf belegte lokale Temperatur- und Böen-Biases begrenzt. Niederschlagsmenge, PoP, Wettercode und Sonnenschein werden nicht aus einem anderen Modell in das kohärente Best-Match-Wetterbündel gemischt.
- Für Events am aktiven Ort werden exakt die bereits finalisierten Ortsstunden samt aktivem Wetterzwilling übernommen. Der Eventplaner erhält nun zusätzlich den Twin-Aktivstatus für eine korrekte Herkunftskennzeichnung.
- Für andere Eventorte kann der dort gespeicherte lokale Wetterzwilling ebenfalls verwendet werden, sofern dessen Qualitäts-/Validierungsbedingungen erfüllt sind und passende Ensembleinformationen vorliegen.
- Der frühere doppelte Radar-/Nowcast-Pfad innerhalb des Wetterzwillings wurde entfernt. Radar, Konvektion und Stationsanker laufen ausschließlich über die gemeinsame `finalizeForecastHours(...)`-Endstufe.
- Die Einstellung „Radar-/Nowcast im Lernkreis“ steuert nur noch, ob Radarbeobachtungen in Rückblick und Lernen des Wetterzwillings eingehen; sie schaltet den operativen Radar-Nowcast nicht ab.

## Konsistenz

Die Reihenfolge ist damit appweit: Modell-/Best-Match-Basis → optionale validierte Wetterzwilling-Bias-Korrektur → Ensemble-PoP → gemeinsame kurzfristige Endstufe mit Radar/Konvektion/Stationsanker → Eventfenster-Auswertung.

## Regression

Neu: `scripts/test-event-pop-weather-twin-09490.mjs`. Der Test schützt Eventfenster-PoP, DWD-Schwellen, Modellfamilien-Entkopplung, Weather-Twin-Provenienz und den einzigen zentralen Radar-/Nowcast-Pfad. Bestehende Event-, DWD-PoP-, Modellfamilien-, Wetterzwilling-, Radar-, Baseline- und Release-Lineage-Regressionen wurden gezielt erneut ausgeführt.

## Worker

Keine neue Worker-Funktion. Der Worker ist lediglich auf v0.9.49.0 versionssynchronisiert; ein funktionaler Worker-Upload ist nicht erforderlich.

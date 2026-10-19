# MID C42 – Skybar-NoData bei WMO-kodiertem Niederschlag · v0.9.85.300

## Baseline und Befund

GitHub `main = mid-stable = 8b3759960ef78e758d7c19d2603f4acde052522f`, v0.9.85.299, erfolgreich über Installer #39295438835. Der gelesene Quell-Snapshot wurde per Git-Blob-SHA für `src/detailSkyBar.ts` und `src/precipitation.ts` mit Stable verglichen.

Bei `precipitation=null` und WMO-Code 61 konnte eine Niederschlags-Skybar „0 mm“ und sogar „0.0 mm/15 min“ ausgeben. Ursache: die frühere Formatierung setzte fehlende Niederschlagsmenge durch `??0` gleich einem vorhandenen Nullwert und übernahm das daraus entstandene `parts.label`. Der WMO-Code belegt eine Phaseninformation, **keine gemessene Niederschlagsmenge**.

## Kontrollierte Änderung

- Validierung vor dem Skybar-Tooltip: `null`, `undefined`, `NaN`, negative Werte, unendliche Werte, Leerstrings und Booleans gelten nicht als Niederschlagsmenge.
- Bei vorhandenem WMO-Code wird die fachlich belegte Phase/Intensitätskodierung weiter angezeigt, die fehlende Gesamtmenge aber ausdrücklich als nicht verfügbar markiert; dabei der **ursprüngliche** WMO-Code als Provenienz.
- Positive Regen-/Schauerteilmengen liefern gegebenenfalls eine Untergrenze, ersetzen aber nicht stillschweigend die Gesamtmenge. Positive Schneemengen bleiben als Intensitätsbasis lesbar; fehlendes flüssiges Wasseräquivalent bleibt als solches gekennzeichnet.
- Bei tatsächlich vorhandenem Nullwert `0` bleibt die etablierte Darstellung unverändert. Für nicht belegte Wettersignale entsteht kein zusätzlicher Niederschlagsstreifen.
- Keine meteorologischen Felder, Quantisierungen, Wettercode-/Warn-Governance, CSS, RUC, UTC-Zeitachsen oder Intervalle werden geändert.

## Tests und Veröffentlichung

`node scripts/test-skybar-precipitation-nodata-0985300.mjs` prüft WMO 51/61/63/71/81/82/95 (inklusive stärkster Schauerstufe), echte 0-Werte, verschiedenartige NoData-Werte, 15-Minuten-Intervalle und Teilfelder; die bestehende Solar-/Skybar-Matrix bleibt unverändert. Die Tests sind in beiden kanonischen Regressioninventaren zusätzlich registriert, vorhandene Einträge bleiben erhalten.

Das vollständige Source-PR-Gate und der erneute serverseitige Release-Installer einschließlich Worker-/Pages-/Stable-Promotion sind vor Freigabe der Version zwingend. Browser/physisches iOS/VoiceOver und die separate CSS-Optimierung #344 werden durch einen Node-Test nicht ersetzt.

# MID Audit 1.1 · Vollständige EC46-/GEFS-Wochendaten und ehrliche Klimaverweise
**QA DRAFT ONLY · NO RELEASE.** Original Nutzer-PDF `20261117_MID-Audit(1).pdf`, Seiten 2–4 und 7: wissenschaftlich belastbare 46-Tage-/Saisontrends, echte Akkumulationsintervalle, Unsicherheit, keine Datenlücken zu 0 und kein überpräzises Tageswetter. Verifizierte Stable-Basis `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, `v0.9.85.488` (drei Versionsspiegel synchron), 5 aktive Schutzrulesets; `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_FORECAST_CONSISTENCY_CONTRACT.md`, `MID_MODEL_SOURCE_CONTRACT.md`, 50 offene PRs geprüft.

## Codebeleg und Relevanz
Veröffentlichtes `src/SubseasonalTrendPanel.tsx`, Blob `cfa6cfa944c7f94207a5a47a99f63147cf90e23b`: `buildWeeks` beginnt bei Index 14, bildet jeweils sieben Kalendertage, lässt aber am Endindex `Math.min(start+6,time.length-1)` die letzten vier Tage der 46-Tage-Reihe als scheinbar volle Woche erscheinen. `aggregateMember` mittelt bzw. summiert **nur** vorhandene finite Tageswerte. Ein 6/7 vollständiger Regen-Wochenblock kann eine zu kleine `mm/Woche`-Menge erhalten, die dann in der ERA5-Abweichung weiterverwendet wird. `loadClimateWeeks` akzeptiert `samples.length>0` statt der vollständigen sieben korrespondierenden Klimatage. Das ist ein reproduzierbares **Source-/Semantikrisiko**, keine bereits nachgewiesene reale Live-Datenverfälschung.

## Konkreter Patch mit echtem Verbraucher
- `src/subseasonalWeekIntegrity.ts`: reine O(7)-Prüfung pro originärem Tagesmitglied; fehlende, NaN, Strings, negative Regenmengen, ungültige Wolken-/Windwerte und Kalenderlücken liefern `null`, niemals 0. Vollständige 7-Tage-Werte werden ohne künstliche Extremglättung summiert oder gemittelt; ein realer 0-mm-Regenwert bleibt 0.
- `src/SubseasonalTrendPanel.tsx`: verwendet den Validator tatsächlich, lädt Mitgliedsreihen je Parameter einmal statt wiederholt für jede Woche, prüft die gesamte originale Kalenderfolge und die native Mitgliedsreihenlänge vor der Aggregation, zeigt nur vollständige 7-Kalendertage-Blöcke. Keine Endfragment-Prognose in `mm/Woche`. Die ERA5-Klimawochendaten werden ebenfalls nur bei sieben vollständigen Referenztagen aggregiert. Bestehende 46d/GEFS/EC46-Verfügbarkeit, Qualitäts- und Modellgruppen bleiben unberührt. Im vorhandenen Info-Disclosure wird die Wochenrestriktion offengelegt.
- `tests/unit/mid-audit11-subseasonal-week-integrity.test.ts`: dreizehn synthetische Testfälle mit Originalzahl/Null, fehlendem Regentag, 46-Tage-Restfragment, invaliden Messwerten/Extremen, DST/UTC-Datumsfolgen und Source-Wiring.

**Bewusste fachliche Abwägung:** Statt Tag 43–46 in eine erfundene Sieben-Tage-Niederschlagssumme umzuwandeln, zeigt die derzeitige Wochenansicht nur komplette Sieben-Tage-Zeiträume (Tag 15–42 bei exakt 46 Originaltagen). Dies muss als UI-Limitierung erkennbar sein; eine spätere separate **klar als 4-Tage-Teilperiode mit dazu passender Klimareferenz markierte Anzeige** wäre möglich, braucht aber eigene Einheiten/Endzeit-Semantik und responsive UX-Abnahme. Kein Verwerfen voller verfügbarer Wochen. Der 46-Tage-Produktname bezeichnet die Quellenreichweite, nicht notwendigerweise das Diagrammende. Fehlende 7-Tage-Mittelwerte dürfen nicht als klimatologisch „normal“ deklariert werden.

## Qualitätsansatz im Vergleich
- **ECMWF:** Extended Range 15–46 beschreibt großräumige **wöchentliche** Anomalie- und Wahrscheinlichkeitsverteilungen, keine Tagespräzision; selbst Modellrun-Details müssen als meteorologische Reichweite qualifiziert werden.
- **meteoblue:** Trennt modellübergreifende Divergenz und Vorhersagbarkeit; MID übernimmt das Prinzip, nicht fremde proprietäre Algorithmen.
- **MeteoSwiss:** Weist Feld- und Tageszeitintervalle entsprechend ihrer spezifischen Zeitsemantik aus.

Originalquellen:
- https://confluence.ecmwf.int/pages/viewpage.action?pageId=197692844
- https://confluence.ecmwf.int/pages/viewpage.action?pageId=340774907
- https://content.meteoblue.com/en/private-customers/website-help/forecast/multimodel
- https://opendatadocs.meteoswiss.ch/e-forecast-data/e4-local-forecast-data

## Integration/Regression
Geändert werden nur `src/SubseasonalTrendPanel.tsx` (kein paralleler PR besitzt diesen Pfad), neue Pure-Helper-Datei, neue Vitest-Testdatei und Dokumentation. Keine Worker, keine Radar-/DWD-Warnungen, keine Source-/Release-Gate-/Versions-Spiegel, keine API, keine kostenpflichtigen Dienste oder Secrets. Bei der späteren Integration bestehende `scripts/test-trend14plus-09770.mjs`, `scripts/test-trend14plus-climatology-097...`, 14d/46d/Seasonal/Horizon-Browserregressionen und NoData/Timezone-Tests zusätzlich ausführen. **Vitest allein ist keine reale Desktop-/Mobile-/iOS-/VoiceOver- oder Produktionsdaten-Abnahme.** Neue Info-Zeile muss auf 320–1440px, 200% Text und mit Touch/Fokus kontrastreich geprüft werden. Nutzerentscheidung bleibt beim User; Leitchat selektiert nur nach Neuabgleich mit aktuell Stable- und offenen PR-Head-SHAs. Vollständige Source/Review/Core/Heavy/ZIP/Installer/Worker/Pages/Stable-Gates erforderlich, HIGH picomatch #903 weiter bindend. QA-Draft blockiert disjunkte Releases nicht.

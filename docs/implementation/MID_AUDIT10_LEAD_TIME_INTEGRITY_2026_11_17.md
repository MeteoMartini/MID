# MID Audit 1.0 – Archiv-Vorlauf und Ausgabezeit als unabhängiger Skill-Nachweis

**17.11.2026 · rebasierungsfreier Spezial-QA-Port auf der veröffentlichten v0.9.85.488.**
Exakte Basis: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`. 5 aktive GitHub-Rulesets; `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `contracts/index.json` und Forecast-Consistency-Vertrag vor Änderung gelesen. **Kein Merge, kein Ready, kein Release.**

## Original-PDF-Befund
Im 7-seitigen Audit `20261117_MID-Audit(1).pdf` werden auf S. 3 die Belegbarkeit von Initialisierungs-/Gültigkeitszeiten und auf S. 4 die unabhängige Modellgüte je Vorlaufzeit verlangt. MID `recordForecastCapture()` archiviert `issuedAt` und `leadHours=(dateNoon(targetDate,timezone)-now)/3600000`. `chosenEvaluations()` überprüfte seit #890 bereits **Hindsight vor Beginn des lokalen Zieltags**, validierte aber nicht, ob ein archivierter Vorlauf mit seinem echten Ausgabezeitpunkt und dem lokalen Zielmittag übereinstimmt. Das konnte irrtümlich 12-/24-/48-/72-h-Verifikations-Buckets und lokale Skill-Gewichte aus veränderten Archivmetadaten speisen.

## Implementierung
- Neue reine `src/forecastLeadTimeEvidence.ts`: striktes ISO-Zeitformat mit `Z` oder explizitem UTC-Offset, gültiger Kalenderzeit statt `Date.parse()`-Normalisierung (z.B. 30. Februar), endliche positive Vorlaufstunden und rechnerische Übereinstimmung mit dem lokalen Zielmittag innerhalb **maximal 60 Sekunden** rein für Rundung.
- In `src/forecastVerification.ts` enthält der vorhandene `dayBounds`-Cache zusätzlich einmalig berechneten `noon`-Epoch je Zieldatum/IANA-Zeitzone. Der neue Guard wird **nach** den vorhandenen Volltag-/Hindsight-/TZ-Checks ausgeführt. Quelle, unabhängige Beobachtungen, Pop-/NoData-Validierung aus #886/#897, Kalibrations-/Bias-Berechnung, Originaldaten und API bleiben unverändert.
- `tests/unit/mid-audit-lead-consistency.test.ts`: echte CET/CEST-23-/25-h-Mittag-Intervalle, falsche Horizonte, Präzisionstoleranz, ungültige/leere/mehrdeutige Stempel inklusive 30. Februar, sieben archivierte Synthesetage (zwei kohärent) und unveränderte Originalbytes.
- Die bestehenden `tests/unit/mid-audit-forecast-hindsight-evidence.test.ts` und `tests/unit/mid-audit-archived-rain-probability.test.ts` erhalten lediglich **korrekte Ausgabezeit-/Vorlauf-Metadaten** für ihre schon bisher als gültig beurteilten Szenarien. Fachliche Stichproben-/NoData-/Hindsight-Assertions sind unverändert. Im Paar-Chromium-Browser-Skript sind die Oktober-Vorlaufzeiten bereits kohärent.
- Diese Integrationsnotiz.

## Grenzen/QA
Ungültige Archiv-Captures bleiben gespeichert, werden aber **nicht als Null oder statistisch gültige Vorhersage** bewertet; Fallzahlen können zulässigerweise sinken. Ein clientseitig gespeicherter Zeitstempel ist keine unabhängig signierte Ausgabezeit (separate Provenienz-Evidenz erforderlich). Der lokale Zielmittag ist der tatsächliche IANA-Absolute Epoch, nicht pauschal 24 Stunden nach dem Vortag. Ein vollständiger Stationenvergleich mit 30/90 Tagen, Bias-/Brier-Skill-Referenz, Konfidenzintervallen und relevanter Regionalisierung bleibt offen. Keine zusätzliche Netzlast, keine CSS-/Render-/iOS-/Worker-/Warn-/Modelländerung, kein kostenpflichtiger Dienst. Echte Browser-/iOS-/VoiceOver-/WCAG-/Performance-/Release-Abnahme nicht behaupten.

## Intake
Der ältere [#892](https://github.com/MeteoMartini/MID/pull/892) wurde auf der abgelösten .486 erstellt und darf **nicht als kompletter `src/forecastVerification.ts`-Blob** über aktuelle Stable-Änderungen kopiert werden. Dieser Port arbeitet direkt auf .488, erhält `isTwinVerifiedNonnegative`, `isVerifiableTwinRainProbability`, `isFullDayForecastEvidenceIssuedBeforeDay`, den vorhandenen `dayBounds`-Status sowie das amtliche Quellen-/Warn-Regelwerk. Bei neuer LC-/Release-Basis HEADs/Blobs erneut vergleichen und auf autorisiertem Integrationsbranch die vollständigen Draft-/Core-/Heavy-/Source-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates ausführen.

**Literatur:** ECMWF Forecast evaluation https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation; WMO WGNE zur unabhängigen beobachtungsbasierten Verifikation https://wgne.net/publications/suggested-methods-for-precipitation-verification/ .

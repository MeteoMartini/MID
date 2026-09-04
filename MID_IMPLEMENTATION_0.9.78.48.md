# MID v0.9.78.48

## Anlass
GitHub-Release #881 erreichte nach erfolgreichem `npm ci`, Dependency-Audit, TypeScript-7-Check und Vite-Produktionsbuild die Regressionen. Dort scheiterten 19 von 669 Tests. Die Fehler wurden durch die in v0.9.78.46 eingeführte zentrale Trennung zwischen endgestempelten Rohakkumulationen und startgestempelten sichtbaren Niederschlagsslots ausgelöst: ältere Regressionen erwarteten noch Quelltextmuster des alten Zeitvertrags oder transpilierten `forecastFusion.ts` isoliert, ohne dessen neue Abhängigkeit `precipitationIntervals.ts` bereitzustellen.

## Umsetzung
- Der produktive Forward-Slot-Vertrag aus v0.9.78.46 bleibt unverändert bestehen. Es gibt **keinen** Rückfall auf endgestempelte sichtbare Niederschlagszeiten.
- Sämtliche isolierten `forecastFusion.ts`-Regressionsharnesses behandeln den neuen Präsentationsadapter nun explizit als abgegrenzte Abhängigkeit; die eigentliche Forward-Slot-Funktion bleibt durch `test-precipitation-forward-slot-presentation-097846.mjs` separat geschützt.
- Veraltete Quelltextverträge für 24-h-Rollingfenster, Current-/Kurzfristtemperatur, Wassersport, Höhenwetter, Solarstatus, Radar-Intervallraster und 7-Tage-Beschriftung wurden auf den seit v0.9.78.45/46 verbindlichen Stand migriert.
- Der Kurzfrist-Regressionsfall schützt nun auch den angebrochenen ersten Zukunftsslot: bei 17:53 beginnt die sichtbare Prognose `ab jetzt` für 17:53–18:00 und läuft anschließend in 15-Minuten-Slots weiter.
- Neue Meta-Regression `test-precipitation-forward-slot-regression-compat-097848.mjs` verhindert, dass isolierte Forecast-Fusion-Tests künftig beim Hinzufügen zentraler Intervallabhängigkeiten unbemerkt veralten.

## Fachlich unverändert
- Rohdaten-/Assimilationskern: Niederschlagsakkumulationen bleiben am Intervallende referenziert.
- Sichtbare Zukunftsprognose: Zeitlabel bezeichnet den Intervallbeginn.
- Temperatur, Wind, Druck und Bewölkung bleiben zeitpunktbezogen.
- Phasen-, Skybar-, Piktogramm-, Ensemble- und Worker-Verträge werden nicht zurückgebaut.

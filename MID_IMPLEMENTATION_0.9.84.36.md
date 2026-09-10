# MID v0.9.84.36 – Implementierungsnotiz

## Anlass
GitHub Release #989 erreichte erfolgreich ZIP-Prüfung, `npm ci` und Dependency-Audit, scheiterte anschließend ausschließlich an drei TypeScript-7-Typfehlern in der neuen Event-/Update-Härtung.

## Korrekturen
- `src/eventCenter.ts`: Nullable Event-PoP-Werte werden vor dem Delta-Vergleich explizit auf endliche Zahlen normalisiert.
- `src/v078.ts`: Service-Worker-Registrierungen akzeptieren den readonly DOM-Rückgabetyp von `getRegistrations()`.
- `scripts/test-update-event-sources-ios27-098434.mjs`: Vertragsprüfung auf den neuen typsicheren Ausdruck aktualisiert.
- `scripts/test-ci-types-event-update-098436.mjs`: gezielter Schutz der beiden CI-Typverträge.

## Fachlicher Umfang
Keine Änderung an meteorologischen Schwellen, PoP-Berechnung, Update-Zeitbudgets, Quellenlogik oder Worker-Funktionalität.

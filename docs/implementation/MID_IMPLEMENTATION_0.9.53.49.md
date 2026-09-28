# MID v0.9.53.49

## CI-/Interaktionsregression
- `test-interactions.mjs` prüft den appweiten Such-Debounce nicht mehr gegen einen veralteten festen Altwert (`45:80`), sondern gegen den tatsächlichen Responsivitätsvertrag: PLZ-Suche darf nicht langsamer als Textsuche sein und die Textsuche bleibt bei höchstens 80 ms.
- Der produktive Suchpfad aus v0.9.53.48 (`35:60` ms, Foreground-Priorität, Stale-Response-Schutz und Ladefeedback) bleibt unverändert.
- Keine Änderung an Wetter-, Netatmo-, Lüftungs-, Cache- oder Worker-Funktionslogik.

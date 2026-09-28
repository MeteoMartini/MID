# MID v0.8.27.13

## Änderungen
- Fix für den GitHub-/CI-Build in `EnsemblePanel.tsx`: die zuletzt eingeführten gemeinsamen X-Achsen-/Diagrammhöhen für Niederschlag und Wind sind jetzt sauber deklariert und an allen Stellen konsistent verwendet.
- Prognose-Kompass erweitert: statt starr „nächste 3 Tage“ zeigt er jetzt verständlich, **wie lange die Prognose weitgehend gesichert ist** (ca. Anzahl Tage und Datum, bis zu dem die Modelle noch hinreichend konsistent sind).

## Inhaltlich
- Neues Kompass-Feld: **Weitgehend gesichert**
- Ausgabe z. B. als „etwa 5 Tage“ plus „weitgehend gesichert bis Mittwoch, 05.08.“
- Bei früh auseinanderlaufenden Modellen wird dies ausdrücklich benannt.

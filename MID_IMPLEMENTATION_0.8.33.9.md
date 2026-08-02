# MID v0.8.33.9

## Änderungen

- Warnfreier Status app-weit auf **„Keine Warnung“** verkürzt.
- Gemeinsame Tagescharakteristik für 7-Tage-Karte, Tagesdetail und 14-Tage-Übersicht präzisiert.
- Ein einzelner, mäßig wahrscheinlicher Regenimpuls am späten Abend dominiert nicht mehr Piktogramm und Haupttitel des gesamten Tages.
- Der tagesprägende Himmelszustand bleibt Haupttitel und Piktogramm; ein spätes Randereignis erscheint als Zusatz, beispielsweise **„Oft sonnig, abends Regen möglich“**.
- Mehrstündiger, wahrscheinlicher oder mengenmäßig markanter Niederschlag bleibt weiterhin tagesprägend.

## Regression

- Neue Prüfung `test-day-character-late-rain-warning-wording-08339.mjs`.

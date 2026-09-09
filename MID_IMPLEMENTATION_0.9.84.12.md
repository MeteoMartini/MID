# MID v0.9.84.12 – Release-Fix Skybar-Prüfvertrag

## Extern

- Keine Änderung am sichtbaren Skybar-Vertrag aus v0.9.84.11: Gesamtbewölkung bleibt die primäre Himmelsgröße; sonnige Schauer bleiben als farbiger Niederschlagslayer über einem vorhandenen gelben Grundband sichtbar.
- Direkte Sonnenscheindauer bleibt fachlich ein eigenständiger Parameter. Sie wird nicht mit dem aus Gesamtbewölkung abgeleiteten visuellen Sonnenanteil gleichgesetzt.

## Intern

- Der Release-Lauf #966 scheiterte ausschließlich an `scripts/test-audit-science-097864.mjs`: `sunVisualShare(0,0)` lieferte nach der Skybar-Umstellung fälschlich `1` statt `0`.
- `sunVisualShare()` behält deshalb wieder seinen klaren Parametervertrag: vorhandene direkte Sonnenscheindauer führt; nur bei fehlendem Sonnenwert darf die Wolkenkomplementierung als Fallback dienen.
- Die Skybar-Grundfarbe bleibt davon getrennt in `baseSkyVisual()` geregelt: bekannte Gesamtbewölkung führt dort weiterhin vor Sonnenscheindauer.
- Die Kennzeichnung „auf sonnigem Grundband“ im Niederschlags-Tooltip folgt nun derselben Grundbandlogik wie die tatsächliche Darstellung und nicht dem separaten Sonnenscheindauer-Helfer.
- Keine fachliche Workeränderung.

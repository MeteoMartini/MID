# MID v0.9.85.458

## Änderungen
- Die GitHub-CodeQL-Sicherheitsanalyse verwendet jetzt einheitlich die verifizierte Action v4.39.1 für Initialisierung und Auswertung. Beide Aufrufe sind auf denselben unveränderlichen Commit-SHA festgelegt.
- Der Quellstand dokumentiert die inzwischen tatsächlich veröffentlichte Vorgängerversion v0.9.85.457 mit ihrer vollständigen Source-/Installer-/Worker-/Pages-Provenienz korrekt.

## Unverändert
Wettermodelle, DWD-/WMO-Warnungen, Niederschlagswerte, Karten, Benutzeroberfläche und Nutzerdatenverarbeitung bleiben funktional unverändert. Es entstehen keine zusätzlichen kostenpflichtigen Dienste, Secrets, Rechte oder verpflichtenden Freigabeschritte.

## Qualität und Freigabe
Der CodeQL-Pin aus QA-Draft #759 ist gegenüber der unveränderten Stable-Dateibasis übernommen und hatte im Original-PR einen erfolgreichen echten CodeQL-JavaScript/TypeScript-Lauf sowie die vorhandene Revisionsmatrix. Die vollständigen neuen MID Source-, Bot-, ZIP-, Installer-, Worker-, Pages- und Stable-Gates bleiben Voraussetzung. Diese Release-Notiz allein belegt keine Veröffentlichung.

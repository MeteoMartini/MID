# MID 0.9.84.62 – Design-/Konsistenz-Audit

## Ziel
Der Stand standardisiert sichtbare Haupt- und Einstellungsflächen dort, wo die historisch gewachsene CSS-Schicht zu unnötig kleiner Schrift, kleinen Touchzielen oder ausgeblendeten Istwetterwerten geführt hat. Meteorologische Funktionen, Datenquellen und Parameterfarben werden nicht verändert.

## Umgesetzt
- Semantische Typografietokens moderat angehoben. Die Änderung betrifft bewusst nur UI-Texte, die diese Tokens verwenden; Diagrammachsen, Kartenlabels und fachlich platzgebundene Beschriftungen werden nicht pauschal vergrößert.
- `Aktuelles Wetter`: Niederschlag, Wind, Feuchte, Sicht und Luftdruck bleiben responsiv sichtbar. Unter 900 px werden fünf Werte auf zwei Zeilen verteilt; bei niedrigem Querformat erscheinen sie weiterhin einzeilig.
- Labels, Werte, Zusatztexte und Tagesminimum/-maximum im kompakten Istwetterkopf erhalten eine lesbarere Mindestgröße.
- Dashboard-Reihenfolge: kleine Erklärungstexte werden lesbarer; Pfeiltasten besitzen größere Bedienflächen.
- 14-Tage-MID-Hinweis: Info-Schaltfläche und Text werden touchfreundlicher/lesbarer.
- Drag-and-drop bleibt vollständig erhalten. Vorhandene Pfeilalternativen werden in der Bedienerklärung klarer genannt.

## Bewusst nicht pauschal geändert
Der Audit findet zahlreiche historische Einzelwerte und `!important`-Kaskaden. Diese werden nicht in einem riskanten Massenschritt bereinigt. Viele kleine Werte gehören zu Karten-, Diagramm- oder Exportbeschriftungen, deren Platzbedarf fachlich geprüft werden muss. Weitere Bereinigung soll komponentenweise erfolgen und jeweils mit Screenshot-/Layoutregression abgesichert werden.

## Dependency-Audit
Der Quellstand ist bei TypeScript 7.0.2, Vite 8.2.2, Recharts 3.10.1 und Capacitor Core 8.5.1 bereits aktuell. MapLibre GL 6.7.0 besitzt mit 6.9.0 ein Minor-Update. Dieses wird in 0.9.84.62 nicht aufgenommen, weil die isolierte Umgebung `npm ci` nicht vollständig laden konnte und daher eine Dependency-/Lockfile-Änderung nicht mit einem vollständigen Build abgesichert werden kann.

## Funktionsschutz
Unverändert bleiben insbesondere:
- Datenquellen und Quellenpriorisierung
- Hyperlokal-/Wetterzwilling-Logik
- Modellfusion und Ensemblelogik
- Radar, Satellit, Komposit und Synoptik
- Warnungen und Gefahrenlogik
- MID-Parameterfarbvertrag und Wetterpiktogramme
- Favoriten, Events, Export, Offline-/Updatepfad und iOS-Logik

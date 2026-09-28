# MID Implementation 0.9.78.71

## Schwerpunkt
Vollständiger Abschluss der 14-Tage-Konfidenz-/Kompaktierungsrunde.

## Änderungen
- Wählbare Konfidenzdarstellung in Einstellungen → Darstellung: **Signalbalken** (Standard), **Ampel**, **Text + Index**.
- 14d-Cockpit und Ensemble-Konsistenzkarten verwenden dieselbe Einstellung.
- Der 0–100-Wert bleibt ein Konfidenzindex, keine Trefferwahrscheinlichkeit. Datenqualität bleibt im Außenring getrennt.
- „Parameter und weitere Zeiträume“ liegt platzsparend hinter einem (i)-Popover statt als großer Disclosure-Block.
- Ensemble-Abruf lädt für die 14-Tage-Tagesauswertung bis zu **15 Kalendertage** Rohstunden, damit der 00:00-Grenzwert des Folgetages den 14. sichtbaren Tag vollständig abschließen kann. Die UI bleibt auf 14 Tage begrenzt.
- Worker-Ensemble-Proxy akzeptiert entsprechend bis zu 15 Tage.
- Event-Stundenkarten behalten die korrigierte Intervallsemantik: Niederschlags-/Sonnenscheindauer sind Intervallwerte; ein Regen-Wettercode am Stundenende darf eine trockene zurückliegende Stunde nicht rückwirkend als Regen klassifizieren. Sonnenschein wird kompakt mit Sonnensymbol dargestellt.
- Appweiter Symbolvertrag ergänzt: eindeutige Mikrometriken dürfen Symbol + Wert nutzen; komplexe/amtliche Begriffe bleiben ausgeschrieben.

## UX
- Signalbalken sind Standard, weil sie auf iPhone Hoch-/Querformat am wenigsten Breite benötigen.
- Ampel und Textdarstellung bleiben optional.
- Randtage erscheinen weiterhin als „teilw.“ statt fälschlich als geringe meteorologische Konfidenz.

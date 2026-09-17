# MID v0.9.85.30 – C10 Aktuell klarer priorisiert

## Ziel

Die Seite **Aktuell** soll das Redesign-Konzept sichtbar umsetzen: zuerst Ortskontext und Warnlage, danach eine eindeutige Wetterkernaussage und erst anschließend zusätzliche Messwerte. Wiederholte Informationen und alte Kachelwirkung werden reduziert.

## Umsetzung

- Der Ortsbereich ist im MID-Next-Design nur noch kompakter Kontextkopf; die dort zuvor zusätzlich gezeigten Niederschlags-/Hazard-Karten werden nicht mehr parallel zur eigentlichen Istwetterfläche wiederholt.
- Die aktuelle Wetterbühne führt vier Kernparameter direkt: Niederschlag, Wind/Böen, Feuchte/Taupunkt und Luftdruck. Sichtweite bleibt als ergänzende Information im Detailbereich erreichbar.
- Der aufgeklappte Messwertbereich wiederholt die Kernparameter nicht nochmals gleichrangig, sondern konzentriert sich auf Sicht/Bewölkung, UVI/Luftqualität sowie Sonnenschein und Astronomie.
- Mobile Safe-Areas und zusätzlicher Abstand zur schwebenden Bottom-Bar verhindern, dass Wetterwerte oder der Seitenabschluss überdeckt werden.
- Kopf, Suche und Favoriten werden etwas kompakter, damit auf kleinen Geräten die Wetterinformation früher sichtbar beginnt.

## Fachliche Grenzen

Datenquellen, Wetterlogik, Warnlogik, Parameterfarben, Piktogramme und Einheiten bleiben unverändert. Die Änderung betrifft ausschließlich Hierarchie, Sichtbarkeit und responsive Anordnung im MID-Next-Design; die klassische Darstellung bleibt unberührt.

## Regression

`test-c10-current-redesign-098530.mjs` schützt die C10-Importschicht, die Entdopplung des Ortsbereichs, vier Kernparameter, den reduzierten Detailbereich und die mobile Safe-Area.

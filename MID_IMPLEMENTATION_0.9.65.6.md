# MID 0.9.65.6 – 24-h-Luftdruck und Hazard-Konsistenz

## Ergebnis
Das rollierende 24-h-Wetterprofil ergänzt den fehlenden **Luftdruckverlauf**, ohne die feste Profilhöhe zu vergrößern. Gleichzeitig verwendet die Hazard-Zeile jetzt denselben appweiten DWD-Warnvertrag wie die übrige Prognose. Die Umschaltung zwischen **1 h** und **3 h** verändert damit nur noch die Darstellung, nicht die fachliche Warnberechnung.

## Luftdruck im 24-h-Profil
- `pressure_msl` war bereits Bestandteil der Stundenprognose und der Einzeldaten; es entstehen keine zusätzlichen Wetter- oder Workerabfragen.
- Zwischen Wind und Wolken liegt eine nur 24 SVG-Einheiten hohe Luftdruckspur mit dynamischer lokaler hPa-Skala, feiner Verlaufslinie und selektiertem hPa-Wert.
- Die übrigen Spuren wurden innerhalb der unveränderten SVG-Höhe von 500 Einheiten leicht verdichtet. Dadurch bleibt das Profil in Hoch- und Querformat platzsparend.
- Legende, ARIA-Beschreibung und Einzeldaten führen Luftdruck konsistent mit.

## Hazard-Konsistenz
- Die Hazard-Berechnung erfolgt nicht mehr aus den für 1 h oder 3 h verdichteten Anzeigepunkten.
- Grundlage ist die finale appweite Stundenreihe ab dem aktuellen Index mit bis zu 96 Stunden Vorlauf. `summarizeDwdWarnings(..., 24)` verwendet dieselben DWD-Schwellen, Vorwärtsfenster und den gleichen 24-h-Startvertrag wie die Warnübersicht.
- Jede sichtbare Zelle übernimmt die stärkste Warnung, deren Gültigkeitsintervall den dargestellten Zeitraum überlappt. 6-/12-/24-/48-/72-h-Schwellen bleiben damit unabhängig von 1 h/3 h fachlich identisch.
- Farben entsprechen den zentralen DWD-Stufen gelb → orange → rot → violett; warnungsfreie Zeiträume bleiben grün.

## Worker und Kompatibilität
Keine zusätzlichen API-, Radar-, Cache- oder KV-Zugriffe. Forecast-Fusion, Nowcast, Hyperlokal- und Sunshine-Duration-Contract bleiben unverändert. Die Änderung liegt fachlich im Frontend; der Worker enthält keine neue Fachlogik und wird nur auf **0.9.65.6** versionssynchronisiert.

## Regression
`scripts/test-weather-profile-pressure-hazards-09656.mjs` schützt die unveränderte Profilhöhe, die kompakte Luftdruckspur und die appweit identische Hazard-Berechnung unabhängig von 1-h-/3-h-Darstellung.

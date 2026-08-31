# MID v0.9.76.29 – Release-Gate-Hotfix nach Run #801

## Befund
GitHub-Actions-Run #801 scheiterte nicht am Produktbuild. Node/npm-Setup, `npm ci`, Dependency-Audit, TypeScript und der Vite-Produktionsbuild waren erfolgreich. Von 605 Regressionstests schlug ausschließlich `scripts/test-thunder-affected-places-route-09151.mjs` fehl.

Die veraltete Erwartung verlangte den früheren UI-Text `+{hidden} weitere im (i)`. Dieser Vertrag wurde bereits mit der bewusst umgebauten mobilen Gewitter-Ortsdarstellung v0.9.76.26/v0.9.76.27 ersetzt: zusätzliche Orte werden nun über sichtbare Restzähler sowie das Disclosure `Weitere Orte anzeigen (...)` zugänglich gehalten.

## Korrektur
- `scripts/test-thunder-affected-places-route-09151.mjs` wurde auf den aktuellen, bereits durch die neueren Gewitter-Regressionen geschützten UI-Vertrag migriert.
- Der Test verlangt jetzt:
  - den Restzähler `+{hidden} weitere` im Kopf,
  - die zusätzliche Rest-Pille,
  - das Disclosure `Weitere Orte anzeigen (...)`,
  - weiterhin die fachlichen Klassen `Jetzt`, `voraussichtlich`, `möglicher Treffer` und `Unsicherheitskorridor`.
- Keine Rücknahme der mobilen Verdichtung und kein Wiederaufbau des alten `(i)`-Schattenpfads.

## Fortgeführte Änderungen aus v0.9.76.28
- Extremwetter: RUC-Rapid-Regenakkumulationen verhindern irreführende 0-mm-Anzeigen im 0–6-h-Fenster.
- Extremwetter: Geländehöhen werden auf runde 10 bzw. 100 m dargestellt.
- 24-h-Profil: nur eine Tagesgrenze bei 24/00 Uhr.
- 24-h-Profil: dezenter Nacht-Hintergrund mit Fade zu Sonnenuntergang und Sonnenaufgang.

## Release-Gate
Run #801 belegt für den unmittelbaren Vorgängerstand bereits erfolgreich:
- `npm ci`
- `npm audit --audit-level=high --omit=dev`
- TypeScript 7.0.2
- Vite 6.4.3 Produktionsbuild
- 604/605 Regressionen grün; einziger Fehler war die oben korrigierte historische UI-Erwartung.

Für v0.9.76.29 sind zusätzlich die neuen v0.9.76.28-Verträge und der migrierte Gewittertest Bestandteil der Regression-Suite.

## Worker
Die fachliche Worker-Änderung aus v0.9.76.28 bleibt enthalten. Ein aktualisierter Worker ist daher im Release weiterhin erforderlich; die kanonische Release-Pipeline kann den semantischen Worker-Diff automatisch erkennen und veröffentlichen.

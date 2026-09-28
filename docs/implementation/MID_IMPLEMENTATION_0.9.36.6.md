# MID v0.9.36.6

## Änderungen
- 14-Tage-Ensemble / kumulierter Niederschlag:
  - P25–P75 nur noch für Vorhersagetag 1–7, analog zum Temperaturdiagramm.
  - Tooltip und Legende kennzeichnen die Begrenzung auf Tag 1–7.
  - Y-Skala berücksichtigt im kumulierten Modus zusätzlich explizit das ENS-Mittel.
  - Fachhinweis ergänzt: Bei stark rechtsschiefen Niederschlagsverteilungen kann das arithmetische ENS-Mittel trotz gemeinsamer Memberbasis außerhalb des zentralen P10–P90-Bereichs liegen. Es wird nicht künstlich geklemmt.
- Desktop-Sektionsnavigation:
  - schmale Rail von 54 auf 64 px verbreitert;
  - horizontaler Overflow der Rail-Navigation gesperrt;
  - kompakte Iconbuttons geometrisch auf die Railbreite abgestimmt;
  - aufgeklappte Rail auf 286 px verbreitert;
  - aufgeklappte Rail mit höherem z-index als die sticky Top-Leiste versehen, damit sie nicht mehr überdeckt wird.

## Prüfung
- 357/357 automatisch erkannte Regressionstests bestanden (vier Laufblöcke wegen Sandbox-Zeitlimit).
- `EnsemblePanel.tsx` und `App.tsx` mit TypeScript-Parser geprüft.
- Cloudflare-Worker mit `node --check` geprüft.

## Worker
Keine funktionale Workeränderung; Workerdatei wird nur auf v0.9.36.6 synchronisiert.

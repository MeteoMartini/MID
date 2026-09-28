# MID v0.9.39.4 – responsive Wetterwerte ohne Abschneiden

Ausgangsbasis: MID v0.9.39.3 / `mid-stable`.

## Anlass

In der mobilen 7-Tage-Karte wurde die neu eingeführte DWD-nahe 6-h-Niederschlagswahrscheinlichkeit durch eine frühere `text-overflow: ellipsis`-Schutzregel abgeschnitten (z. B. `06–12 h · 2%…`). Die Regel verhinderte zwar geometrisches Überlaufen, verlor aber fachliche Information.

## Umsetzung

- Tageskarte: Niederschlagsmenge und Böe bleiben in einer kompakten Zweispaltenzeile; die PoP-/Dauerinformation erhält darunter die volle Kartenbreite.
- Kompakte DWD-Zeitfenster: `06–12h · 2%` statt `06–12 h · 2%`.
- Niederschlagsdauer in engen Ansichten: `15m`, `1½h`, `2h`; `0 min` wird nicht redundant ausgegeben.
- Best-Match-Fallback in engen Ansichten verkürzt auf `bis N%`; der ausführliche Tooltip behält die fachliche Einordnung.
- Klassische 7-Tage-Zeile und Widgets strukturieren Menge, Wahrscheinlichkeit/Dauer sowie Wind in umbrechbare Teilzeilen.
- Fachliche Wettertexte dürfen app-weit nicht mehr per CSS-Ellipsis verloren gehen. Relevante Bereiche: Warnungen, Wettercharakter, Quickfacts, Ensemble-Szenarien, Synoptik, 14-Tage-Wetterlabels, Radar-/Kartenmetadaten, Detailwetterwerte und Schneefallgrenzen.
- Ellipsis bleibt bewusst für Navigation, Such-/Favoritenlisten und vergleichbare nicht-meteorologische Bezeichner erhalten.

## Regression

Neuer Schutztest: `scripts/test-no-clipped-weather-values-09394.mjs`.

Zusätzlich wurden ältere Regressionen, die die inzwischen unerwünschte Ellipsis-Regel explizit verlangten, auf die neue Nicht-Abschneiden-Semantik übertragen.

## Validierung

- 371/371 automatisch erkannte Regressionstests bestanden.
- 99 TS/TSX-Dateien ohne Parsefehler.
- Worker und beide Service Worker per `node --check` geprüft.
- Vollständiger lokaler npm-/Vite-Build bleibt in der isolierten Umgebung durch die nicht vollständig erreichbare npm-Registry blockiert; dies ist kein projektspezifischer Buildbefund.

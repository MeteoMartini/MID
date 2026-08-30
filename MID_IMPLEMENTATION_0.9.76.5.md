# MID v0.9.76.5 – Modell-Init, 24-h-Extrema und Reisewetter-Schneelage

## Modellstand
- Echte Einzelmodelle: veröffentlichter Init wird weiterhin in UTC gezeigt.
- Open-Meteo Best Match: kein einzelner Lauf; Anzeige `Init modellabhängig`.
- Verwendete Quelle ohne publizierte Laufmetadaten: `Init von Quelle nicht ausgewiesen` statt Gedankenstrich.
- `Quelle bereit` bleibt von `Eingeflossen` getrennt.

## 24-h-Temperaturprofil
- Grundlage bleibt die finale kanonische stündliche Kurve.
- Ein Maximum und ein Minimum des rollenden 24-h-Fensters werden direkt an ihren tatsächlichen Stundenpunkten markiert.
- Sichtbare Beschriftung enthält nur den gerundeten Temperaturwert.
- Der 3-h-Modus verdichtet nur die Anzeige; die Extremsuche bleibt stündlich.

## Reisewetter
- Präferenz `Hohe Schneelage` erzwingt den historischen Schneehöhenabruf.
- Ist dieser nicht verfügbar, bricht die Schneeoptimierung transparent ab statt auf Schneefall umzudeuten.
- Ranking verwendet Schneehöhe und erwartete Schneedeckendauer; kumulierter Schneefall wird nicht gewichtet.
- Kachel zeigt bei vorhandener Schneehöhe primär `Schneelage` / Ø Schneehöhe und zusätzlich `Schneefall Σ`.

## Langfrist
Siehe `MID_LONG_RANGE_COST_NEUTRAL_EXPANSION_0.9.76.5.md`. Es wurden in diesem Patch keine neuen kostenpflichtigen Dienste oder Zugangsdaten aktiviert.

## Worker
Keine fachliche Worker-Änderung. Ein Versionssync darf den Worker-String ändern; die semantische Worker-Erkennung muss dies als nicht fachlich behandeln.

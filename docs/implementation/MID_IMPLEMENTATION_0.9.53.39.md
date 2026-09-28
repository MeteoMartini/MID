# MID v0.9.53.39

## Current-Temperatur: Fast-/Full-Pass ohne Rücksprung

Der beim Start beobachtete Ablauf „zunächst ca. 19 °C, anschließend wieder 22 °C“ wurde als Übergangs- und Cacheproblem zwischen dem schnellen Stationspfad und der nachgelagerten modellgestützten Hyperlokalanalyse behandelt.

- Der kurzlebige Fast-Pass reicht seine frischen Rohkandidaten für maximal sechs Minuten ausschließlich im Arbeitsspeicher an den Full-Pass weiter. Ein getrennt gecachter, wenige Minuten älterer Full-Pass kann damit amtliche aktuelle Beobachtungen nicht mehr verdrängen. Es entsteht kein zusätzlicher Netzwerkabruf.
- Der App-Zustand bevorzugt bei einer materiellen Temperaturänderung eine feldbezogen jüngere Temperaturbeobachtung gegenüber einem älteren, nur formal reichhaltigeren Analysezustand.
- Die transienten `station`-/`station-provisional`-Caches besitzen ab diesem Release eine neue interne Cachegeneration. Fachlich inkompatible Stationsanalysen aus v0.9.53.38 und älter werden nicht wiederverwendet. Favoriten und andere Nutzerdaten sind davon ausdrücklich nicht betroffen.
- Ein expliziter `forceFresh`-Lauf umgeht jetzt auch den persistenten Stationsanalysecache sowie den In-Memory-Stationsanalysecache. Die normalen Cachezeiten der Quellendienste bleiben unverändert.

## Stärkerer aktueller Mehrstationskonsens am Tag

Die direkte 2-m-Temperaturstütze wurde für den Current-Fall präzisiert. Mindestens drei frische, nahe und eng übereinstimmende Messpunkte dürfen auch tagsüber einen klaren Zielpunkt-Gradientenfehler stärker schließen. Alte, entfernte, schwach gewichtete oder widersprüchliche Beobachtungen behalten die konservativen bisherigen Grenzen; eine Einzelstation kann die Korrektur weiterhin nicht erzwingen.

Ein Regressionstest mit Modell-/Restfeldwert um 22,6–22,8 °C und vier kohärenten Beobachtungen um 19 °C landet mit der neuen Logik bei rund 19,7 °C statt wieder in Richtung 22 °C.

## 90-Minuten- und 24-Stunden-Konsistenz

Die Temperaturpfade wurden erneut geprüft und als Required Regression abgesichert:

- Current verwendet nur einen feldbezogen verwendbaren Stationsanker.
- `finalizeForecastHours` übernimmt denselben aktuellen Temperaturanker.
- `applyHyperlocalForecastHours` blendet die Korrektur in der operativen Stundenreihe zeitlich aus.
- Die Kurzfristsektion rendert `displayHours`/`displayMinutes15`; die ersten sechs 15-Minuten-Schritte bilden 90 Minuten, anschließend folgt dieselbe kanonische Reihe bis 24 Stunden.
- Es existiert kein paralleler Rohmodell-Temperaturpfad für die sichtbare 90-min-/24-h-Leiste.
- Die aktuelle gefühlte Temperatur übernimmt denselben lokalen Temperaturversatz wie die aktuelle 2-m-Temperatur; auch die Short-Term-Stunden führen diesen Versatz bereits kanonisch mit.
- Temperaturbezogene Diagnosechips (`Messkonsens aktiv`, `ΔT`) werden nur noch angezeigt, wenn die Temperatur selbst feldbezogen frisch ist. Sind lediglich andere Stationsfelder aktuell, kennzeichnet die Hyperlokalzeile die Temperatur ausdrücklich als `Best Match`.

## Datenfluss

Die normalen DWD-/METAR-/Stationsabfragen und ihre Quellencachezeiten wurden nicht verkürzt. Der Fix nutzt bestehende Antworten und eine sehr kleine temporäre In-Memory-Weitergabe der Fast-Pass-Kandidaten. Zusätzlicher periodischer Traffic entsteht nicht.

## Regression

Neu: `scripts/test-current-temperature-cache-transition-095339.mjs`.

# MID 18.2.1 · Skybar/Wettertext-Kohärenz · v0.9.85.72

## Befund aus dem Smartphone-Screenshot

Im 90-Minuten-Bereich konnte ein 15-Minuten-Zeitschritt gleichzeitig eine dünne graue Skybar-Stufe und den Text „Bedeckt“ zeigen. Das ist fachlich inkonsistent: Die Skybar verwendet die finalisierte **Gesamtbewölkung**, während der trockene Wettertext bislang in bestimmten Fällen noch den Roh-Wettercode oder das Maximum aus Gesamt- und Tiefbewölkung verwenden konnte.

## Korrektur

- Für trockene Kurzfrist-Zeitschritte wird der Himmelszustand immer gegen die finalisierte Gesamtbewölkung plausibilisiert.
- Gesamtbewölkung ist primär. Tiefe Bewölkung ist nur noch Fallback, falls Gesamtbewölkung wirklich fehlt.
- „Bedeckt“ wird bei trockener Lage nur bei >= 87,5 % Gesamtbewölkung ausgegeben.
- Nebel bleibt eine eigene Ausnahme und wird weiterhin über Sicht/Feuchte sowie vorhandene Nebelcodes abgesichert.
- Niederschlags-/Gewittercodes bleiben von dieser reinen Wolkenkorrektur unberührt.
- Da 90-Minuten-Karten, Wettertext, Piktogramm, Tooltip und Skybar dieselbe finalisierte Kurzfristreihe verwenden, wirkt die Korrektur in allen Kurzfristdarstellungen konsistent.

## RUC-Bewölkung

Der aktuelle MID-RUC-Pfad nutzt ICON-D2-RUC `CLCT` (Gesamtbewölkung) und `CLCL` (tiefe Bewölkung) im verpflichtenden **stündlichen** Forecastkern; `CLCM`/`CLCH` sind optionale stündliche Spezialfelder. Die 15-Minuten-Kurzfrist interpoliert diese kanonischen Zustandsfelder zwischen Stundenwerten. Das ist keine native 15-Minuten-`CLCT`-Mess-/Modellfolge.

Feinere RUC-Cadencen bleiben nur für tatsächlich parameter-nativ vorhandene Rapid-Felder aktiv. Daher wird in MID nicht behauptet, die 15-Minuten-Skybar basiere bereits auf nativer 15-Minuten-Gesamtbewölkung.

## Regression

`scripts/test-mid-18-2-1-skybar-cloud-coherence-098572.mjs`

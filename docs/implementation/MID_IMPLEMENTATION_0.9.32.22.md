# MID v0.9.32.22

## Niederschlagsformen und Schneemengen

- Die zentrale Niederschlagsform-Logik bleibt WMO-/Best-Match-phasentreu und wird nun auch für die Regime-Beschriftung der 7-Tage-Cockpitkarten verwendet. Dadurch werden Schnee, Schneeschauer, Schneeregen, Schneeregenschauer, Schneegriesel, Sprühregen und gefrierende Formen nicht mehr pauschal als „Regen“ oder „Schauer“ beschriftet.
- Schneefall wird überall dort, wo das Modell ein explizites `snowfall`-Feld liefert, zusätzlich zur Niederschlags-Wasseräquivalentmenge kompakt in Zentimetern ausgegeben, z. B. `2,0 mm · ❄ 3,4 cm`.
- Es erfolgt keine pauschale Umrechnung von mm zu cm. Die cm-Angabe verwendet das explizite Open-Meteo-/Best-Match-Schneefallfeld; Open-Meteo führt `snowfall` bzw. `snowfall_sum` in cm und `precipitation` in mm.
- Kurzfrist-, 24-h-, Tages-, Detail-, Meteogramm-, Ensemble-, Wasserwetter- und Widgetdarstellungen nutzen die gemeinsame Mengenformatierung, soweit dort Schneefalldaten vorhanden sind.
- Die Ensemble-Niederschlagsphase berücksichtigt die bereits unterstützten gemischten/gefrierenden WMO-/DWD-Codes konsistent.

## Regression

- Neue Schutzregression `test-precipitation-form-snow-units-093222.mjs` für Phasentreue, Tagesbeschriftung und zusätzliche cm-Schneemengenanzeige.

# MID 0.9.84.51

## Aktuelles Wetter
Das freigegebene Designkonzept wurde mit dem bestehenden MID-Piktogrammset umgesetzt. Piktogramm, Temperatur, Wetterzustand und gefühlte Temperatur bilden die Primärinformation. Darunter folgt eine responsive Kernparameterzeile: auf kleinen Displays Niederschlag, Wind und Feuchte; auf größeren zusätzlich Sicht und Luftdruck. Tmin/Tmax bleibt als eigener Tagesbereich erhalten.

## Niederschlagsintensität
Die bisherige Lücke bei frischem Present Weather wurde geschlossen. Der Text `Regen` entstand, weil `synopticPhenomenonDescription()` die Intensitätspräfixe bisher für Regen/Schauer/Schnee nicht ausgab, obwohl `synopticPhenomenonPictogram()` sie bereits dekodierte. Ab 0.9.84.51 gelten Text und Piktogramm gemeinsam: `-` leicht, kein Präfix mäßig, `+` stark. Damit wird `RA` zu `Mäßiger Regen`.

Zusätzlich wird die tatsächliche zeitliche Auflösung eines frischen Stations-Niederschlagsfeldes an die zentrale Intensitätsklassifikation weitergegeben. Eine 10-Minuten-Menge wird damit nicht mehr wie eine Stundenmenge interpretiert. Fehlt trotz beobachtetem Niederschlagsphänomen eine belastbare Rate, zeigt die Kernparameterzeile keinen künstlichen 0-mm/h-Wert.

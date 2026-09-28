# MID 0.9.84.61

## Wetterdeutsch
Zeitpunktbezogene Wetterzustände verwenden app-weit die meteorologisch passende Singularform. Grundlage sind die DWD/WMO-ww-Bezeichnungen: beispielsweise ww 80 „Leichter Regenschauer“, ww 81 „Mäßiger bis starker Regenschauer“ und ww 82 „Sehr starker Regenschauer“. Entsprechend wurden Schnee-, Schneeregen-, Graupel- und Hagelschauer vereinheitlicht.

METAR/SPECI-Present-Weather bleibt phänomenologisch codiert (`-`, ohne Präfix, `+` = leicht, mäßig, stark). DWD-SYNOP kann dagegen einen numerischen ww-Code liefern; dieser wird im Bereich „Aktuelles Wetter“ nun direkt erkannt und mit demselben zentralen deutschen WMO/DWD-Text sowie der korrespondierenden MID-Piktogrammintensität angezeigt.

## Start-/Hyperlokal-Performance
Die Datenbasis wurde nicht reduziert. Stattdessen priorisiert MID den kritischen Istwetterpfad:
- Fast-Observation startet 80 ms früher.
- Ensemble-Bootstrap beginnt 160 ms später.
- Nichtkritische UI-Chunks werden erst nach Forecast/Station oder spätestens nach 700 ms vorgeladen.
- Der vollständige Hyperlokal-Pass folgt 100 ms früher nach dem provisorischen Stationsstand.

Damit sinkt die Konkurrenz um mobile Netzwerk- und Main-Thread-Ressourcen, während die finale Beobachtungsfusion mit DWD CDC/SYNOP, METAR/SPECI und den bestehenden Fallback-/Zusatzquellen unverändert vollständig bleibt.

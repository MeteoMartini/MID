# MID v0.8.33.12

## Konsistenz von Niederschlagsmenge und -wahrscheinlichkeit

In Best-Match-Prognosen konnten sehr kleine deterministische Niederschlagsimpulse von 0,1 mm gleichzeitig mit 0 % Niederschlagswahrscheinlichkeit auftreten. MID wertete die Menge und den Wettercode bislang unmittelbar als „leichten Regen“, obwohl das probabilistische Signal den Impuls nicht stützte.

Die Ursache liegt in getrennten Prognosefeldern:

- die stündliche Niederschlagsmenge und der Wettercode stammen aus dem deterministischen Best-Match-Feld,
- die Niederschlagswahrscheinlichkeit wird separat aus Ensembles für das Ereignis von mehr als 0,1 mm in der vorausgehenden Stunde bestimmt,
- die konkrete Modellquelle kann innerhalb von Best Match je Variable und Zeitraum wechseln und wird in der API-Antwort nicht ausgewiesen,
- zusätzlich ließ die bisherige MID-Trockenkorrektur nur Mengen bis 0,05 mm verschwinden; ein auf 0,1 mm gerundeter Impuls blieb daher sichtbar.

MID führt nun eine zentrale Forecast-Konsistenzprüfung aus:

- höchstens 0,15 mm bei höchstens 5 % werden als probabilistisch ungestützte Spur behandelt,
- Menge sowie Regen-, Schauer- und Schneeanteile werden in diesem engen Fall auf 0 gesetzt,
- ein reiner Niederschlags-Wettercode wird auf den trockenen, zur Bewölkung passenden Himmelszustand zurückgeführt,
- Nebel bleibt erhalten,
- Mengen über 0,15 mm oder Wahrscheinlichkeiten ab 6 % bleiben unverändert sichtbar und werden nicht künstlich entfernt.

Die Prüfung greift zentral in:

- stündlicher und 15-minütiger Best-Match-Aufbereitung,
- Tageswerten,
- Mehrquellen-Fusion und MOSMIX-Anpassung,
- Radar- und Gewitternowcast-Endstufe,
- stündlicher Detailansicht,
- Kurzfristvorhersage,
- Tages-/Stunden-Abgleich,
- Routenwetter und allen weiteren Hour-/Day-basierten Auswertungen,
- nativem Widget,
- Worker-Mehrquellenprognose und Modelllauf-Push-Auswertung.

Damit erscheinen 0,1 mm bei 0 % nicht länger als sicherer Regenimpuls, während meteorologisch relevante deterministische Signale geschützt bleiben.

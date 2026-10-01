# MID v0.9.85.132

## Niederschlag · einheitliche Zeitangaben
- Aussagen wie „Niederschlag voraussichtlich bis …“ verwenden jetzt dieselbe Intervallzeit wie die sichtbaren Niederschlagsdiagramme.
- Die bisher mögliche stündliche Verschiebung der Endzeit um eine zusätzliche Stunde wurde entfernt.
- Innerhalb der Kurzfrist wird die finalisierte 15-Minuten-Reihe bevorzugt; sie enthält bereits die operative RUC-/Radar-/Modellfusion. Nur bei fehlender vollständiger 15-Minuten-Abdeckung wird auf die intervallkorrigierte Stundenreihe zurückgefallen.
- Reine Niederschlagswahrscheinlichkeit ohne dargestellte messbare Niederschlagsmenge verlängert keine vermeintliche Niederschlagsdauer mehr.
- Niederschlagsphasen hinter dem +2-Stunden-Radarfenster werden aus derselben kanonischen Zeitreihe abgeleitet wie Kurzfrist, 24-h-Profil und weitere Prognosedarstellungen.

## Konsistenz
- Open-Meteo-Akkumulationen am Intervallende werden vor sichtbaren Zeitaussagen auf den zugehörigen Vorwärtsslot normalisiert.
- Die Endzeit eines letzten nassen Stundenintervalls wird dadurch nicht mehr pauschal um eine weitere Stunde verlängert.

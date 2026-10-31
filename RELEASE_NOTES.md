# MID v0.9.85.386 – Wetterprofile: fehlende Niederschlagsdaten nicht als trocken ausgeben

- Kurzfrist- und 24h-Profil zeigen unbekannte Mengen und Wahrscheinlichkeiten nicht mehr als 0 mm oder 0 %. Die Aggregation unterscheidet echte Null und nicht verfügbare Beiträge.
- Niederschlagsraten und Einzeldaten kennzeichnen nicht verfügbare Werte. Die bisherige Zeitintervallzuordnung und meteorologische Phasensemantik bleiben erhalten.
- Kompakte 14d-Ensembleangaben unterscheiden sichere Trockenheit, geringe Mengen, kleine bekannte Niederschlagswahrscheinlichkeit und unvollständige Daten; eine fehlende Phase wird nicht als Gewitter ausgegeben.
- Fokussierte Negativtests für null/NaN/Infinity, echte Null und PoP. Amtliche Warnungen, Modellfusionsgewichte, RUC und Karten bleiben unverändert.
- Der vollständige appweite Design-/Geräteaudit #523 ist noch nicht abgeschlossen. Release nur über die reguläre SHA-gebundene Kette nach konfliktfreier .385-Promotion.

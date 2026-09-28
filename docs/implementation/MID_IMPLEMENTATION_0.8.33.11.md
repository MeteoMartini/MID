# MID v0.8.33.11

## Hyperlokale Konsistenz des aktuellen Himmelszustands

Die Hauptkarte „Aktuelles Wetter“ verwendete bislang den Best-Match-Wettercode, während die Bewölkungskarte bereits den frischen hyperlokal analysierten Wolkenbedeckungsgrad darstellte. Dadurch konnte bei 7/8 gleichzeitig „Bedeckt“ und „stark bewölkt“ erscheinen.

Nun gilt bei trockenem aktuellem Wetter:

- frische lokal analysierte Bewölkung steuert Text und Piktogramm der Hauptkarte,
- 0/8 = wolkenlos,
- 1–2/8 = gering bewölkt,
- 3–4/8 = aufgelockert bewölkt,
- 5–7/8 = stark bewölkt,
- 8/8 = bedeckt,
- belastbarer lokaler Nebelbefund hat Vorrang,
- Niederschlagsarten behalten grundsätzlich Vorrang vor der reinen Bewölkungsklassifikation.

Ohne frische lokale Bewölkungs- oder Sichtbeobachtung bleibt Best Match unverändert maßgeblich.

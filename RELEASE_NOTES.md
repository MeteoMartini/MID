# MID v0.9.85.288

- **Sichtweiten- und Nebelanzeige:** Nicht verfügbare Sichtweiten oder Luftfeuchtewerte werden nicht mehr als tatsächlich gemessene Null behandelt. Unbelegte Nebel- und Dunstsignale aus fehlenden Daten werden vermieden.
- **Echte Extremwerte bleiben erhalten:** Eine valide Sichtweite von 0 m wird weiterhin als außergewöhnlich schlechte Sicht behandelt. Vorhandene Wettercodes und vertrauenswürdige Wetterbeobachtungen behalten ihre eigene Aussagekraft.
- **Mehr Datensicherheit:** Fehlende oder beschädigte Werte und aus Caches zurückgelesene Lücken werden in der gemeinsamen Sichtweitenklassifikation konsistent behandelt. Amtliche Warnungen, Datenquellen und Modellberechnungen sind unverändert.

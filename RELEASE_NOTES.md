# MID v0.9.85.285

- **Tageswerte ganzer Kalendertage:** Die heutige Niederschlagssumme wird nicht länger durch die nur noch verbleibenden Stunden ersetzt. Bei unvollständigen Stunden bleibt der Tageswert der gültigen Tagesquelle erhalten.
- **23-/24-/25-Stunden-Tage:** Nur eine lückenlose echte Stundenfolge inklusive nachfolgendem Akkumulationsende darf die Tageswerte aus Stunden rekonstruieren. Fehlende Modellstunden oder Tageslücken dürfen nicht als null Millimeter gelten.
- **Skybar „Aktuell“:** Bewölkung und Sonnenschein der laufenden vollen Modellstunde bilden den Hintergrund; 15-Minuten-Nowcast-Niederschläge bleiben als unabhängige Ebene mit den unveränderten Intervallzeiten erhalten.
- **Fachliche Abgrenzung:** Keine Änderung amtlicher Warnungen, RUC-Kompression, numerischer Wetterwerte oder Modellkarten. Vollständig fehlende providerseitige Tagessummen werden weiterhin im eigenen Data-QA-Arbeitspaket #397 untersucht.

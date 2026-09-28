# MID v0.9.32.16

- 24-h-Kurzfristkacheln (`Wärmster Zeitpunkt`, `Kühlster Zeitpunkt`, `Windhöhepunkt`, `Niederschlagsspitze`) verwenden jetzt exakt denselben 24-Stunden-Datensatz wie die sichtbare 24-h-Leiste. Die bisherige 12-h-Auswertung bzw. die abweichende globale Niederschlagswahrscheinlichkeit wurde entfernt.
- Favoriten erhalten mit `mid:favorites:updated-at` eine eigene Änderungsrevision. Eine spätere Geräte-/PWA-Synchronisation darf eine neuere lokale Favoritenliste nicht mehr mit einem älteren Favoritenstand aus einem ansonsten neueren Gesamtsnapshot überschreiben.
- Wird bei der Synchronisation ein älterer Favoritenstand erkannt, bleibt die lokale Liste erhalten und der zusammengeführte Stand wird unmittelbar wieder in den Geräteverbund publiziert.
- POI-Namensabgleich toleriert stabile Namensvarianten bzw. Sponsorenpräfixe wie `ista Borussia-Park` ↔ `Borussia-Park`, sofern die Ortsnähe weiterhin gegeben ist.

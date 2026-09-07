# MID v0.9.79.20 — CI-Regressionen an aktuelle Warnzeitdarstellung angepasst

- Release #929 scheiterte nicht am TypeScript-/Vite-Build, sondern an drei veralteten Regressionserwartungen nach der fachlich beabsichtigten Warnzeit- und Wetterprofiländerung aus v0.9.79.19.
- Die 24-h-Wetterprofil-Tests erwarten für die stärkste Einschränkung nun korrekt Warnstufe plus kanonisches Warnzeitfenster statt nur des Zeitpunkts eines Einzelwerts.
- Die Nebel-/Sicht-Signalkarte behält weiterhin ihren punktbezogenen Zeitpunkt.
- Der isolierte Warnzeit-Datumstest stellt den appweiten Lokalzeit-Suffix-Helfer nun explizit bereit und prüft die Ausgabe mit `LT`.
- Die produktive Warn-, Windrichtungs-, Wetterprofil- und Zeitzonenlogik bleibt unverändert.
- Keine fachliche Workeränderung.

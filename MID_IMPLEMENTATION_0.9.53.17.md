# MID 0.9.53.17

## Wiederherstellung der vollständigen Vorhersagekette

Nach der Resilienz-Erweiterung in 0.9.53.15/16 wurde ein funktionaler Rückschritt sichtbar: Ein technisch verfügbarer, aber feldärmerer Ersatzprovider konnte die vollständige Open-Meteo-Best-Match-Kernvorhersage ersetzen. Dadurch fehlten unter anderem Niederschlagswahrscheinlichkeit, Sichtweite und weitere Felder; die gewohnte Kacheldarstellung änderte ihre Quellen-/Fallback-Semantik.

- Die sichtbare Kernvorhersage verwendet wieder Open-Meteo `best_match` als vollständige, kanonische Datenstruktur und wird bei Foreground-Abrufen direkt priorisiert.
- Der appweite Open-Meteo-Guard bleibt aktiv: Foreground/Normal/Background werden koordiniert, parallel begrenzt und bei HTTP 429 gemeinsam abgekühlt.
- Der Worker bleibt als zweiter Resilienzpfad erhalten, darf für `forecast-core` aber ausschließlich vollständiges Open-Meteo Best Match oder einen zuvor gespeicherten vollständigen Best-Match-Stand liefern.
- MET Norway bleibt als zusätzlicher Wetterdienst grundsätzlich erhalten, wird jedoch nicht mehr als strukturell unvollständiger Ersatz in die normalen MID-Vorhersagekacheln eingespeist.
- Alte v0.9.53.15/16-Fallback-Caches werden beim Lesen geprüft. Payloads mit `fallback:true` beziehungsweise MET-Norway-Core-Herkunft werden verworfen. Der neue Cache-Namespace ist `mid:forecast-core:v3`; der Worker-Edge-Cache wurde ebenfalls invalidiert.
- Stunden- und Tagesobjekte tragen wieder die etablierte Best-Match-Herkunft. `provider-fallback` und `provider-no-probability` sind aus der Standardprognose entfernt.
- Die aktuelle Niederschlagswahrscheinlichkeit und die aktuellen Wetterkacheln verwenden wieder die etablierte Darstellung; die in 0.9.53.16 eingeführte Ersatzmodell-Sonderdarstellung entfällt.
- Die DWD-nahe Tages-PoP-Logik aus 0.9.53.14 bleibt erhalten: 0 % ohne Zeitfenster; 6-h-Zeitfenster nur bei deutlich isoliertem Schwerpunkt, sonst 00–24 h.
- Event-, Favoriten-, Durable-Storage-, Synchronisations- und hyperlokale Verbesserungen der 0.9.53-Reihe bleiben unverändert erhalten.
- Neue Required-Regression `scripts/test-core-forecast-restoration-095317.mjs` schützt die vollständige Best-Match-Kernvorhersage und verhindert ein erneutes Cross-Provider-Downgrade der Standardkacheln.

## MID v0.9.78.64 – wissenschaftlicher Audit

Aktuelle Änderungen, Begründungen und Grenzen: [Implementierung 0.9.78.64](MID_IMPLEMENTATION_0.9.78.64.md). Lokale Prüfergebnisse: [Validierung](MID_VALIDATION_0.9.78.64.md).

Der 14d-Konsistenzindex ist keine kalibrierte Trefferwahrscheinlichkeit. Plausible Ensemble-Minderheitslösungen bleiben in den Unsicherheitsbändern erhalten.

## MID v0.9.65.7 – aktueller Warnzustand kompakt

- Die automatische Warnkarte zeigt geschlossen ausschließlich den **aktuell gültigen Warnzustand**; die höchste aktuell aktive Stufe färbt den Kopf.
- Statusformulierungen sind prädikativ korrekt, z. B. **„Aktuell: extrem“** bzw. **„Aktuell: stark“**.
- Tagesgruppen, Zeitfenster, Kennwerte und Detailtexte erscheinen erst nach dem Aufklappen.
- Amtliche CAP-Warnungen bleiben direkt darunter unverändert vollständig erhalten.
- Keine zusätzlichen Daten- oder Workerabfragen; Worker-Fachlogik unverändert, nur auf v0.9.65.7 synchronisiert.

## Versionsschema

- Funktionsrelease (`0.7.x` oder äquivalent `0.7.x.0`) für neue eigenständige Funktionen.
- Wartungsrelease (`0.7.x.y` mit `y ≥ 1`) für Korrekturen und inkrementelle Weiterentwicklung eines Funktionsstands.

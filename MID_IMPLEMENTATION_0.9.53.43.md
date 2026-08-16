# MID v0.9.53.43 – appweites Designsystem und UI-Standardisierung

## Ziel

Die in v0.9.53.42 identifizierten Designverbesserungen werden nicht als lokale Einzelkorrekturen, sondern als gemeinsame UI-Grundlage umgesetzt. Wetterlogik, Datenabrufe, Cache-Regeln und fachliche Statusberechnungen bleiben unverändert.

## Zentrale Design-Tokens

- Gemeinsame Abstands-, Radius- und Typografie-Tokens für dichte, normale und komfortable Darstellungen.
- Große Karten, interne Panels und Bedienelemente verwenden klar getrennte Radienstufen statt weiterer lokaler Sonderwerte.
- Besonders kleine Metatexte in hochfrequenten Modulen (Current-Metriken, Kurzfristdetails, Widget, Eventdetails und Modellstatus) werden auf zentrale, dichteabhängige Typografie-Tokens geführt.
- Es gibt bewusst keine pauschale globale Mindestschriftgröße; Diagramme und fachlich hochdichte Spezialdarstellungen bleiben vor Layoutbruch geschützt.

## Semantische Statusfarben

- Die appweiten Bedeutungen `good`, `watch`, `caution`, `info` und `neutral` besitzen gemeinsame Theme-abhängige Farbvariablen.
- Eventstatus, Event-Ampel, Warn-/Hinweiskarten, Modellquellenstatus, Wetterzwilling-Aktivstatus und Push-Warnstatus verwenden diese Semantik.
- Bestehende Event-Farbvariablen sind auf die neuen globalen Status-Tokens abgebildet, damit keine zweite Bedeutungslogik entsteht.

## Pills und Badges

- Häufig verwendete Pills/Badges teilen eine gemeinsame Radius- und Zeilenhöhen-Geometrie.
- Fachliche Varianten behalten ihren Inhalt, ihre Zustandsklasse und ihre kompakte Ausprägung; nur die Grundgeometrie und die Typografie werden standardisiert.

## Disclosure-Primitiv

- Neues `MidDisclosure`-Primitiv für native, zugängliche `details/summary`-Interaktionen.
- Migriert wurden die Analysewerkzeuge in den Einstellungen sowie die ausführliche Event-Detail- und Modellstandansicht.
- Geschützte bzw. fachlich spezialisierte Disclosure-Strukturen bleiben unverändert, wenn Regressionen ihre konkrete DOM-Struktur absichern.

## Datenfluss / Worker

- Keine neuen Datenquellen oder Requests.
- Keine Cache-TTL-Änderung.
- Keine Wetter-/Forecast-/Hyperlokal-Logik geändert.
- Worker funktional unverändert; nur Releaseversion synchronisiert.

# MID v0.9.85.128

## Sichtbar
- „Pollenflug“ steht unter „Inhalte & Navigation“ jetzt in einer eigenen Sektion „Gesundheitswetter“ und bleibt vollständig optional.
- Die kompakte Pollenvorhersage priorisiert heute tatsächlich belastende Pollenarten; bei keiner Belastung erscheint eine ruhige Zusammenfassung. Die Drei-Tage-Details bleiben aufklappbar und sind besser per Touch und Tastatur bedienbar.
- DWD-Quelle, Aktualitätsstand und die bestehenden Belastungsbegriffe bleiben sichtbar und unverändert.

## Technisch
- CodeQL-Eingabepfade für amtliche Warnwahrscheinlichkeiten und den Bergwetter-Browsertest wurden gehärtet.
- Der aktuelle High-Severity-`brace-expansion`-Befund wird innerhalb des kompatiblen 5.x-Pfads geschlossen; der bekannte `uuid`-Dev-/iOS-Werkzeugpfad wird nicht mit einem inkompatiblen Force-Upgrade umgangen.
- `actions/download-artifact` ist im RUC-Publishpfad auf v8.0.1 und einen vollständigen Commit-SHA aktualisiert.
- Meteorologische Prognose-, Warn-, DWD-Pollen- und Worker-Datenlogik bleiben unverändert.

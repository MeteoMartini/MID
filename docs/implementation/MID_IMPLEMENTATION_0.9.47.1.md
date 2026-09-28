# MID v0.9.47.1 – Buildfix

Ausgangsbasis: MID v0.9.47.0.

## Ursache

Die neue parameterbezogene Quellenanzeige typisierte das lokale Array über `NonNullable<Station['fieldSources']>[StationAnalysisField]`. Da `StationFieldSources` ein `Partial<Record<...>>` ist, blieb der Indexzugriff trotz `NonNullable` als `StationFieldSource[] | undefined` typisiert. GitHub Actions brach deshalb im Schritt `verify:types` mit TS18048 bei `rows` und `group.rows` ab.

## Korrektur

`fieldSourceRows()` hat nun den expliziten Rückgabetyp `StationFieldSource[]`, das lokale `rows` ist ebenfalls `StationFieldSource[]`. Die Semantik bleibt identisch: die Funktion liefert stets ein Array, leer wenn keine Quellen vorliegen.

Keine fachliche Quellen-, Ensemble- oder UI-Änderung gegenüber v0.9.47.0. Worker nur auf v0.9.47.1 versionssynchronisiert.

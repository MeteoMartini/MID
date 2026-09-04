# MID Implementation 0.9.78.52

## Anlass
GitHub-Release #884 scheiterte nach erfolgreichem ZIP-Import, `npm ci` und Dependency-Audit im TypeScript-7-Check.

## Fehlerursache
Die in v0.9.78.50/51 ergänzte probabilistische Warnfenster-Logik verwendete drei nicht zum kanonischen `Hour`-Typ gehörende Feldnamen:

- `hour.precip` statt `hour.precipitation`
- `hour.temp` statt `hour.temperature`
- `sumForward('precip', ...)` statt `sumForward('precipitation', ...)`

TypeScript 7 blockierte den Build daher mit TS2339/TS7053.

## Korrektur
Die probabilistische Warnlogik verwendet jetzt ausschließlich die kanonischen `Hour`-Felder `precipitation`, `temperature` und `snowfall`. Die fachliche Probabilistik aus v0.9.78.50/51 bleibt unverändert erhalten.

Der zuvor festgelegte Einheitenvertrag bleibt ebenfalls unverändert: MID zeigt Knoten ausschließlich als `kt`; `kn` darf nur innerhalb unveränderter amtlicher Originalwarntexte vorkommen.

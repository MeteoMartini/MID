# MID v0.9.53.30 – Favoritenpersistenz und Push-Zuverlässigkeit

## Favoriten

- Jede Favoritenmutation wird sofort synchron in Primär- und Shadow-Snapshot persistiert; der frühere 220-ms-/Idle-Persistenzpfad entfällt.
- Beim App-Start werden Tombstones zwingend auf wiederhergestellte Primär-/Shadow-Daten angewandt. Gelöschte Favoriten können daher nicht aus einem alten lokalen Snapshot zurückkehren.
- Favoriten-Tombstones verfallen nicht mehr nach einem Jahr und werden nicht mehr auf eine feste Anzahl gekappt.
- Ein Geräteabgleich mit lokal noch ungesendeten Änderungen führt vor dem Push trotzdem eine Favoriten-Union einschließlich Remote-Tombstones aus. Lokale Aktualität darf damit nicht länger neu angelegte Remote-Favoriten oder entfernte Favoriten umgehen.
- Der Geräte-Sync-Bridge-Pfad führt nun pull–merge–push statt blindem Push aus.

## Benachrichtigungen

- „Aktiv“ wird nur noch angezeigt, wenn Browser-Push, Worker/KV-Registrierung und ein aktueller Scheduler-Heartbeat bestätigt sind.
- Neuer Worker-Endpunkt `push-status` prüft die konkrete Subscription und den letzten periodischen Prüflauf.
- Neuer Worker-Endpunkt `push-test` sendet eine echte Web-Push-Testmitteilung über VAPID/Push-Service/Service Worker.
- Fehlende Worker-Registrierung kann aus der UI heraus repariert werden, ohne die Browserberechtigung zunächst löschen zu müssen.
- Der Push-Scheduler schreibt einen Heartbeat und paginiert durch alle KV-Subscriptions statt nur die erste Seite zu berücksichtigen.
- Der frühere stille 24-Favoriten-Cut für Push-Regeln wurde entfernt.
- Niederschlagsbeginn nutzt nun die kanonische 15-Minuten-Feldmenge einschließlich Niederschlagswahrscheinlichkeit und `reconcileForecastPrecipitation`; das Vorwarnfenster beträgt bis zu 45 Minuten.
- Vorwarnung und tatsächlicher Beginn desselben Niederschlagsereignisses werden als ein Ereignis behandelt und nicht doppelt gemeldet.

## Verbindliche Verträge

- `MID_STATE_INTEGRITY_CONTRACT.md` verschärft.
- `MID_NOTIFICATION_RELIABILITY_CONTRACT.md` neu.
- Beide Regeln sind in `MID_SOURCE_OF_TRUTH.md` verankert.
- Neue Required Regressionen: `test-favorite-authoritative-persistence-095330.mjs` und `test-push-reliability-095330.mjs`.

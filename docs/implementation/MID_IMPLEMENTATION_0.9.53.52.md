# MID v0.9.53.52 – Netatmo OAuth iOS/PWA navigation hardening

## Ziel

Die Netatmo-Verbindung darf auf iOS/PWA nicht nach einer vorgeschalteten asynchronen Statusprüfung still in MID zurückfallen oder eine frühere 302-Fehlweiterleitung aus Browser-/Edge-Cache wiederverwenden.

## Umsetzung

- Der eigentliche Nutzer-Tap startet die externe Navigation synchron im selben Tab; vor dem `window.location.href` liegt kein `await` mehr.
- Der Worker-Status wird beim Öffnen des Stationsbereichs geladen. Solange er nicht bekannt ist, ist die Verbindungsschaltfläche deaktiviert.
- Jeder OAuth-Start erhält einen eindeutigen `attempt`-Parameter als Cache-Buster.
- Alle Netatmo-302-Antworten des Workers verwenden `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` sowie passende Legacy-No-Cache-Header.
- OAuth-Rückkehrparameter werden auf App-Ebene in `sessionStorage` gesichert, bevor der Stationsbereich gemountet wird.
- `netatmo-status` liefert `WORKER_VERSION`; die Stationsansicht zeigt die tatsächlich antwortende Worker-Version zur Deployment-Diagnose.

## Unverändert

- OAuth-Scope bleibt `read_station`.
- Callback bleibt `?mode=netatmo-callback` auf dem aktiven Worker-Origin.
- Tokenablage bleibt Worker-seitig AES-GCM-verschlüsselt.
- Wetter-, Wetterzwilling- und Lüftungslogik bleiben unverändert.

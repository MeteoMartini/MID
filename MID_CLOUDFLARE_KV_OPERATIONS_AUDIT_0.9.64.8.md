# Cloudflare Workers KV – Operations-Audit v0.9.64.8

## Fortgeführte Einsparungen aus v0.9.63.0

Die damaligen Optimierungen sind im aktuellen Worker weiterhin implementiert und regressionsgeschützt:

| Prüfklasse | Kadenz | Funktion |
|---|---:|---|
| Niederschlag/Gewitter | 5 min | unverändert schnelle Warnprüfung |
| Lüftung | 15 min | vorhandene Raumregeln und Quellen |
| reine Prognoseänderung | 60 min | Material-Change-/Modelllaufalarm |
| keine aktive Regel | 12 h | Registrierung bleibt erhalten |

Weiterhin gelten: bis zu 1.000 KV-Schlüssel pro `list()`-Seite, Fälligkeitsentscheidung aus Metadaten und Subscription-`put` nur bei Zustandsänderung, Benachrichtigung oder einmaliger Metadatenmigration.

## Neue Einsparungen v0.9.64.8

### 1. Idempotente Push-Registrierung

Der Browser synchronisiert seine Push-Konfiguration auch nach einem neuen Appstart. Bislang führte dieselbe unveränderte Konfiguration serverseitig dennoch zu einem `put`, weil `updatedAt` jedes Mal erneuert wurde. Der Worker vergleicht nun den fachlichen Registrierungszustand (Subscription, Favoriten/Regeln, Lüftung, Intervall, Niederschlagsschwelle und App-URL). Ist er identisch, bleibt der vorhandene KV-Eintrag unverändert.

**Folge:** erneuter Appstart bei unveränderten Push-Regeln = **0 zusätzliche KV-Writes**.

### 2. Heartbeat-Budget

Der Erfolg-Heartbeat wurde von maximal etwa 144 Writes/Tag auf maximal **48 Writes/Tag** reduziert. Dazu wird ein erfolgreicher Schedulerlauf höchstens alle 30 Minuten persistiert; Fehler werden weiterhin sofort geschrieben. Die eigentlichen Schedulerläufe und Alarmkadenzen bleiben unverändert. Der Health-Zeitraum wird entsprechend auf 41 Minuten gesetzt, damit der Status zwischen regulären Heartbeats nicht fälschlich auf „unhealthy“ springt.

### 3. Geräte-Sync beim Verlassen der App

`pagehide` erzeugte vorher unabhängig von Änderungen einen neuen verschlüsselten Snapshot mit neuem Zeitstempel und damit einen KV-Write. Nun wird dieser Sicherheits-Push nur noch ausgeführt, wenn `pendingChangedAt` gesetzt ist. Eine kurz vor dem Verlassen noch nicht synchronisierte Änderung wird weiterhin gesichert; ein unveränderter Appzustand nicht erneut geschrieben.

### 4. UI-Persistenz bleibt KV-neutral

Die neue letzte Hauptansicht und der bereits vorhandene Forecast-Cockpit-Horizont sind gerätelokale UI-Zustände. Sie werden vom portablen Geräte-Sync ausgeschlossen. Häufiges Wechseln zwischen „Aktuell“, „Kurzfrist“, „7 Tage“ und „14 Tage“ verursacht deshalb keine KV-Synchronisationswrites.

## Was bewusst nicht verändert wurde

- Die 5-Minuten-Reaktionszeit für Niederschlags-/Gewitter-Push bleibt bestehen.
- Keine Push-Regel oder Datenquelle wurde entfernt.
- Die KV-Subscription-Liste wird weiterhin alle fünf Minuten benötigt, um ohne zusätzliche Infrastruktur zu erkennen, welche Registrierungen fällig sind. Bei bis zu 1.000 Registrierungen bleibt das eine List-Operation pro Lauf (288/Tag).
- Heartbeat-Reads bleiben klein gegenüber dem Read-Budget; die Optimierung konzentriert sich bewusst auf das knappe Write-Budget.
- Wetterzwilling-Archivblöcke, OAuth-Zustände und echte Sync-Änderungen werden weiterhin geschrieben, wenn fachlich notwendig.

## Audit-Ausgabe

`POST ?mode=push-kv-operations-audit` liefert nun `mid.kv-operations-audit.v2` und weist unter anderem aus:

- aktuelle Subscription-Kadenzen,
- modellierte Reads pro Tag,
- Heartbeat-Writes mit Obergrenze 48/Tag,
- idempotente Push-Registrierung,
- write-freien `pagehide` bei unverändertem Geräte-Sync.

# Cloudflare Workers KV – Operations-Audit v0.9.63.0

## Befund

Der bisherige Fünf-Minuten-Scheduler las jede Subscription bei jedem Lauf und schrieb deren Zustand nach jeder Prüfung erneut. Zusätzlich entstanden zwei Heartbeat-Schreibvorgänge pro Lauf. Bei 288 Läufen pro Tag skalierten damit sowohl Reads als auch Writes linear mit allen Subscriptions, auch wenn eine Regel nur auf Prognoseänderungen zielte oder sich kein Zustand geändert hatte.

## Umgesetztes Budget

| Prüfklasse | Kadenz | Erhaltener Funktionsumfang |
|---|---:|---|
| Niederschlag/Gewitter | 5 min | unverändert kurzfristig |
| Lüftung | 15 min | alle vorhandenen Raumregeln und Quellen |
| reine Prognoseänderung | 60 min | Modelllauf-/Prognoseänderungsalarm |
| keine aktive Regel | 12 h | Registrierung bleibt erhalten |

- KV-Metadaten enthalten Schema, Kadenz und Regelanzahl. Der Scheduler listet Metadaten und liest nur in der jeweiligen Zeitscheibe fällige Einträge.
- Die Listen-Seitengröße wurde von 250 auf das von Cloudflare dokumentierte Maximum 1.000 erhöht. Damit genügt bis 1.000 Push-Registrierungen eine List-Operation je Schedulerlauf statt bis zu vier.
- Subscription-Zustand wird nur bei Zustandsübergang, versandter Meldung, Fehleränderung oder einmaliger Metadatenmigration geschrieben. Der rein informative `checkedAt`-Write pro Lauf entfällt.
- Der Heartbeat wird nicht mehr am Anfang und Ende jedes Laufs geschrieben, sondern höchstens einmal je Zehn-Minuten-Fenster; Fehler erzwingen weiterhin sofort einen Heartbeat.
- Keine Alarmregel, wesentliche MID-Funktion oder Datenquelle wurde entfernt.

## Rechenmodell

Bei einem Cronlauf alle fünf Minuten bleiben die List-Operationen abhängig von der Zahl der KV-Seiten. Die vermeidbaren Objektoperationen sinken dagegen deutlich:

- Heartbeat: theoretisch 576 Writes/Tag vorher, höchstens 144 Writes/Tag nachher.
- Eine Subscription nur mit Prognoseänderungsalarm: 288 Reads/Tag vorher, 24 Reads/Tag nachher (−91,7 %).
- Eine Lüftungs-Subscription: 288 Reads/Tag vorher, 96 Reads/Tag nachher (−66,7 %).
- Niederschlag/Gewitter bleibt bewusst bei 288 Reads/Tag, damit die operative Reaktionszeit nicht beschnitten wird.
- Laufende Subscription-Writes fallen im Normalfall vollständig weg und entstehen nur bei tatsächlicher Zustandsänderung.

Der geschützte POST-Modus `push-kv-operations-audit` liefert die aktuellen Subscription-Zahlen, Kadenzen, KV-Seiten und die daraus berechneten Vorher-/Nachher-Budgets. Die Werte sind ein Operationsmodell; Cloudflare-Abrechnung und sonstige Bindings müssen weiterhin im Cloudflare-Dashboard gegengeprüft werden.

## Gegenprüfung mit dem Cloudflare-Vertrag (Stand 20.08.2026)

- Cloudflare zählt Lesen, Schreiben und Löschen je Schlüssel; auch erfolglose Reads zählen. Im Free-Tarif gelten 100.000 Reads, 1.000 Writes und 1.000 List-Requests pro Tag. Im Paid-Tarif sind monatlich 10 Mio. Reads sowie je 1 Mio. Writes und List-Requests enthalten; darüber liegen die dokumentierten Preise bei 0,50 USD je Mio. Reads und 5 USD je Mio. Writes beziehungsweise List-Requests.
- `list()` liefert die zu einem Schlüssel gespeicherten Metadaten ohne anschließendes `get()` und unterstützt bis zu 1.000 Schlüssel je Seite. Die neue Fälligkeitsentscheidung ausschließlich aus kleinen KV-Metadaten folgt damit ausdrücklich Cloudflares Empfehlung, ein `list()` plus `get()` für nicht benötigte Werte zu vermeiden.
- Das Metadatenobjekt bleibt mit Schema, Kadenz und Regelanzahl deutlich unter dem dokumentierten Limit von 1.024 Byte.

Offizielle Referenzen: [KV-Preise](https://developers.cloudflare.com/kv/platform/pricing/), [Schlüssel und Metadaten listen](https://developers.cloudflare.com/kv/api/list-keys/), [KV-Writes und Metadatenlimit](https://developers.cloudflare.com/kv/api/write-key-value-pairs/), [KV-Limits](https://developers.cloudflare.com/kv/platform/limits/).

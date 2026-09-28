# MID v0.9.53.9

## Events & Aktivitäten: Refresh von Grund auf entkoppelt

Die Event-Wetteraktualisierung wurde aus der sichtbaren bzw. lazy geladenen `EventPlannerPanel`-Komponente herausgelöst. Ein neuer UI-unabhängiger Broker (`eventWeatherRefresh.ts`) ist alleiniger Owner für Aktualisierung, Persistenz und Hintergrundüberwachung gespeicherter Events. Die meteorologische Berechnung liegt in der ebenfalls UI-unabhängigen `eventWeatherEngine.ts`.

### Einheitlicher manueller Refresh

- Der Reload in der App-Kopfzeile, `Neu laden` im Event-Center-Popover, der Sammelreload in der Event-Übersicht, der Einzelreload einer Eventkarte und `Event aktualisieren` in den Details verwenden denselben Promise-basierten Broker.
- App-Kopfzeile und Event-Center warten die Event-Neuberechnung tatsächlich ab; sie senden nicht mehr nur ein Fire-and-forget-Browser-Event an eine eventuell noch nicht geladene UI-Komponente.
- Nach jeder Berechnung wird unmittelbar vor dem Commit der aktuellste gespeicherte Event-Datensatz erneut gelesen.
- Ein persistierter manueller Reload-Auftrag wird erst nach erfolgreicher dauerhafter Neuberechnung aller Ziel-Events quittiert.
- Pro Event existiert eine serielle Queue. Gleichzeitig gestartete Hintergrund-, Übersichts- und Detailaktualisierungen können nicht mehr in umgekehrter Reihenfolge zurückschreiben.
- Eine Refresh-Transaktion besitzt eine harte 55-s-Grenze; ein blockierter Hintergrundrequest kann dadurch spätere manuelle Reloads nicht dauerhaft sperren.
- Favoriten-Sammelläufe bleiben vollständig; die allgemeine 20-Event-Schutzgrenze wird nicht auf Favoriten bzw. explizit ausgewählte Event-IDs angewandt.

## Monotone Persistenz statt Zeitstempel-Rücksprung

`EventPlan` transportiert zusätzlich:

- `sourceRevisionAt`: jüngste bekannte Modell-/Quellenrevision,
- `refreshStartedAt`: Start der Refresh-Transaktion,
- `refreshReason`: Auslöser der Neuberechnung.

Persistenz, geöffnete Eventdetails und Geräte-Sync vergleichen damit nicht mehr nur den später gesetzten `refreshedAt`. Ein später fertig gewordener Request mit älterer Modellquelle darf einen fachlich neueren Plan nicht mehr überschreiben.

## Hintergrundüberwachung und neue Modellläufe

Der Event-Monitor startet appweit mit der App und ist nicht davon abhängig, dass die Event-Sektion jemals geöffnet wurde.

Er reagiert auf:

- App-Start,
- Rückkehr aus dem Hintergrund / `visibilitychange`,
- `pageshow`,
- erneuten Fensterfokus,
- Wiederkehr der Netzwerkverbindung,
- fällige Eventpläne im 5-Minuten-Prüfraster,
- neue Modellläufe im 5-Minuten-Prüfraster,
- einen garantierten 30-Minuten-Fresh-Refresh als Fallback.

Die Modelllaufüberwachung fragt die bestehenden Best-Match-/Rapid-/Regional-/Global-Metadaten frisch ab und vergleicht Initialisierungs-/Verfügbarkeitszeiten je Modell. Ein neuer Lauf löst für die betroffenen Eventorte unmittelbar eine Neuberechnung aus und wartet nicht auf das 30-Minuten-Alter.

## Bestehende MID-Regeln

- Glocke/rote Änderung bleibt an meteorologisch relevante Änderungen gekoppelt; ein neuer Zeitstempel allein erzeugt weiterhin keine Warnmarkierung.
- Event-Zeitraum-PoP, Wetterzwilling, Nowcast, Hyperlokal-Anker, Flugwetter-Hazards, Windeinheiten und progressive Eventdarstellung bleiben erhalten.
- Der bestehende Geräte-Sync bleibt aktiv, berücksichtigt bei Eventplänen nun aber die Quellenrevision vor bloßen Abschlusszeitpunkten.
- Worker fachlich unverändert; lediglich Versionssynchronisation auf v0.9.53.9.

## Regression

Neue Required-Regression: `scripts/test-event-refresh-broker-model-runs-09539.mjs`.

Zusätzlich wurden die bestehenden Event-/Modell-/Hyperlokal-Regressionen an die neue Trennung von UI, Event-Engine und Refresh-Broker angepasst, ohne ihre fachlichen Schutzverträge abzuschwächen.

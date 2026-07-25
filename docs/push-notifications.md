# MID v0.7.95 – Installations- und Cloudflare-Anleitung

Diese Anleitung gehört zu:

- `MID-professional-replacement.zip`
- `MID-worker.zip`
- Cloudflare Worker: `https://mid-data-proxy.martinmolkentin.workers.dev`
- MID-Web-App: `https://meteomartini.github.io/MID/`

> **Aktualisierung von v0.7.92:** Bereits vorhandene KV-, VAPID- und Cron-Einstellungen bleiben gültig. In diesem Fall genügen die Installation der neuen Projekt-ZIP, der vollständige Austausch von `worker.js` und die Gesundheitsprüfung. Die Schritte 3 bis 8 müssen nicht wiederholt werden.

## 1. MID-Projekt in GitHub installieren

1. Öffne das Repository `MeteoMartini/MID`.
2. Wechsle in das Hauptverzeichnis.
3. Lade `MID-professional-replacement.zip` hoch. Der Dateiname muss exakt so lauten.
4. Ersetze eine dort vorhandene gleichnamige Datei.
5. Committe direkt in den Branch `main`.
6. Öffne in GitHub den Bereich **Actions**.
7. Warte, bis der Workflow **Install MID release and deploy** vollständig grün ist.
8. Öffne anschließend MID und prüfe im Systemstatus die Version `0.7.95`.

## 2. Worker-Code in Cloudflare aktualisieren

**Worker-Upload erforderlich: Ja.**

1. Entpacke `MID-worker.zip`.
2. Öffne das Cloudflare-Dashboard.
3. Öffne **Workers & Pages**. Diese Produktbezeichnung bleibt in der deutschen Oberfläche häufig englisch.
4. Wähle den Worker **mid-data-proxy** beziehungsweise den Worker mit der Adresse `mid-data-proxy.martinmolkentin.workers.dev`.
5. Öffne **Code bearbeiten** beziehungsweise **Code bearbeiten und bereitstellen**.
6. Markiere den gesamten vorhandenen Quellcode und lösche ihn.
7. Öffne lokal `worker.js`, kopiere den vollständigen Inhalt und füge ihn in Cloudflare ein.
8. Klicke auf **Bereitstellen**.
9. Warte etwa eine Minute.
10. Öffne `https://mid-data-proxy.martinmolkentin.workers.dev/?mode=health`. Erwartet wird unter anderem `"version":"0.7.95"`.

## 3. KV-Speicher für Push-Abonnements anlegen

1. Öffne im Cloudflare-Dashboard **Speicher und Datenbanken** beziehungsweise **Workers KV**.
2. Öffne **KV**.
3. Klicke auf **Instanz erstellen**.
4. Vergib den Namen `MID Push Subscriptions`.
5. Klicke auf **Erstellen**.

Der sichtbare Name ist frei wählbar. Der spätere Bindungsname muss dagegen exakt stimmen.

## 4. KV an den Worker binden

1. Öffne wieder **Workers & Pages**.
2. Wähle den Worker `mid-data-proxy`.
3. Öffne **Einstellungen**.
4. Öffne **Bindungen**.
5. Klicke auf **Hinzufügen**.
6. Wähle **KV-Namespace**.
7. Trage als Variablenname exakt `MID_PUSH_SUBSCRIPTIONS` ein.
8. Wähle den zuvor angelegten Namespace `MID Push Subscriptions`.
9. Klicke auf **Bereitstellen**.

## 5. VAPID-Schlüssel erzeugen – nur bei einer erstmaligen Push-Einrichtung

Bereits für MID v0.7.92 eingerichtete VAPID-Schlüssel **nicht neu erzeugen**. Sie bleiben für v0.7.95 gültig.

### Ohne Mac-/Windows-PC direkt über Cloudflare

1. Erstelle unter **Workers & Pages → Anwendung erstellen → Worker erstellen** vorübergehend einen zweiten Worker, beispielsweise `mid-vapid-generator`.
2. Öffne dessen **Code bearbeiten**.
3. Ersetze den Beispielcode vollständig durch die mitgelieferte Datei `vapid-generator-worker.js`.
4. Ersetze in der ersten Zeile `HIER-EIGENEN-LANGEN-CODE-EINTRAGEN` durch einen eigenen langen Zugriffscode.
5. Klicke auf **Bereitstellen**.
6. Öffne die Generatoradresse mit `?code=DEIN-ZUGRIFFSCODE`.
7. Kopiere `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` und `VAPID_SUBJECT` gemeinsam in eine gesperrte Notiz. Jede Aktualisierung erzeugt ein neues Paar.
8. Lösche den Hilfs-Worker unmittelbar danach wieder vollständig.

### Alternativ mit Node.js

Im entpackten Ordner kann `node generate-vapid.mjs` ausgeführt werden.

Ersetze bei `VAPID_SUBJECT` die Beispieladresse durch eine reale Kontaktadresse. Der private Schlüssel darf niemals in GitHub oder in den öffentlichen Worker-Code gelangen.

## 6. Öffentliche Variablen in Cloudflare eintragen

1. Öffne den Worker `mid-data-proxy`.
2. Öffne **Einstellungen**.
3. Öffne **Variablen und Geheimnisse**.
4. Klicke auf **Hinzufügen**.
5. Lege folgende Werte als Typ **Text** an:

| Variablenname | Wert |
|---|---|
| `VAPID_PUBLIC_KEY` | öffentlicher Schlüssel aus Schritt 5 |
| `VAPID_SUBJECT` | `mailto:DEINE-ADRESSE@example.com` |
| `MID_ALLOWED_ORIGIN` | `https://meteomartini.github.io` |
| `MID_APP_URL` | `https://meteomartini.github.io/MID/` |

6. Klicke auf **Bereitstellen**.

Bei `MID_ALLOWED_ORIGIN` gehört kein `/MID/` an das Ende. Bei `MID_APP_URL` ist der vollständige Pfad einschließlich abschließendem Schrägstrich richtig.

## 7. Privaten VAPID-Schlüssel als Geheimnis eintragen

1. Bleibe unter **Einstellungen → Variablen und Geheimnisse**.
2. Klicke auf **Hinzufügen**.
3. Wähle als Typ **Geheimnis**.
4. Variablenname: `VAPID_PRIVATE_KEY`.
5. Wert: der private Schlüssel aus Schritt 5.
6. Klicke auf **Bereitstellen**.

Der private Schlüssel darf nicht als normaler Textwert gespeichert werden.

## 8. Cron-Trigger einrichten

1. Öffne den Worker `mid-data-proxy`.
2. Öffne **Einstellungen**.
3. Öffne **Trigger**.
4. Öffne **Cron-Trigger**.
5. Klicke auf **Hinzufügen**.
6. Trage exakt ein:

```text
*/5 * * * *
```

7. Speichere den Trigger.

Damit prüft der Worker die aktiven Favoritenregeln alle fünf Minuten.

## 9. Worker-Konfiguration prüfen

Öffne nacheinander:

```text
https://mid-data-proxy.martinmolkentin.workers.dev/?mode=health
https://mid-data-proxy.martinmolkentin.workers.dev/?mode=push-config
```

Bei `health` muss die Version `0.7.95` erscheinen. Unter den Anbietern muss `WebPush` auf `true` stehen.

Bei `push-config` muss ungefähr erscheinen:

```json
{
  "enabled": true,
  "publicKey": "...",
  "version": "0.7.95"
}
```

Steht dort `enabled: false`, fehlt mindestens einer dieser Punkte:

- KV-Bindung `MID_PUSH_SUBSCRIPTIONS`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Der Cron-Trigger wird durch `push-config` nicht überprüft und muss zusätzlich unter **Einstellungen → Trigger → Cron-Trigger** sichtbar sein.

## 10. GitHub-Workeradresse prüfen

Im GitHub-Repository unter **Settings → Secrets and variables → Actions → Variables** muss stehen:

```text
VITE_METAR_PROXY_URL=https://mid-data-proxy.martinmolkentin.workers.dev
```

Optional können auch diese Variablen auf dieselbe Adresse zeigen:

```text
VITE_ALERT_PROXY_URL=https://mid-data-proxy.martinmolkentin.workers.dev
VITE_RADAR_PROXY_URL=https://mid-data-proxy.martinmolkentin.workers.dev
```

Nach einer Änderung dieser GitHub-Variablen muss MID erneut gebaut und veröffentlicht werden.

## 11. Push auf iPhone oder iPad aktivieren

1. Öffne `https://meteomartini.github.io/MID/` in Safari.
2. Öffne das Teilen-Menü.
3. Wähle **Zum Home-Bildschirm**.
4. Öffne MID danach über das neue Symbol auf dem Home-Bildschirm.
5. Öffne in MID **Einstellungen → Benachrichtigungen**.
6. Aktiviere für die gewünschten Favoriten **Niederschlagsbeginn** und/oder **Gewitterzelle nähert sich**.
7. Tippe auf **Benachrichtigungen aktivieren**.
8. Bestätige die iOS-Abfrage mit **Erlauben**.

Push funktioniert auf iPhone und iPad nur in der installierten Home-Bildschirm-Web-App, nicht in einem normalen Safari-Tab.

## 12. Push auf Android aktivieren

1. Öffne MID in Chrome.
2. Wähle **App installieren** beziehungsweise **Zum Startbildschirm hinzufügen**.
3. Öffne die installierte MID-App.
4. Öffne **Einstellungen → Benachrichtigungen**.
5. Aktiviere die gewünschten Favoritenregeln.
6. Tippe auf **Benachrichtigungen aktivieren**.
7. Bestätige die Android-Berechtigung.

## 13. Abschließende Kontrolle

- MID zeigt Version `0.7.95`.
- Die aktuelle Übersicht enthält die zehnte Karte **Sonne / Mond**.
- Im erweiterten Modus zeigt die Luftdruckkarte die Änderung über drei Stunden.
- `?mode=health` meldet `0.7.95` und `WebPush: true`.
- `?mode=push-config` meldet `enabled: true`.
- Der Cron-Trigger `*/5 * * * *` ist sichtbar.
- Nach Push-Aktivierung liegt im KV-Namespace mindestens ein Schlüssel vor, der mit `sub:` beginnt.

## Fehlerbehebung

### `push-config` meldet `enabled: false`

Prüfe KV-Bindung und alle vier VAPID-Einträge. Achte auf exakte Groß-/Kleinschreibung.

### MID meldet „Worker ist nicht konfiguriert“

Prüfe in GitHub `VITE_METAR_PROXY_URL` und veröffentliche MID anschließend erneut.

### Benachrichtigungen sind auf iOS nicht verfügbar

Öffne MID zwingend über das Home-Bildschirm-Symbol. Prüfe außerdem unter **iOS-Einstellungen → Mitteilungen → MID**, ob Mitteilungen erlaubt sind.

### Keine Gewitterbenachrichtigung außerhalb Deutschlands

Die Regel verwendet derzeit DWD KONRAD3D und ist auf das deutsche Radarverbundgebiet ausgerichtet.

### Keine sofortige Testnachricht

MID sendet nur dann eine Nachricht, wenn die jeweilige Wetterbedingung tatsächlich eintritt. Der Cron-Lauf prüft im Abstand von fünf Minuten.


## Neu in MID v0.7.95: Push für den Standortverfolgungs-Ort

Ist unter **Einstellungen → Favoriten** die Standortverfolgung aktiviert, erscheint unter **Einstellungen → Benachrichtigungen** zusätzlich der Eintrag **Aktueller Standort**. Dort lassen sich „Niederschlagsbeginn“ und „Gewitterzelle nähert sich“ unabhängig von den gespeicherten Favoriten aktivieren.

MID aktualisiert die dafür verwendeten Koordinaten bei jeder erfolgreichen automatischen Standortbestimmung. Solange die App geschlossen ist, verwendet der Cloudflare Worker die zuletzt erfolgreich übermittelte Position. Eine dauerhafte Hintergrund-Ortung durch MID findet nicht statt.

Die bestehende Cloudflare-Konfiguration bleibt unverändert. Nach dem Update ist lediglich die neue `worker.js` v0.7.95 bereitzustellen; KV-Bindung, VAPID-Schlüssel und Cron-Trigger werden weiterverwendet.


### Standortwechsel und Ereigniszustand

Ändert sich die automatisch bestimmte Position, übermittelt MID die neuen Koordinaten bei einem bereits aktiven Push-Abonnement erneut. Der Worker erkennt den Koordinatenwechsel und beginnt für dieses Standortziel mit einem frischen Ereigniszustand. So kann ein bereits am vorherigen Ort aktiver Regen- oder Gewitterzustand eine Meldung am neuen Ort nicht unterdrücken.

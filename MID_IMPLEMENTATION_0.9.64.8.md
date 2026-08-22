# MID v0.9.64.8

## Amtliche Warnungen: lokale statt landesweite Zuordnung

- Die in v0.9.64.6 ergänzte MeteoAlarm-Live-Zuordnung bleibt erhalten, wird aber fachlich enger gefasst: MeteoAlarm stellt für Warngebiete **Bounding Boxes** bereit. Eine Box ist deshalb nur noch Kandidat für die Standortzuordnung und nicht mehr automatisch ein exakter Flächentreffer.
- Bei mehreren Warngebietsboxen, die denselben Ort überdecken, bewertet MID zuerst den lokalen Orts-/Regions-/Bezirksbezug. Ein passender Bezirk wie **Linz-Land** gewinnt damit vor breiten Regionen, dem ganzen Land und überlappenden Nachbarbezirken.
- Die Auswahl erfolgt je Warnart und Warnstufe. Gibt es keinen belastbaren administrativen Texttreffer, bleibt für Fälle wie Stegna/Rhodos der bisher benötigte koordinatenbasierte Fallback erhalten; dann wird je Warnart nur die kleinste passende Warngebietsbox verwendet.
- CAP-Polygone und -Kreise bleiben weiterhin exakt. Bei CAP-Datensätzen ohne Geometrie wird zuerst der eigentliche Orts-/Regions-/Bezirksname geprüft und erst danach das ausgewählte MeteoAlarm-Warngebiet als Fallback verwendet.
- Dadurch werden nicht mehr mehrere Warnungen eines ganzen Landes oder überlappender Fremdgebiete für einen einzelnen Ort angezeigt. Die Regression schützt gleichzeitig den in v0.9.64.6 korrigierten Griechenland-/Dodekanes-Fall.

## Letzten Ort und Prognoseansicht wiederherstellen

- Der ausgewählte Ort wurde bereits über `mid:lastLocation` dauerhaft gespeichert und beim nächsten Start vor einem Standardfavoriten wiederhergestellt. Dieser bestehende Vertrag bleibt unverändert geschützt.
- Neu merkt MID zusätzlich die zuletzt genutzte Haupt-Prognoseansicht: **Aktuell**, **Kurzfrist**, **7 Tage** oder **14 Tage**.
- Nach dem ersten verfügbaren Forecast wird die Ansicht ohne Smooth-Scroll und ohne zusätzlichen Wetterabruf wiederhergestellt. Ein expliziter Deep-Link/Hash hat Vorrang.
- Der Forecast-Cockpit-Horizont bleibt ebenfalls erhalten. Beide reinen UI-Zustände sind ausdrücklich **gerätelokal** und werden nicht in den Geräte-Sync aufgenommen. Dadurch erzeugt das Wechseln zwischen Aktuell/7 Tage/14 Tage keine neuen KV-Synchronisationsschreibvorgänge.

## Cloudflare Workers KV: weitere Einsparungen ohne Funktionsverlust

Die bereits in v0.9.63.0 umgesetzten Maßnahmen sind weiterhin vorhanden:

- fällige Push-Subscriptions werden über kleine KV-Metadaten und abgestufte 5-/15-/60-/720-Minuten-Kadenzen ausgewählt;
- `list()` nutzt 1.000 Schlüssel pro Seite;
- Subscription-Zustände werden nur bei tatsächlicher Zustandsänderung, Benachrichtigung oder einmaliger Metadatenmigration geschrieben;
- keine Alarmregel und keine Wetterdatenquelle wurde entfernt.

Zusätzlich in v0.9.64.8:

- Eine unveränderte Push-Registrierung beim erneuten Appstart erzeugt **keinen** weiteren KV-`put`. `updatedAt` ändert sich nur noch bei einer fachlichen Konfigurationsänderung.
- Der erfolgreiche Scheduler-Heartbeat wird statt ungefähr alle zehn Minuten höchstens alle **30 Minuten** geschrieben. Fehler erzeugen weiterhin sofort einen Heartbeat. Die Push-Prüfkadenzen selbst bleiben unverändert.
- Der Geräte-Sync schreibt beim `pagehide` nur noch, wenn tatsächlich eine lokale Änderung mit `pendingChangedAt` aussteht. Ein bloßes Öffnen und Schließen der App erzeugt dadurch keinen neuen Geräte-Sync-Write.
- Der Operations-Audit wurde auf `mid.kv-operations-audit.v2` erweitert. Das Heartbeat-Budget sinkt von zuletzt höchstens 144 auf höchstens **48 Writes/Tag**; die bisherige Subscription-Leseeinsparung bleibt erhalten.

## Regression und Release

- Neue Regression für überlappende österreichische MeteoAlarm-Warngebiete (Land, Bundesland, Linz-Land und überlappender Nachbarbezirk).
- Neue Regression für Standort-/Ansichtspersistenz, gerätelokalen UI-Zustand, idempotente Push-Registrierung, konditionalen `pagehide`-Sync und das neue KV-Auditbudget.
- Der bestehende Stegna-/Dodekanes-Test bleibt verbindlich.
- App, Worker, generierte Aggregate, Service Worker und Versionsmetadaten werden auf **0.9.64.8** synchronisiert.
- **Worker-Upload ist erforderlich**, da sowohl Warngebietszuordnung als auch KV-Schreiblogik im Worker geändert wurden.

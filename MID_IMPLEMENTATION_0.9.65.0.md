# MID v0.9.65.0 – KV-/Sync-Effizienz und kompakte Info-Controls

## Ziel

Die Cloudflare-KV-Operationslast wird weiter reduziert, ohne Warnkadenzen, Datenquellen, Wetterzwilling-Lerninhalt, Geräte-Sync oder Bedienfunktionen zu entfernen. Gleichzeitig wird die seit v0.9.52.3 sichtbare Touch-Regressionswirkung der Info-Buttons korrigiert.

## Push-Scheduler

- Die 5-Minuten-Prüfung für Niederschlag/Gewitter bleibt unverändert.
- Ein kleiner KV-Scheduler-Index (`mid-push-schedule-index-v2`) ersetzt im Normalbetrieb die bisherige `KV.list()`-Abfrage bei jedem 5-Minuten-Cronlauf.
- Der Index wird bei Registrierung/Änderung sofort aktualisiert und viermal täglich (00/06/12/18 UTC) sowie beim Bootstrap automatisch gegen die echten `sub:`-Keys reconciliiert.
- Fehlende/stale Einträge heilen sich über Reconciliation bzw. beim Auswerten eines nicht mehr vorhandenen Subscriptionschlüssels selbst.
- Push-Abmeldung ist als vorhandener Routerpfad nun auch tatsächlich im Worker implementiert und räumt den Scheduler-Index mit auf.
- Alarmquellen und Reaktionszeiten bleiben unverändert: 5 min Niederschlag/Gewitter, 15 min Lüftung, 60 min reine Prognoseänderung.

## Wetterzwilling-Archiv

- Identische Beobachtungen innerhalb desselben Zeit-Slots erzeugen keinen neuen Archivstand mehr.
- Forecast-Captures desselben 3-h-Slots werden nur ersetzt, wenn sich der fachliche Vorhersageinhalt tatsächlich geändert hat; reine `issuedAt`-/Lead-Time-Verschiebungen lösen keinen Vollarchiv-Sync aus.
- Unveränderte Referenzreihen und beim Restore/Import inhaltlich identische Stores bleiben write-frei.
- Archivänderungen werden clientseitig in einem festen 10-Minuten-Fenster zusammengeführt. Lokale Speicherung/IndexedDB erfolgt weiterhin sofort; nur der verschlüsselte Cloud-Vollupload wird gebündelt.
- Der reguläre 2-Minuten-Geräteabgleich zieht weiterhin Remote-Änderungen, lädt aber nicht mehr bei jedem Tick automatisch ein lokal geändertes Vollarchiv hoch.
- Nach App-Neustart wird ein lokal noch nicht gesicherter Archivstand automatisch nachgezogen.

## Geräte-Sync

- Portable Snapshots erhalten einen SHA-256-Inhaltssignatur-Vertrag. Ein lokaler Änderungszyklus, der wieder exakt beim bereits synchronisierten Inhalt endet, verursacht keinen KV-Write.
- Zusammenhängende lokale Änderungen werden drei Sekunden gebündelt; lokale Persistenz bleibt sofortig.
- `pagehide` schreibt nur bei ausstehender Änderung und nur, wenn der Inhalts-Hash vom zuletzt gesicherten Stand abweicht.

## Info-Buttons

- Die sichtbare Größe der Info-Buttons wird auf die kompakte bisherige Gestaltung zurückgeführt.
- Die Touch-Trefferfläche bleibt trotzdem groß: sie wird layoutneutral über ein unsichtbares Pseudoelement erweitert.
- Info-Buttons in den aktuellen Messwertkacheln stehen wieder konsistent rechts im Header.

## Worker

Worker-Update ist erforderlich, weil Scheduler-Index, Index-Reconciliation und Push-Abmeldebereinigung im Worker liegen.

# MID v0.9.53.8

## Aktuelles Wetter: astronomischer Tag-/Nachtwechsel

- Das Haupt-Wetterpiktogramm verwendet nicht mehr bis zum nächsten API-Reload ausschließlich den statischen `current.is_day`-Snapshot.
- Sonnenaufgang und Sonnenuntergang werden aus der vorhandenen standortbezogenen Astronomie abgeleitet.
- Der aktuelle Tag-/Nachtstatus wird spätestens binnen einer Minute und gezielt an der nächsten Sonnenauf-/untergangsgrenze neu bewertet; Focus/Visibility-Rückkehr aktualisiert sofort.
- Die Sonnenschein-Plausibilisierung verwendet denselben Live-Tag-/Nachtstatus.

## Events & Aktivitäten: einheitlicher Refresh-Owner

- Appweiter Reload und Event-Center-Header persistieren den Refresh-Auftrag zusätzlich zum Live-Event. Dadurch geht ein Klick nicht verloren, wenn der lazy Hintergrund-Owner noch nicht gemountet ist.
- Der Hintergrund-Owner verarbeitet offene Aufträge beim Mounten, bei Focus/Visibility, nach Wiederkehr der Netzverbindung und prüft alle fünf Minuten, ob ein Event älter als 30 Minuten ist.
- Refreshes werden pro Event über einen gemeinsamen, modulweiten Coordinator serialisiert. Ein neuer manueller/detailbezogener Refresh bricht einen älteren Hintergrundlauf ab; ein überholter Request darf nicht mehr in LocalStorage committen.
- Übersichtsreloads lesen vor Berechnung und Commit den jeweils neuesten gespeicherten Event-Datensatz.
- Während eines laufenden manuellen Refreshs eintreffende weitere Reload-Aufträge werden persistent nachgezogen.

## Regression

Neue Pflichtregression: `scripts/test-current-solar-event-background-09538.mjs`.

## Buildfix nach Installer-Regressionslauf

- Die ältere appweite Niederschlags-/Tageswarn-Regression wurde an den seit v0.9.53.8 absichtlich astronomisch nachgeführten `currentIsDay`-Status angepasst. Die Prüfung wird damit nicht abgeschwächt, sondern schützt nun den neuen Sonnenauf-/untergangsvertrag statt des überholten API-Snapshots `current.is_day`.
- Der Event-Hintergrundowner behält zusätzlich zum neuen 5-Minuten-Stale-Check den geschützten garantierten 30-Minuten-Autorefresh. Damit bleiben alter Integrationsvertrag und die neue robustere Hintergrundaktualisierung gleichzeitig erfüllt.

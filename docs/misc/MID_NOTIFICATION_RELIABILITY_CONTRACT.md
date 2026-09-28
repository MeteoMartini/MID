# MID – verbindlicher Vertrag für zuverlässige Benachrichtigungen

Dieser Vertrag gilt ab MID v0.9.53.30 app-weit und ergänzt `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_STATE_INTEGRITY_CONTRACT.md`.

## 1. „Aktiv“ bedeutet Ende-zu-Ende funktionsfähig

MID darf Benachrichtigungen nicht allein deshalb als aktiv darstellen, weil im Browser ein `PushSubscription`-Objekt existiert. Für den Status **Aktiv** müssen gleichzeitig nachweisbar sein:

- Browser-/PWA-Push wird unterstützt und die Berechtigung ist erteilt,
- auf dem Gerät existiert ein gültiges Push-Abonnement,
- genau dieses Abonnement ist im MID-Worker/KV registriert,
- der periodische Worker-Prüfzyklus ist durch einen aktuellen Scheduler-Heartbeat bestätigt.

Fehlt eine Stufe, muss MID den konkreten Zustand als reparatur-/prüfbedürftig anzeigen. Ein lokales Abonnement darf einen fehlenden Worker-Eintrag oder einen nicht laufenden Cron nicht verdecken.

## 2. Ende-zu-Ende-Test

Für ein im Worker registriertes Gerät muss die Benachrichtigungseinstellung eine echte Testmitteilung anbieten. Diese wird über denselben Worker-, VAPID- und Browser-Push-Pfad wie Wettermitteilungen versandt. Eine rein lokale `Notification` gilt nicht als Ende-zu-Ende-Test.

Ein fehlender Worker-Eintrag muss ohne Löschen der Browserberechtigung erneut registrierbar sein.

## 3. Niederschlagsbeginn

Niederschlagsbenachrichtigungen verwenden keine isolierte Rohschwelle einer einzigen Datenreihe. Der Worker muss die appweit etablierte Niederschlagskonsistenz berücksichtigen:

- 15-Minuten-Niederschlagsmenge,
- Niederschlagswahrscheinlichkeit,
- Wettercode/Niederschlagsart,
- Regen-/Schauer-/Schneeanteile,
- zentrale `reconcileForecastPrecipitation`-Logik.

Ein bevorstehender Niederschlagsbeginn wird im vom Nutzer gewählten Vorwarnfenster erkannt. Der Vorlauf muss mindestens 15, 30, 45, 60, 90 und 120 Minuten unterstützen; zusätzlich muss eine Mindest-Ereignismenge einstellbar sein. Eine Beginnwarnung darf **nicht erst bei bereits laufendem Niederschlag** ausgelöst werden. Ist das gewählte Vorwarnfenster wegen einer übergeordneten Meldungspause verstrichen, wird keine verspätete „Beginn“-Meldung nachgeschoben. Ein bereits vorab gemeldetes Ereignis darf beim eigentlichen Beginn nicht als zweites neues Ereignis gemeldet werden. Erst nach einem zwischenzeitlich trockenen/ereignisfreien Zustand darf ein neuer Niederschlagszyklus erneut auslösen. Die geräteweite Meldungspause bleibt für Niederschlag, Gewitter, Lüftung und Vorhersageänderungen übergeordnet verbindlich.

## 4. Keine stillen Regelverluste

Aktivierte Benachrichtigungsregeln für Favoriten dürfen weder im Frontend noch im Worker still abgeschnitten werden. Eine technische Grenze müsste explizit gemeldet und die Speicherung abgelehnt werden; stilles `slice(...)` oder Verdrängen ist unzulässig.

## 5. Scheduler-Beobachtbarkeit

Jeder periodische Push-Prüflauf schreibt einen Heartbeat mit Start-/Endzeit und Zahl der geprüften Abonnements. Der Gerätestatus kann dadurch unterscheiden zwischen:

- vollständig betriebsbereit,
- Browser-Push vorhanden, Worker-Registrierung fehlt,
- Worker-Registrierung vorhanden, Scheduler/Cron nicht bestätigt,
- Push technisch nicht konfiguriert.

Der Scheduler muss alle Seiten der KV-Auflistung abarbeiten; eine erste Listenseite darf nicht stillschweigend als vollständiger Empfängerbestand behandelt werden.

## 6. Required Regression

Jeder Release muss automatisiert prüfen, dass:

- Push-Status Worker-Registrierung und Scheduler-Heartbeat auswertet,
- eine echte Worker-Testmitteilung verfügbar ist,
- Niederschlagsbeginn die zentrale Niederschlags-Reconciliation einschließlich 15-Minuten-Wahrscheinlichkeit verwendet,
- Vorwarnzeit und Mindestmenge persistiert und an den Worker übertragen werden,
- keine verspätete Beginnwarnung erst bei bereits laufendem Niederschlag erfolgt und die geräteweite Meldungspause Vorrang behält,
- Push-Favoriten nicht still auf eine feste Anzahl gekappt werden,
- der Scheduler paginierte KV-Ergebnisse vollständig verarbeitet.

Ein Verstoß ist eine Release-Regression.

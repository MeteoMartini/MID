# MID v0.9.53.53 – Netatmo OAuth für iOS/PWA als vorbereiteter Browser-Flow

## Ursache

Auf iOS in der installierten PWA kann eine top-level Navigation über den Worker und dessen anschließenden 302-Redirect zu einem externen OAuth-Anbieter dazu führen, dass die Web-App beendet bzw. neu gestartet wird, bevor die Netatmo-Oberfläche sichtbar wird. Außerdem darf der serverseitig gespeicherte OAuth-Token nicht davon abhängen, dass Browser und installierte PWA denselben lokalen Storage-Kontext teilen.

## Umsetzung

- MID bereitet die Netatmo-Autorisierungs-URL über `netatmo-auth-start` bereits vor dem Nutzertap vor.
- Der eigentliche Tap navigiert deshalb ohne vorgeschaltetes `await` direkt auf die validierte `https://api.netatmo.com/oauth2/authorize`-Adresse.
- In einer installierten Standalone-PWA wird Netatmo in einem externen Browserkontext geöffnet; die MID-PWA bleibt bestehen.
- Beim Zurückkehren zu MID wird der Netatmo-Status automatisch über `visibilitychange` neu eingelesen.
- Der Worker transportiert die `connectionId` bei Erfolg und Fehler als `mid_station_connection` zurück. Dadurch bleibt die serverseitige OAuth-Verbindung auch dann zuordenbar, wenn Safari und PWA unterschiedliche Web-Storage-Kontexte verwenden.
- Die UI zeigt während der serverseitigen Vorbereitung ausdrücklich `Netatmo-Anmeldung wird vorbereitet …` und lässt den Button erst danach aktiv werden.

## Unverändert

- OAuth-Scope `read_station`.
- Authorization-Code-Flow und Callback-URI.
- Worker-seitige AES-GCM-Tokenverschlüsselung.
- Wetter-, Stations-, Wetterzwilling- und Lüftungslogik.

# MID v0.9.53.45 – Eigene Wetterstationen & Lüftungsassistent Stufe 1

## Ziel
Netatmo wird wieder als private Wetterstation per OAuth eingebunden. Innenraumsensoren können für einen prognosegestützten Lüftungsassistenten verwendet werden. Stufe 1 bleibt ausdrücklich beratend: Anzeige und Push-Hinweise, keine Aktorsteuerung.

## Stationsanbindung
- Netatmo-OAuth (`read_station`) ist im Frontend wieder aktiv; Nutzer werden zur Netatmo-Freigabe weitergeleitet und müssen keine Tokens kopieren.
- Access-/Refresh-Tokens verbleiben verschlüsselt im Worker-KV und werden nicht über den Gerätesync verteilt.
- Außenmesswerte werden vor Verwendung auf Aktualität, Distanz und Plausibilität geprüft.
- Eine plausible eigene Außenstation kann das Modul „Aktuelles Wetter“ speisen und – bei aktiviertem Wetterzwilling – als lokale Beobachtung archiviert werden.
- Der vorhandene Standard-JSON-Adapter bleibt im erweiterten Modus als Bridge-Option erhalten.

## Innenraumsensoren
- Netatmo-Hauptmodul und zusätzliche Innenmodule werden als Räume erkannt.
- Temperatur, relative Feuchte und – sofern vorhanden – CO₂ werden übernommen.
- Innenraummessungen älter als 90 Minuten erzeugen keine aktive Lüftungsempfehlung.
- Pro Raum kann die Nutzung aktiviert und ein zulässiges Zeitfenster festgelegt werden (`frühestens` / `spätestens`, auch über Mitternacht).

## Lüftungsassistent Stufe 1
Die Entscheidung wird zentral im Worker berechnet und nicht parallel im Frontend nachgebaut. Berücksichtigt werden:
- Innenraumtemperatur,
- relative und daraus berechnete absolute Feuchte,
- CO₂ als Dringlichkeitssignal,
- prognostizierte Außentemperatur und Außenfeuchte,
- Niederschlagsmenge und Niederschlagswahrscheinlichkeit,
- Gewitter-Wettercodes,
- Windböen,
- nutzerdefinierte erlaubte Lüftungszeiten.

Der Assistent liefert je Raum `Jetzt lüften`, `Später lüften`, `Derzeit nicht nötig` oder `Kein gutes Fenster`, eine empfohlene Dauer sowie eine kurze Begründung.

## Benachrichtigungen
- Der bestehende MID-Web-Push wird um Lüftungsfenster erweitert.
- Nur neue, unmittelbar beginnende/günstige Fenster werden gemeldet; der bestehende Benachrichtigungsabstand bleibt wirksam.
- Keine Fenster-, Lüfter-, Klima- oder Home-Automation-Aktion wird ausgelöst.

## Worker-Konfiguration
Für Netatmo bleiben erforderlich:
- `MID_PUSH_SUBSCRIPTIONS`
- `NETATMO_CLIENT_ID`
- `NETATMO_CLIENT_SECRET`
- `MID_STATION_TOKEN_KEY`

Für Lüftungs-Push zusätzlich die bereits vorhandene VAPID/Cron-Konfiguration des MID-Pushdienstes.

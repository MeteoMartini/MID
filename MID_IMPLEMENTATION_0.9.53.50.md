# MID v0.9.53.50

Netatmo-OAuth-Navigationsfix.

- Worker sendet `response_type=code` am Netatmo-Authorize-Endpunkt.
- OAuth-Rückkehr mit `mid_station` öffnet automatisch Einstellungen → Lokaler Wetterzwilling.
- Neue Regression für OAuth-Start, Navigation und Rückkehr.
- Worker-Upload erforderlich, da die OAuth-Start-URL im Worker geändert wurde.
